# Tailwind v4 + shadcn/ui

## Critical rules (good React/Tailwind hygiene, shadcn or not)

- `className` for layout (`max-w-md`, `mx-auto`, `mt-4`), never for overriding component colors or typography. Customization order: built-in variant → semantic token → CSS variable → new `cva` variant in the component source.
- Semantic colors only: `bg-primary`, `text-muted-foreground` — never `bg-blue-500`, and never raw colors for status (`text-emerald-600` → `text-destructive`, a Badge variant, or a defined `--warning` token).
- No `space-x-*`/`space-y-*`. Use `flex gap-*`; vertical stacks are `flex flex-col gap-*`.
- `size-10`, not `w-10 h-10`, when width and height are equal.
- `truncate`, not `overflow-hidden text-ellipsis whitespace-nowrap`.
- No manual `dark:` color overrides — semantic tokens handle both modes. `bg-background text-foreground`, not `bg-white dark:bg-gray-950`.
- `cn()` for conditional classes, not template-literal ternaries: `cn("flex items-center", isActive ? "bg-primary text-primary-foreground" : "bg-muted")`.
- No manual `z-index` on overlay components — Dialog, Sheet, Drawer, AlertDialog, DropdownMenu, Popover, Tooltip, HoverCard handle their own stacking. Never `z-50`/`z-[999]` on them.

Component substitutions — use the primitive, not a hand-roll:

| Instead of | Use |
|---|---|
| `<hr>` | `Separator` |
| custom `animate-pulse` divs | `Skeleton` |
| styled `<span>` status chips | `Badge` |
| custom empty-state markup | `Empty` |
| custom shimmer keyframes | `shimmer` utility |
| hand-rolled scroll-edge masks | `scroll-fade` / `scroll-fade-x` / `scroll-fade-b` |

A11y invariants: Dialog/Sheet/Drawer always contain a Title (use `VisuallyHidden` if the design hides it); Avatar always has `AvatarFallback`.

## Theming block (the whole model in one place)

Tokens as `name`/`name-foreground` pairs in OKLCH, light in `:root`, dark under `.dark`, surfaced to Tailwind via `@theme inline`, radius scale derived from one `--radius` token via `calc()` — full commented example in `references/color.md`. Dark mode is a **class toggle** (`next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`), not a bare media query — a user-facing toggle must be able to beat the OS preference.

## Tailwind v4 traps

- `tailwind.config` stays **blank** in `components.json`. Custom colors/fonts go in `@theme inline` in the global CSS file — writing v3-style `theme.extend` config into a v4 project is **silently inert** (no error, no effect).
- Add custom tokens to the file reported as `tailwindCssFile` by `info` (typically `globals.css`) — never a new CSS file.
- `@import "shadcn/tailwind.css"` is a real dependency: it backs the `data-open:`/`data-closed:` variants and the `shimmer`/`scroll-fade` utilities. Deleting it as an "unused import" silently breaks accordion/collapsible animations with no build error.

## radix vs base — check before composing

shadcn ships two parallel primitive libraries with **different APIs for the same component names**. Mismatches fail at runtime, not compile time. Run `npx shadcn@latest info` and read the `base` field **before writing composition code**.

| Surface | `radix` | `base` |
|---|---|---|
| Slot pattern | `asChild` prop | `render` prop |
| ToggleGroup / Accordion | `type="single" \| "multiple"` | `multiple` boolean |
| Slider value | array (`[50]`) | scalar or array by config |
| Select | items as children | `items` prop required |

## CLI ground truth

Substitute the project's real package manager — `pnpm dlx shadcn@latest …` in pnpm projects.

```bash
npx shadcn@latest info                  # project state: base, tailwindVersion, tailwindCssFile
npx shadcn@latest docs <component>      # then FETCH the returned URLs — never guess props
npx shadcn@latest search <query>        # before writing any custom UI, check it doesn't exist
npx shadcn@latest add button            # install
npx shadcn@latest add button --dry-run  # update workflow: see affected files first…
npx shadcn@latest add button --diff     # …then the diff, then decide
```

- Update flow is `--dry-run` → `--diff` → decide. `npx shadcn@latest diff` (bare) is not the workflow command — use `add --diff`.
- Never `--overwrite` without explicit user approval.
- `style` and `tailwind.baseColor` in `components.json` are **immutable after init** — changing them requires deleting and reinstalling all components. Say so instead of editing them.

## Registries

- In a custom registry's `registryDependencies`, `"button"` means the **official** shadcn button — never a same-repo item. Same-repo deps must be written `@namespace/item` or `owner/repo/item`.
- GitHub-repo registries: resolve the ref to a commit SHA before reading source — branch refs on `raw.githubusercontent.com` cache for minutes and serve stale files.

## Do Not

- Do not invent CLI flags, decode preset codes manually, or fetch component files raw from GitHub — the CLI is the interface.
- Do not write `theme.extend` in a `tailwind.config.js` for a v4 project — it does nothing.
- Do not compose shadcn components without checking the `base` field first.
- Do not remove `@import "shadcn/tailwind.css"` — it is load-bearing.
- Do not edit `style`/`tailwind.baseColor` post-init; do not `--overwrite` without approval.
- Do not override component colors/typography via `className`; do not use raw palette classes anywhere in components.
- Do not use `space-y-*`, `w-10 h-10` pairs, manual truncation stacks, `dark:` color overrides, className ternaries, or z-index on overlays.
- Do not ship a Dialog/Sheet/Drawer without a Title or an Avatar without AvatarFallback.
