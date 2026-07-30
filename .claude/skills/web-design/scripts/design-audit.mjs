#!/usr/bin/env node
// design-audit.mjs
//
// Evidence-gathering script for a rendered web page. Run this AFTER a design
// change is live (dev server or deployed URL) and BEFORE calling the work
// done. It exists to surface facts an agent cannot get from reading source
// code alone: actual rendered geometry, actual computed styles, actual
// contrast math, actual console/network noise, actual focus behavior.
//
// Usage:
//   node scripts/design-audit.mjs <url> [--out <dir>]
//
// Default output dir: ./design-audit/
//   <out>/screenshot-<width>.png   full-page screenshot per breakpoint
//   <out>/report.json             structured findings
//
// Exit code: 0 normally, 1 if at least one Blocker-severity finding exists
// (or if the audit could not run at all).
//
// GOLDEN RULE: never invent findings. If a check didn't run (navigation
// failed, a browser API is unavailable, etc.) that is reported explicitly as
// "did not run" — it is never silently treated as a pass. See `skippedChecks`
// bookkeeping throughout.
//
// Severity rubric (Blocker / High / Medium / Nitpick) — this script only
// reports mechanically verifiable facts, never taste:
//   Blocker : normal-text contrast failure, horizontal overflow at 375px,
//             browser console errors, page failed to load at all.
//   High    : large-text contrast failure, horizontal overflow at wider
//             breakpoints, tap targets under 44x44, missing focus indicator,
//             missing alt text, failed/erroring network requests.
//   Medium  : console warnings, animations still running under
//             prefers-reduced-motion: reduce, contrast that could not be
//             resolved (UNKNOWN — flagged for human review, not asserted
//             as a failure).
//   (Nitpick is reserved for cosmetic mechanical facts; this script does not
//   currently emit any — it has nothing purely cosmetic-and-mechanical to
//   check. The category exists so callers can add such checks later.)

import fs from 'node:fs';
import path from 'node:path';

const WIDTHS = [375, 768, 1024, 1440];
const NAV_TIMEOUT_MS = 30_000;
const IDLE_GRACE_MS = 5_000; // best-effort settle time, never fails the audit
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [role="button"], [tabindex]';
const MAX_DETAILS_PER_CATEGORY = 40; // cap noisy pages; totals are still reported

function parseArgs(argv) {
  let url = null;
  let outDir = './design-audit';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      outDir = argv[++i];
    } else if (!url && !a.startsWith('--')) {
      url = a;
    }
  }
  return { url, outDir };
}

function printInstallHelp(context, err) {
  console.error(`ERROR: ${context}`);
  console.error('Install Playwright and its Chromium browser with:\n');
  console.error('  npx playwright install chromium\n');
  if (err && err.message) console.error(`(underlying error: ${err.message})`);
}

