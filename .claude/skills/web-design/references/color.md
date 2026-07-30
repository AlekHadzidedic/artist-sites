# Color

## Palette budget

4–6 named values, roles assigned up front:

- **Ground** — the page background. Rarely pure white (`oklch(1 0 0)`) or pure black; tint it toward the subject by 1–3% chroma.
- **Ink** — default text. Not pure black on light ground; `oklch(0.2–0.25 0.01–0.03 <hue>)` reads richer.
- **Surface** — cards/panels, one step off ground.
- **Accent** — one hue, held in reserve. If the accent appears in more than ~10% of the viewport, it is no longer an accent and emphasis has collapsed.
- **Optional**: a second muted support tone, a destructive/danger tone.

Emphasis comes first from typography, weight, and space; color is the scarcest resource on the page. A page that needs a legend to explain its colors has too many.

## Token architecture (the pattern, not just shadcn trivia)

CSS variables in `name` / `name-foreground` pairs — the base is a background, the `-foreground` is guaranteed-readable text on it. Pairing contrast is decided once, at the token level, so no component ever re-derives it:

```css
/* globals.css — Tailwind v4 */
:root {
  --background: oklch(0.97 0.008 85);
  --foreground: oklch(0.22 0.015 60);
  --primary: oklch(0.5 0.14 40);
  --primary-foreground: oklch(0.98 0.01 85);
  --muted: oklch(0.93 0.01 85);
  --muted-foreground: oklch(0.45 0.02 60);
  --border: oklch(0.88 0.01 85);
  --ring: oklch(0.5 0.14 40);
  --radius: 0.375rem;
}
.dark {
  --background: oklch(0.17 0.012 60);
  --foreground: oklch(0.94 0.008 85);
  --primary: oklch(0.68 0.12 40);
  --primary-foreground: oklch(0.15 0.02 60);
  --muted: oklch(0.23 0.012 60);
  --muted-foreground: oklch(0.68 0.015 60);
  --border: oklch(0.28 0.012 60);
  --ring: oklch(0.68 0.12 40);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

One `--radius` token derives the whole radius scale via `calc()` — change one number, the whole system moves.

Components use only semantic utilities (`bg-background`, `text-muted-foreground`, `border-border`). Raw palette classes (`bg-blue-500`, `text-gray-600`) are banned in component code — they bypass dark mode and fragment the palette.

## OKLCH — why and how

`oklch(L C H)`: lightness 0–1 (perceptually uniform — 0.7 yellow and 0.7 blue *look* equally light, unlike HSL), chroma 0–~0.37 (0 = gray), hue 0–360. Use it for all tokens because:

- Equal-L colors genuinely match in weight, so a hue swap doesn't break hierarchy.
- Palettes derive by arithmetic: a hover state is the same token with L shifted ±0.04; a muted variant is C halved.
- Predictable contrast: on light ground, text at L ≤ 0.45 vs ground at L ≥ 0.95 clears 4.5:1 for most hues (verify — this is a heuristic, not the WCAG formula).

## Dark mode

Class toggle, not media query alone: a user-facing toggle must beat the OS preference. Use `next-themes` with `attribute="class"`, tokens redefined under `.dark` (as above). Never write per-element `dark:` color overrides — if you're typing `dark:bg-gray-900`, the token layer has failed.

Dark is not inverted light. Rules:

- Ground at **L 0.14–0.19**, never `oklch(0 0 0)` — pure black makes elevation impossible and halation worse.
- Foreground at **L 0.92–0.96**, never pure white.
- Accents: raise L by ~0.1–0.2 and cut C by ~10–20% vs their light-mode value — saturated colors vibrate on dark grounds.
- Elevation via lighter surfaces (`L +0.04–0.06` per level), not shadows — shadows are invisible on dark.
- Borders lighten relative to ground (light mode: borders darker than ground; dark mode: lighter).

## Contrast thresholds (WCAG AA — these gate shipping)

| Element | Minimum |
|---|---|
| Body text | 4.5:1 against its background |
| Large text (≥24px, or ≥18.7px bold) | 3:1 |
| UI component boundaries, icons, focus indicators | 3:1 against adjacent colors |
| Placeholder text | 4.5:1 (it is still text; `muted-foreground` must clear it) |

Check every `name`/`name-foreground` pair once at the token level. `scripts/design-audit.mjs` checks rendered text mechanically; token-level pairs you verify at design time.

## Do Not

- Do not use raw palette utilities (`bg-blue-500`, `text-emerald-600`) in components — semantic tokens only, including for status colors (`text-destructive`, a defined `--warning`, or a Badge variant).
- Do not write `dark:` color overrides on elements — redefine tokens under `.dark`.
- Do not use pure black or pure white for ground/ink in either mode.
- Do not carry light-mode accent values into dark mode unchanged.
- Do not exceed one accent hue without a stated reason in the plan.
- Do not use color as the only carrier of meaning (state, chart series, required fields) — pair with a label, icon, or weight change.
- Do not use a purple-to-blue gradient hero, cream+terracotta, or black+acid-green by default (cliché list).
- Do not ship a `name`/`name-foreground` pair you haven't contrast-checked.
