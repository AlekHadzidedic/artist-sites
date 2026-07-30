# Layout

## Spacing rhythm

Base unit **4px**; every space on the page is a step from one scale:

```
4  8  12  16  24  32  48  64  96  128  160
```

(Tailwind: `1 2 3 4 6 8 12 16 24 32 40`.) Two adjacent elements' relationship is encoded by which step separates them — related things at 8–16, distinct things at 24–48, sections at 96+. If you find yourself typing an arbitrary value (`mt-[37px]`), the rhythm is broken; snap to a step.

Section vertical padding: **64–96px mobile, 96–160px desktop** for editorial pages; **24–48px** for utilitarian surfaces. Consecutive sections vary in density — a dense section (grid of cards) follows an airy one (single statement + whitespace). Three equally-dense sections in a row read as a wall.

Whitespace is load-bearing: on an editorial page, if less than ~40% of the viewport at any scroll position is empty ground, the page is overcrowded.

## Grid and widths

- **12-column grid**, gutter 24px (desktop) / 16px (mobile), for anything that needs columns. Most pages need only its simple derivatives: 2-, 3-, 4-up.
- Page content max-width: **1152–1280px** (`max-w-6xl` / `max-w-7xl`), centered. Full-bleed is a deliberate per-section choice (images, marquees, color fields), not the default.
- Prose max-width: **65ch**, set on the text block, not the section.
- Asymmetry is a free source of character: a 5/7 or 4/8 split reads as designed; a centered stack reads as templated. Use centered layouts when the content is genuinely symmetric (a single statement, a form).

## Breakpoints

Use Tailwind defaults — do not invent custom breakpoints without a content-driven reason:

| Token | Width | Design target |
|---|---|---|
| (base) | <640 | 375px — single column, stacked |
| `sm` | 640 | large phones/landscape |
| `md` | 768 | tablet — usually where 2-up begins |
| `lg` | 1024 | laptop — full grid engages |
| `xl` | 1280 | desktop — max-width caps growth |

Design mobile-first in the code (base styles = mobile, prefixes add up). Verify at 375, 768, 1024, 1440 plus mobile landscape (`844×390`) — the audit script does this mechanically.

## Composition

Section order is an argument, not a template. Derive it from the brief: what must a skeptical visitor believe first, second, third? The generic SaaS stack (centered hero → 3-up features → logo strip → pricing → FAQ) is on the cliché list — if your section order matches it, re-derive from the content.

ASCII wireframes are the ideation tool — cheap enough to make two and compare (see `direction.md` for the format). Wireframe at desktop and mobile widths for any layout with columns; a 5/7 split must have a stated stacking order.

CSS mechanics that prevent common breakage:

- One layout method per container: flex for 1-D rows/stacks (`flex flex-col gap-*`), grid for 2-D. Never margins between siblings when a `gap` can do it — margins on children leak out of containers and collapse unpredictably.
- Watch selector specificity when mixing type-based section styles (`.section`) with element styles (`.cta`) — padding/margin rules cancel each other silently. Prefer utilities on the element over descendant selectors.
- `min-width: 0` (Tailwind `min-w-0`) on flex children that contain text, or long words force horizontal overflow.
- Sticky elements need an explicitly taller scroll parent; `overflow-x: hidden` on an ancestor silently kills `position: sticky`.

## Do Not

- Do not use arbitrary spacing values off the scale (`mt-[37px]`, `p-[22px]`).
- Do not put three consecutive sections at the same visual density.
- Do not default to the SaaS section stack or to a centered hero when the content isn't symmetric.
- Do not let any element cause horizontal scroll at 375px — this is a shipping Blocker.
- Do not size prose in pixels; use `ch`-based max-width.
- Do not use margins for spacing between flex/grid siblings; use `gap`.
- Do not add custom breakpoints for a layout problem that reordering or fluid sizing solves.
- Do not use zero-radius broadsheet styling (hairline rules, dense columns) as a default (cliché list).