// ---------------------------------------------------------------------------
// In-page evaluation. Everything below runs INSIDE the browser via
// page.evaluate — it cannot close over any Node-side variables or functions,
// so every helper it needs must be declared inside this function body.
// ---------------------------------------------------------------------------
function collectPageFindings(viewportWidth) {
  // Build a short, human-readable-enough CSS path for an element so a human
  // can find it in devtools without us shipping a full XPath.
  function cssPath(el) {
    if (!(el instanceof Element)) return '(unknown)';
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      let sel = node.nodeName.toLowerCase();
      if (node.id) {
        sel += '#' + CSS.escape(node.id);
        parts.unshift(sel);
        break;
      }
      if (node.classList && node.classList.length) {
        sel += '.' + Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c)).join('.');
      }
      let sibIndex = 1;
      let sib = node;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName === node.nodeName) sibIndex++;
      }
      sel += `:nth-of-type(${sibIndex})`;
      parts.unshift(sel);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // rgb()/rgba() computed-style parser. getComputedStyle always normalizes
  // colors to rgb()/rgba(), so this is the only format we need to handle.
  function parseColor(str) {
    if (!str) return { r: 0, g: 0, b: 0, a: 0 };
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
  }

  // Standard "source-over" alpha compositing: lays `top` over `bottom`.
  function compositeOver(top, bottom) {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 255, g: 255, b: 255, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a,
    };
  }

  // Walk up from a text element looking for its effective background.
  // Why walk up at all: an element's own background is very often
  // transparent, and the real background is painted by an ancestor. We stop
  // climbing the first time we hit an opaque color. If we hit a
  // background-image anywhere in the chain, we genuinely cannot know the
  // pixel color behind the text (could be anything in the image), so we
  // report UNKNOWN rather than guessing — guessing white/black here would
  // silently fabricate a pass or fail. If we reach the top of the document
  // without ever finding an opaque color, the real rendered background is
  // the browser's default white canvas, which is a fact, not a guess.
  function resolveBackground(el) {
    let node = el;
    const layers = [];
    while (node) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        return { unknown: true, reason: 'background-image on ' + cssPath(node) };
      }
      const c = parseColor(cs.backgroundColor);
      layers.push(c);
      if (c.a >= 0.999) break;
      node = node.parentElement;
    }
    let result = { r: 255, g: 255, b: 255, a: 1 }; // default browser canvas
    if (layers.length && layers[layers.length - 1].a >= 0.999) {
      result = layers.pop();
    }
    // Composite remaining layers from outermost-remaining down to the
    // element itself (layers[0]), each one painted "over" what we have so far.
    for (let i = layers.length - 1; i >= 0; i--) {
      result = compositeOver(layers[i], result);
    }
    return result;
  }

  function srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function relLuminance(c) {
    return 0.2126 * srgbToLinear(c.r) + 0.7152 * srgbToLinear(c.g) + 0.0722 * srgbToLinear(c.b);
  }
  function contrastRatio(c1, c2) {
    const L1 = relLuminance(c1);
    const L2 = relLuminance(c2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  // WCAG "large text": >=24px any weight, or >=18.66px (~14pt) at bold (>=700).
  function isLargeText(fontSizePx, fontWeight) {
    const w = parseInt(fontWeight, 10) || 400;
    return fontSizePx >= 24 || (fontSizePx >= 18.66 && w >= 700);
  }

  const result = {
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    overflowElements: [],
    tapTargets: [],
    focusIssues: [],
    missingAlt: [],
    contrastFailures: [],
    contrastUnknown: [],
    // True counts, kept separate from the (possibly capped) detail arrays.
    // Custom properties stashed directly on an array (e.g. arr.total) do NOT
    // survive the structured-clone hop back across page.evaluate() to
    // Node — only index entries do — so counts must live on a plain object.
    totals: {
      overflowElements: 0, tapTargets: 0, focusIssues: 0,
      missingAlt: 0, contrastFailures: 0, contrastFailuresNormal: 0,
      contrastFailuresLarge: 0, contrastUnknown: 0,
    },
  };
  const CAP = 40;
  function push(key, item) {
    result.totals[key]++;
    if (result[key].length < CAP) result[key].push(item);
  }

  // 1. Horizontal overflow: find the specific elements poking past the
  // viewport edge, not just the boolean fact that scrollWidth > innerWidth.
  if (result.scrollWidth > result.viewportWidth + 1) {
    const offenders = [];
    const all = document.querySelectorAll('body *');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > result.viewportWidth + 1) {
        offenders.push({
          selector: cssPath(el),
          box: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },
          right: Math.round(rect.right),
        });
      }
    }
    offenders.sort((a, b) => b.right - a.right);
    const seen = new Set();
    for (const o of offenders) {
      if (seen.has(o.selector)) continue;
      seen.add(o.selector);
      push('overflowElements', o);
    }
  }

  // 2 & 3. Tap targets and focus styles share the same interactive element set.
  const interactiveEls = Array.from(document.querySelectorAll(
    'a, button, input, select, textarea, [role="button"], [tabindex]'
  )).filter(isVisible);

  for (const el of interactiveEls) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      push('tapTargets', { selector: cssPath(el), width: Math.round(rect.width), height: Math.round(rect.height) });
    }
  }

  function focusSignature(el) {
    const cs = getComputedStyle(el);
    // outline-offset is not reset by the `outline` shorthand, so
    // `outline: none` still leaves a nonzero outline-offset in computed
    // style. That offset has zero visual effect when nothing is actually
    // drawn, so only fold it into the signature when an outline is really
    // rendered — otherwise a page that fully suppresses outline:focus would
    // wrongly look like it "changed something" and dodge this check.
    const outlineRenders = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    return [
      cs.outlineStyle, cs.outlineWidth, cs.outlineColor, outlineRenders ? cs.outlineOffset : '0px',
      cs.boxShadow,
      cs.borderTopStyle, cs.borderTopWidth, cs.borderTopColor,
      cs.borderRightStyle, cs.borderRightWidth, cs.borderRightColor,
      cs.borderBottomStyle, cs.borderBottomWidth, cs.borderBottomColor,
      cs.borderLeftStyle, cs.borderLeftWidth, cs.borderLeftColor,
    ].join('|');
  }
  const previouslyActive = document.activeElement;
  for (const el of interactiveEls) {
    if (typeof el.focus !== 'function') continue;
    const before = focusSignature(el);
    el.focus({ preventScroll: true });
    // Only meaningful if focus actually landed on this element (e.g. a
    // disabled input silently refuses focus).
    const focusLanded = document.activeElement === el;
    const after = focusSignature(el);
    if (typeof el.blur === 'function') el.blur();
    if (focusLanded && before === after) {
      push('focusIssues', { selector: cssPath(el) });
    }
  }
  if (previouslyActive && typeof previouslyActive.focus === 'function') {
    previouslyActive.focus({ preventScroll: true });
  }

  // 4. Images missing alt text (decorative images explicitly marked via
  // role="presentation"/role="none"/aria-hidden="true" are exempt).
  for (const img of document.querySelectorAll('img')) {
    const role = img.getAttribute('role');
    const ariaHidden = img.getAttribute('aria-hidden');
    if (role === 'presentation' || role === 'none' || ariaHidden === 'true') continue;
    const alt = img.getAttribute('alt');
    if (alt === null || alt.trim() === '') {
      push('missingAlt', { selector: cssPath(img), src: img.getAttribute('src') || '(no src attribute)' });
    }
  }

  // 5. Text contrast. We treat any visible element with a direct
  // (non-whitespace) text node child as one "text node to check" — this
  // naturally dedupes nested markup (a <p><span>text</span></p> has no direct
  // text of its own once the text lives in the span).
  for (const el of document.querySelectorAll('body *')) {
    if (!isVisible(el)) continue;
    let hasOwnText = false;
    for (const child of el.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim().length > 0) {
        hasOwnText = true;
        break;
      }
    }
    if (!hasOwnText) continue;
    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize);
    const large = isLargeText(fontSize, cs.fontWeight);
    const textColor = parseColor(cs.color);
    const bg = resolveBackground(el);
    const selector = cssPath(el);
    if (bg.unknown) {
      push('contrastUnknown', { selector, reason: bg.reason });
      continue;
    }
    const effText = textColor.a < 0.999 ? compositeOver(textColor, bg) : textColor;
    const ratio = contrastRatio(effText, bg);
    const threshold = large ? 3.0 : 4.5;
    if (ratio < threshold) {
      result.totals[large ? 'contrastFailuresLarge' : 'contrastFailuresNormal']++;
      push('contrastFailures', {
        selector,
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        large,
        color: cs.color,
        background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        sampleText: (el.textContent || '').trim().slice(0, 60),
      });
    }
  }

  return result;
}

