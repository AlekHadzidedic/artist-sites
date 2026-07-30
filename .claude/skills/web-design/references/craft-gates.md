# Craft gates — the shipping checklist

A design is not done because the code compiles. It ships when it passes these gates, silently — quality floor, never announced in the UI or the copy.

## The gates

**Contrast**
- Body text 4.5:1 against its background; large text (≥24px, or ≥18.7px bold) 3:1.
- UI component boundaries, icons, and focus indicators 3:1 against adjacent colors.
- Placeholder text counts as text: 4.5:1.
- Check token pairs once at design time (`color.md`); the audit script checks rendered text.

**Keyboard & focus**
- Visible `:focus-visible` on every interactive element. Never `outline: none` without an equal-or-better replacement (e.g. `outline-2 outline-offset-2 outline-ring`).
- Full page operable by Tab alone, in a sensible order; no focus traps outside modals; modals trap and return focus.

**Touch**
- Tap targets ≥ 24×24 CSS px everywhere (WCAG 2.2), ≥ 44×44 for primary mobile actions; list rows ≥ 48px tall.
- `touch-action: manipulation` on tappable controls.

**Structure & forms**
- Semantic landmarks: one `<main>`, `<nav>`, `<header>`, `<footer>`; headings form a real outline (no skipped levels).
- Every input has a `<label>` (or `aria-label` where the design hides it). On submit error: `aria-invalid` on failed fields, an error message associated via `aria-describedby`, and focus moved to the first invalid field.
- Every `<img>` has `alt` — empty `alt=""` only for genuinely decorative images.

**Motion**
- `prefers-reduced-motion` respected, graduated per `motion.md`: travel/parallax/scrub removed, short opacity fades kept, ambient loops paused.

**Performance (CLS/LCP basics)**
- All media dimensioned: `width`/`height` attributes or CSS `aspect-ratio` — zero layout shift from loading images/embeds.
- Fonts via `next/font` (self-hosted, `font-display: swap` built in).
- No layout-shifting hover states: hover changes transform/opacity/color, never size, border-width, or font-weight.
- Hero/LCP image uses `priority` (Next `<Image>`), not lazy-loaded.

**Responsive**
- Verified at 375, 768, 1024, 1440 px, plus mobile landscape (844×390).
- No horizontal overflow at any width — Blocker if present at 375.
- Survives 200% browser text zoom and largest system text size without clipped or overlapping text.

## The review loop

1. Render the page (dev server or deployment).
2. `node scripts/design-audit.mjs <url>` — multi-width Playwright audit: screenshots each width, captures console errors, mechanically checks horizontal overflow, tap-target sizes, missing focus styles, images without `alt`, and contrast.
3. **Look at the screenshots.** Critique against the design plan, not just the checklist: is the signature landing? Is boldness spent in one place? Does any section read as the generic default? Apply the remove-one-accessory pass.
4. Fix, re-run, repeat until no Blocker/High remains.

If you could not open the page, say so plainly and report only what the heuristic script produced — never invent findings. Do not fabricate audit output; never present a failed run as results.

## Severity ranking

| Severity | Meaning | Gates shipping? |
|---|---|---|
| Blocker | Broken: horizontal overflow, unreadable contrast, keyboard-inoperable control, console error, missing form labels | Yes |
| High | Materially degrades use: sub-24px tap targets, missing focus styles, layout shift on load, reduced-motion ignored | Yes |
| Medium | Craft flaw: off-scale spacing, orphaned heading level, inconsistent radius | No — list it |
| Nitpick | "I'd prefer": taste-level suggestions | No — label as preference |

Distinguish "broken" from "I'd prefer" explicitly in every review report. Only Blocker/High block shipping.

## Do Not

- Do not declare UI work done without rendering it and looking at the output.
- Do not report findings for a page you could not open, or dress up a script failure as a clean pass.
- Do not gate shipping on Medium/Nitpick items, and do not ship over Blocker/High items.
- Do not announce the quality floor in the UI or copy ("fully accessible!") — it's a floor, not a feature.
- Do not fix contrast by darkening one instance — fix the token pair so every instance moves.
- Do not add `outline: none` anywhere without a visible replacement in the same rule.
- Do not skip the 375px and text-zoom checks because desktop "looks right".
