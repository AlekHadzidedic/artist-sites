# Typography

Typography carries the personality of the page. Pair faces deliberately — not the families you'd reach for on any project — and make the type treatment itself memorable, not a neutral delivery vehicle.

## Roles

| Role | Job | Rules |
|---|---|---|
| Display | Headlines, hero, section titles | Characterful, used with restraint — headings only, never body |
| Body | Paragraphs, UI text | Complementary to display, boring is fine, must read at 14–16px |
| Utility | Captions, data, labels, code | Often a mono or condensed grotesque; optional if content has no data |

Maximum **2–3 families** per page. Pairing rule: the pair must contrast strongly on exactly one axis (serif/sans, weight range, width, or era) and agree on the rest — two similar grotesques look like a mistake, two maximally different faces look like a ransom note.

Avoid Ultralight, Thin, and Light weights for anything functional (Apple HIG rule — they fail at small sizes and low-DPI). Display faces may go light only above ~40px.

## Scale

Pick one ratio, generate the scale from the body size, and use **at most 6 distinct sizes** on a page. More sizes than that means hierarchy is being faked with size instead of built with weight, color, and space.

| Surface | Ratio | Example scale from 16px |
|---|---|---|
| Utilitarian | 1.2 (minor third) | 12.8 · 16 · 19.2 · 23 · 27.6 · 33.2 |
| Editorial | 1.333 (perfect fourth) | 12 · 16 · 21.3 · 28.4 · 37.9 · 50.5 |
| Hero-dominant editorial | 1.5 for the top two steps only | body scale at 1.333, display jumps to 76/114 |

Hard numbers:

- Body text: **16px minimum** for UI, 17–18px for long-form reading. Never below 12px anywhere (Apple HIG floor: 11pt iOS, 10pt macOS — web equivalent ≈ 12px).
- Line-height: body **1.5–1.6**; headings **1.1–1.2**; display above 48px **1.0–1.1**.
- Letter-spacing: display faces above 32px get **-0.01em to -0.03em**; ALL-CAPS labels get **+0.05em to +0.1em** and a size drop to 11–13px. Body text gets none.
- Measure: **45–75ch**, target 65ch for prose. Enforce with `max-w-[65ch]`, not a pixel width.

## Fluid display sizing

One `clamp()` per fluid role; body text stays fixed (fluid body breaks measure discipline).

```css
/* 36px at 375px viewport → 72px at 1280px, linear between */
h1 {
  font-size: clamp(2.25rem, 1.32rem + 3.98vw, 4.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
}
```

Derivation: slope = (72 − 36) / (1280 − 375) = 0.0398 → 3.98vw; intercept = 36 − 0.0398 × 375 = 21.1px = 1.32rem. Recompute both for your actual endpoints rather than copying these numbers.

## Loading — Next.js App Router

`next/font` self-hosts, subsets, and injects `font-display: swap` automatically. Always use it; never a `<link>` to Google Fonts (adds a render-blocking third-party request and a GDPR problem).

```tsx
// app/fonts.ts
import { Fraunces, Archivo } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"], // load the optical-size axis for a variable face
});
export const body = Archivo({ subsets: ["latin"], variable: "--font-body" });
```

```tsx
// app/layout.tsx — variables on <html>, mapped in @theme inline (Tailwind v4)
<html className={`${display.variable} ${body.variable}`}>
```

```css
/* globals.css */
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}
/* now `font-display` / `font-body` utilities exist */
```

Prefer one variable font over 3+ static weights of the same family — smaller transfer, and intermediate weights (450, 550) become available for fine hierarchy.

## Do Not

- Do not use Inter or Space Grotesk as the display face (cliché list) unless the brief names them.
- Do not exceed 6 distinct font sizes or 3 families on one page.
- Do not set body text below 16px, line-height below 1.5, or measure beyond 75ch.
- Do not use Thin/Ultralight/Light weights below 40px.
- Do not apply negative letter-spacing to body text, or leave ALL-CAPS labels untracked.
- Do not load fonts via `<link href="fonts.googleapis.com…">` in a Next.js project — use `next/font`.
- Do not make body text fluid with `clamp()` — fluid sizing is for display roles only.
- Do not fake hierarchy with size alone; use weight, color (`text-muted-foreground`), and space first.