// Runs after a reload with reducedMotion:'reduce'. Uses the real
// Web Animations API state (document.getAnimations()) rather than statically
// reading CSS, because that's the only way to know an animation is actually
// still *playing* right now versus merely declared in a stylesheet.
function collectReducedMotionFindings() {
  function cssPath(el) {
    if (!(el instanceof Element)) return '(unknown)';
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      let sel = node.nodeName.toLowerCase();
      if (node.id) {
        sel += '#' + CSS.escape(node.id);
        parts.unshift(sel);
        break;
      }
      let sibIndex = 1;
      let sib = node;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName === node.nodeName) sibIndex++;
      }
      sel += `:nth-of-type(${sibIndex})`;
      parts.unshift(sel);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  if (typeof document.getAnimations !== 'function') {
    return { supported: false, runningAnimations: [] };
  }
  const running = [];
  for (const anim of document.getAnimations()) {
    if (anim.playState !== 'running') continue;
    const timing = anim.effect && typeof anim.effect.getTiming === 'function' ? anim.effect.getTiming() : {};
    const duration = typeof timing.duration === 'number' ? timing.duration : 0;
    if (!(duration > 0)) continue; // zero-duration effects aren't perceptible motion
    const target = anim.effect && anim.effect.target ? anim.effect.target : null;
    running.push({
      selector: target ? cssPath(target) : '(unknown target)',
      name: anim.animationName || anim.id || '(transition)',
      durationMs: duration,
      playState: anim.playState,
    });
    if (running.length >= 40) break;
  }
  return { supported: true, runningAnimations: running };
}

