# ADR-0006: Tailwind is the only styling system for extension UI

| Status | ✅ Accepted         |
| ------ | ------------------- |
| Date   | 2026-05-04          |
| Scope  | `apps/extension` UI |

## Context

The HUD has dozens of panels, a settings dialog with twenty sections, and a strong visual identity ([ADR-0007](ADR-0007-DESIGN-MD-SOURCE-OF-TRUTH.md)). Multiple contributors and coding agents touch the UI. Without a single styling system, ad hoc `<style>` blocks and CSS-in-JS creep in and the design drifts.

## Decision

- **Tailwind CSS only.** Utilities on elements; shared patterns are named with `@layer components` / `@layer base` and `@apply` in the **single entry stylesheet** [`apps/extension/entrypoints/newtab/tailwind.css`](../../apps/extension/entrypoints/newtab/tailwind.css).
- No other authored global CSS files, no inline `<style>` for layout, no CSS-in-JS, no parallel design system.
- Every `<button>` (and `label.btn`) must have `:hover` and `:active` feedback, normally via the shared `.btn` / `.linkish` classes; a test guards those selectors.
- Icons are **Lucide** (`lucide-react`) with plain-language `aria-label`s on icon-only controls.
- Theme values (palette, mode, control shape) are applied as CSS variables on `<html>` **before React mounts** (`applyDocumentTheme` in `main.tsx`) so there is no flash of the wrong theme.

## Consequences

- Theme packs ([ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md)) can be implemented purely as CSS-variable overrides with no bundle growth.
- New contributors have one file to learn for shared classes; reviewers can reject any second stylesheet on sight.
- The marketing site ([ADR-0018](ADR-0018-STATIC-MARKETING-SITE-ON-GITHUB-PAGES.md)) uses Tailwind via CDN for the same reason, even though it is outside the pnpm workspace.

## References

- [`.cursor/rules/project-conventions.mdc`](../../.cursor/rules/project-conventions.mdc) — "Styling (Tailwind only)"
- [`.cursor/rules/extension-button-interaction-states.mdc`](../../.cursor/rules/extension-button-interaction-states.mdc), [`extension-lucide-icons.mdc`](../../.cursor/rules/extension-lucide-icons.mdc)
- [`apps/extension/lib/tailwind-btn-states.test.ts`](../../apps/extension/lib/tailwind-btn-states.test.ts)
