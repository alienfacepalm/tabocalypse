---
name: apply-design-dir
description: Apply Tabocalypse's `design/` directory UX examples (HTML/screens) to the extension UI by translating them into Tailwind tokens, shared component classes, and React layout structure. Use when the user says "apply the new design", "refactor UX to match design/", or references `design/` screens.
disable-model-invocation: true
---

# Apply `design/` dir to extension UI

## Inputs

- Root `DESIGN.md` (design source of truth)
- `design/**/code.html` (UX/layout examples)
- Extension UI entry: `apps/extension/entrypoints/newtab/app.tsx`
- Styling entry: `apps/extension/entrypoints/newtab/tailwind.css`
- Tokens: `apps/extension/tailwind.config.mjs`

## Workflow

1. **Extract invariants** from `DESIGN.md` and the relevant `design/**/code.html`.
2. **Translate tokens** into `tailwind.config.mjs` (semantic colors + fonts).
3. **Encode primitives** in `tailwind.css` (`.top-bar`, `.card`, `.btn`, overlays, grid helpers).
4. **Refactor layout** in `app.tsx` to match the example (header search, stable grid zones, HUD feel).
5. **Minimize component churn**: prefer changing shared classes over rewriting every widget.
6. **Validate**: `pnpm check`, and if UI/build was touched: `pnpm build`.
7. **Finish meaningful work**: commit + push (unless user asked not to).

## Translation defaults (glitch-core)

- **0px radius** everywhere by default.
- **Hard shadows** with 4px offset; accent-colored shadows for primary/secondary states.
- **Scanline overlay**: low-opacity repeating linear gradient overlay.
- **Terminal prompt inputs**: prefix `USER_LOG@TAB:>` in search/add-task fields.