async function auditWidth(browser, url, width, outDir) {
  const widthReport = {
    width,
    navigationError: null,
    skippedChecks: [],
    consoleMessages: [],
    failedRequests: [],
    screenshot: null,
    checks: null,
    reducedMotion: null,
  };
  const findings = [];

  let context;
  try {
    context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        widthReport.consoleMessages.push({ type, text: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      widthReport.consoleMessages.push({ type: 'error', text: `Uncaught: ${err.message}` });
    });
    page.on('requestfailed', (req) => {
      widthReport.failedRequests.push({ url: req.url(), reason: req.failure()?.errorText || 'request failed' });
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        widthReport.failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    try {
      await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
    } catch (err) {
      widthReport.navigationError = err.message;
      findings.push({
        severity: 'Blocker',
        category: 'navigation-failed',
        width,
        summary: `Page failed to load at ${width}px within ${NAV_TIMEOUT_MS}ms: ${err.message}`,
        details: [],
      });
      widthReport.skippedChecks = [
        'screenshot', 'horizontal-overflow', 'tap-targets', 'focus-styles',
        'missing-alt', 'contrast', 'reduced-motion',
      ];
      await context.close();
      return { widthReport, findings };
    }

    // Best-effort settle time for async content (images, fonts, late JS).
    // Never fails the audit — if the page just never goes idle (e.g. an
    // open websocket), we proceed with whatever has rendered so far.
    await page.waitForLoadState('networkidle', { timeout: IDLE_GRACE_MS }).catch(() => {});

    const screenshotPath = path.join(outDir, `screenshot-${width}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      widthReport.screenshot = screenshotPath;
    } catch (err) {
      widthReport.skippedChecks.push('screenshot');
      findings.push({
        severity: 'Medium',
        category: 'screenshot-failed',
        width,
        summary: `Could not capture screenshot at ${width}px: ${err.message}`,
        details: [],
      });
    }

    let pageResult = null;
    try {
      pageResult = await page.evaluate(collectPageFindings, width);
    } catch (err) {
      widthReport.skippedChecks.push(
        'horizontal-overflow', 'tap-targets', 'focus-styles', 'missing-alt', 'contrast'
      );
      findings.push({
        severity: 'Medium',
        category: 'in-page-checks-failed',
        width,
        summary: `In-page mechanical checks could not run at ${width}px: ${err.message}`,
        details: [],
      });
    }

    if (pageResult) {
      widthReport.checks = pageResult;

      if (pageResult.scrollWidth > pageResult.viewportWidth + 1) {
        findings.push({
          severity: width === 375 ? 'Blocker' : 'High',
          category: 'horizontal-overflow',
          width,
          summary: `Horizontal overflow: document scrollWidth ${pageResult.scrollWidth}px > viewport ${pageResult.viewportWidth}px`,
          details: pageResult.overflowElements,
        });
      }
      if (pageResult.tapTargets.length) {
        findings.push({
          severity: 'High',
          category: 'tap-target-size',
          width,
          summary: `${pageResult.totals.tapTargets} interactive element(s) under 44x44 CSS px`,
          details: pageResult.tapTargets,
        });
      }
      if (pageResult.focusIssues.length) {
        findings.push({
          severity: 'High',
          category: 'missing-focus-style',
          width,
          summary: `${pageResult.totals.focusIssues} interactive element(s) show no visible change (outline/box-shadow/border) on focus`,
          details: pageResult.focusIssues,
        });
      }
      if (pageResult.missingAlt.length) {
        findings.push({
          severity: 'High',
          category: 'missing-alt-text',
          width,
          summary: `${pageResult.totals.missingAlt} <img> element(s) missing meaningful alt text`,
          details: pageResult.missingAlt,
        });
      }
      // The combined contrastFailures array (normal + large together) may be
      // capped before we split it here, so per-severity detail lists can be a
      // subset of the true per-severity total — report both.
      const normalFails = pageResult.contrastFailures.filter((c) => !c.large);
      const largeFails = pageResult.contrastFailures.filter((c) => c.large);
      if (pageResult.totals.contrastFailuresNormal) {
        findings.push({
          severity: 'Blocker',
          category: 'contrast-normal-text',
          width,
          summary: `${pageResult.totals.contrastFailuresNormal} normal-text element(s) below 4.5:1 contrast`,
          details: normalFails,
        });
      }
      if (pageResult.totals.contrastFailuresLarge) {
        findings.push({
          severity: 'High',
          category: 'contrast-large-text',
          width,
          summary: `${pageResult.totals.contrastFailuresLarge} large-text element(s) below 3:1 contrast`,
          details: largeFails,
        });
      }
      if (pageResult.contrastUnknown.length) {
        findings.push({
          severity: 'Medium',
          category: 'contrast-unknown',
          width,
          summary: `${pageResult.totals.contrastUnknown} element(s) have a background we could not resolve to a solid color (e.g. behind a background-image) — needs manual review, not asserted as pass or fail`,
          details: pageResult.contrastUnknown,
        });
      }
    }

    // Reduced motion: reload the SAME page with reducedMotion emulation so
    // the CSS `prefers-reduced-motion` media query actually flips, then ask
    // the live Web Animations API what's still playing.
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload({ waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
      await page.waitForLoadState('networkidle', { timeout: IDLE_GRACE_MS }).catch(() => {});
      const motionResult = await page.evaluate(collectReducedMotionFindings);
      widthReport.reducedMotion = motionResult;
      if (!motionResult.supported) {
        widthReport.skippedChecks.push('reduced-motion');
      } else if (motionResult.runningAnimations.length) {
        findings.push({
          severity: 'Medium',
          category: 'reduced-motion-ignored',
          width,
          summary: `${motionResult.runningAnimations.length} animation(s)/transition(s) still running under prefers-reduced-motion: reduce`,
          details: motionResult.runningAnimations,
        });
      }
    } catch (err) {
      widthReport.skippedChecks.push('reduced-motion');
      findings.push({
        severity: 'Medium',
        category: 'reduced-motion-check-failed',
        width,
        summary: `Reduced-motion re-check failed at ${width}px: ${err.message}`,
        details: [],
      });
    }

    const consoleErrors = widthReport.consoleMessages.filter((m) => m.type === 'error');
    const consoleWarnings = widthReport.consoleMessages.filter((m) => m.type === 'warning');
    if (consoleErrors.length) {
      findings.push({
        severity: 'Blocker',
        category: 'console-error',
        width,
        summary: `${consoleErrors.length} browser console error(s)`,
        details: consoleErrors,
      });
    }
    if (consoleWarnings.length) {
      findings.push({
        severity: 'Medium',
        category: 'console-warning',
        width,
        summary: `${consoleWarnings.length} browser console warning(s)`,
        details: consoleWarnings,
      });
    }
    if (widthReport.failedRequests.length) {
      findings.push({
        severity: 'High',
        category: 'failed-network-request',
        width,
        summary: `${widthReport.failedRequests.length} failed/erroring network request(s)`,
        details: widthReport.failedRequests,
      });
    }

    await context.close();
  } catch (err) {
    // Something unexpected blew up the whole width pass (browser crash, etc).
    // Report the crash explicitly rather than silently producing a thin report.
    findings.push({
      severity: 'Blocker',
      category: 'audit-crashed',
      width,
      summary: `Audit crashed while auditing ${width}px: ${err.message}`,
      details: [],
    });
    widthReport.skippedChecks.push('all-remaining-checks-at-this-width');
    if (context) await context.close().catch(() => {});
  }

  return { widthReport, findings };
}

function severityRank(sev) {
  return { Blocker: 0, High: 1, Medium: 2, Nitpick: 3 }[sev] ?? 4;
}

function printSummary(report) {
  const bySeverity = { Blocker: [], High: [], Medium: [], Nitpick: [] };
  for (const f of report.findings) {
    (bySeverity[f.severity] || bySeverity.Nitpick).push(f);
  }

  console.log('');
  console.log(`Design audit: ${report.url}`);
  console.log(`Widths checked: ${WIDTHS.join(', ')}`);
  console.log('='.repeat(60));

  for (const sev of ['Blocker', 'High', 'Medium', 'Nitpick']) {
    const items = bySeverity[sev];
    if (!items.length) continue;
    console.log(`\n${sev.toUpperCase()} (${items.length})`);
    for (const f of items) {
      console.log(`  [${f.width}px] ${f.category}: ${f.summary}`);
    }
  }

  const anySkips = report.widths.some((w) => w.skippedChecks.length || w.navigationError);
  if (anySkips) {
    console.log('\nChecks that DID NOT RUN (absence here is not a pass):');
    for (const w of report.widths) {
      if (w.navigationError) {
        console.log(`  [${w.width}px] page failed to load: ${w.navigationError} — all checks skipped`);
      } else if (w.skippedChecks.length) {
        console.log(`  [${w.width}px] skipped: ${w.skippedChecks.join(', ')}`);
      }
    }
  }

  const total = report.findings.length;
  if (total === 0 && !anySkips) {
    console.log('\nNo issues found by any mechanical check across all widths.');
  }
  console.log('\n' + '='.repeat(60));
  console.log(`Report written to: ${report.reportPath}`);
}

async function main() {
  const { url, outDir } = parseArgs(process.argv.slice(2));
  if (!url) {
    console.error('Usage: node design-audit.mjs <url> [--out <dir>]');
    process.exit(1);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    printInstallHelp('the "playwright" package could not be loaded.', err);
    process.exit(1);
    return;
  }

  let browser;
  try {
    browser = await playwright.chromium.launch();
  } catch (err) {
    printInstallHelp('Playwright Chromium browser is not installed.', err);
    process.exit(1);
    return;
  }

  const report = {
    url,
    generatedAt: new Date().toISOString(),
    widths: [],
    findings: [],
    reportPath: path.join(outDir, 'report.json'),
  };

  try {
    for (const width of WIDTHS) {
      const { widthReport, findings } = await auditWidth(browser, url, width, outDir);
      report.widths.push(widthReport);
      report.findings.push(...findings);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  report.findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.width - b.width);

  fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
  printSummary(report);

  const hasBlocker = report.findings.some((f) => f.severity === 'Blocker');
  process.exit(hasBlocker ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL: design-audit crashed unexpectedly.');
  console.error(err.stack || err.message);
  process.exit(1);
});
