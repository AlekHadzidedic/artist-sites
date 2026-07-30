# Motion

## Licensing — read first

**GSAP is 100% free, including every formerly-paid Club plugin** (SplitText, MorphSVG, DrawSVG, ScrollSmoother, all of it) since the Webflow acquisition. `npm install gsap` from public npm is the entire setup. Pre-2026 instinct to emit an `.npmrc` with a GreenSock auth token, point at `npm.greensock.com`, or tell users to join Club GSAP is **actively wrong** — never do any of those. Source: https://gsap.com/blog/webflow-GSAP/

## Which tool

Decide by need, not habit — and check `package.json` before adding anything (see `component-sources.md`: never silently add a motion library for one effect).

| Tool | Cost | Use for |
|---|---|---|
| CSS transitions/animations | 0 kB JS | **Default.** Hover/focus/press feedback, simple reveals, accordion open, marquees |
| Motion (`motion`, ex-framer-motion) | 132 kB min / 44.3 kB gzip naive; trims hard via `LazyMotion` + `m` | React-idiomatic gesture/layout animation, `whileInView`, `useScroll`, exit animations tied to unmount |
| GSAP + ScrollTrigger | core 69 kB min / 26.7 kB gzip; real hero+scroll+text page ≈ 35–50 kB gzip | Pinned sections, scrubbed scroll-linked timelines, SVG morph/draw, choreography that outgrows `whileInView` |

If the effect is achievable in CSS, use CSS. Escalate only when the choreography demands it.

## Duration bands (opinionated — use these absent a stated reason)

| Class | Duration | Ease |
|---|---|---|
| Micro-feedback: hover, press, focus, toggle | 100–150ms | `ease-out` |
| UI transition: dropdown, tooltip, tab, accordion, dialog | 150–250ms | `ease-out` in, `ease-in` out |
| Entrance/reveal: cards, sections entering viewport | 300–500ms | `power2.out` / `cubic-bezier(0.22, 1, 0.36, 1)` |
| Hero/page-load choreography | 400–700ms per element, total sequence ≤ 1.2s to readable content | mixed, `power2.out` bias |

Supporting numbers:

- GSAP defaults: duration **0.5s**, ease **`power1.out`** — fine for entrances, too slow for micro-feedback.
- Exit animations run **60–70% of the enter duration** — dismissal must feel more responsive than arrival.
- Stagger list/grid entrances **30–50ms per item** (`stagger: 0.04`); cap total stagger at ~600ms — beyond that, late items feel broken, so use `stagger: { each: 0.04, from: "start" }` on ≤15 items or batch.
- Text reveal char-by-char: `stagger: 0.03, duration: 0.4`.
- Scroll-reveal convention: `start: "top 80%"`, `end: "bottom 20%"`.
- `touch-action: manipulation` on tappable elements kills the 300ms tap delay on older mobile browsers; costs nothing.
- Animate `transform` (x/y/scale/rotation) and `opacity` only — compositor-friendly. Never animate `width`, `height`, `top`, `left`, `margin`, `padding` (layout thrash; the one exception is `height` on accordions, where CSS `grid-template-rows: 0fr→1fr` is the better tool).
- One orchestrated moment beats scattered effects. Three or more text effects on one page is the component-demo cliché.

## Reduced motion — graduated, not binary

`prefers-reduced-motion` means remove *travel, parallax, scale-jumps, and scrub* — not all change. Keep opacity crossfades (150–250ms); they communicate state without vestibular trigger. Ambient loops (marquees) pause entirely.

```css
/* CSS idiom */
@media (prefers-reduced-motion: reduce) {
  .reveal { transition-property: opacity; transform: none !important; }
  .marquee { animation-play-state: paused; }
}
```

```tsx
// Motion idiom
import { useReducedMotion } from "motion/react";
const reduce = useReducedMotion();
<m.div
  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
/>
```

```js
// GSAP idiom — named conditions via matchMedia
gsap.matchMedia().add(
  { reduceMotion: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" },
  (ctx) => {
    const { reduceMotion } = ctx.conditions;
    gsap.from(".card", reduceMotion
      ? { opacity: 0, duration: 0.2, stagger: 0.02 }          // fade only
      : { opacity: 0, y: 40, duration: 0.5, stagger: 0.04 }); // travel + fade
  }
);
```

## GSAP in Next.js App Router — the one correct shape

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function PinnedStory() {
  const container = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      // ScrollTrigger goes on the TIMELINE, never on a child tween
      const tl = gsap.timeline({
        scrollTrigger: { trigger: container.current, start: "top top", end: "+=1500", scrub: 1, pin: true },
      });
      tl.from(".panel-title", { opacity: 0, y: 60 })
        .from(".panel-body", { opacity: 0, y: 40 }, "-=0.2");
    },
    { scope: container } // without scope, ".panel-title" matches the whole document
  );

  // animations created in handlers run AFTER useGSAP — wrap or they never get reverted
  const onCardClick = contextSafe((el: HTMLElement) => gsap.to(el, { scale: 1.03, duration: 0.15 }));

  return <div ref={container}>{/* … */}</div>;
}
```

`useGSAP` reverts everything (including ScrollTriggers) on unmount. For SPA route changes outside that scope: `ScrollTrigger.getAll().forEach(t => t.kill())`.

## Do Not

- Do not put `scrollTrigger` on a child tween of a timeline — timeline or top-level tween only. Wrong: `gsap.timeline().to(".a", { scrollTrigger: {...} })`.
- Do not call `useGSAP` without `{ scope: containerRef }` when using selector strings.
- Do not create GSAP animations in event handlers without `contextSafe()` — they escape the context and never revert.
- Do not use any ease other than `"none"` on a `containerAnimation` horizontal-scroll tween — scroll and position desync.
- Do not stack `from()`/`fromTo()` on the same property without `immediateRender: false` on the later ones.
- Do not create ScrollTriggers out of page order without setting `refreshPriority`.
- Do not run GSAP or ScrollTrigger during SSR — client-only lifecycle (`"use client"` + `useGSAP`/`useEffect`).
- Do not use `scrub` and `toggleActions` on the same trigger; do not ship `markers: true`.
- Do not animate layout properties (`width`/`height`/`top`/`left`/`margin`/`padding`) — transforms and opacity only.
- Do not interpret reduced-motion as `duration: 0` everywhere — remove travel/parallax/scrub, keep short opacity fades, pause loops.
- Do not add Motion or GSAP to a project for an effect CSS can do, and never without flagging the dependency add.
