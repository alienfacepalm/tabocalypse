# ADR-0007: `DESIGN.md` (glitch-core) is the design source of truth

| Status | ✅ Accepted                                           |
| ------ | ----------------------------------------------------- |
| Date   | 2026-05-04; amended 2026-09 (optional control shapes) |
| Scope  | All user-facing UI, marketing site, theme packs       |

## Context

A new-tab page is judged on looks in the first second. The design brief ("a hijacked military terminal that mocks your tab hoarding") is deliberately confrontational and easy to dilute into generic rounded-card UI if every change is made ad hoc.

## Decision

- [`DESIGN.md`](../../DESIGN.md) is **authoritative** for brand, palette, typography, layout, elevation, shapes, components, and tone. Read it before any user-facing UI change; when other guidance conflicts on visual direction, `DESIGN.md` wins unless the user explicitly overrides.
- Core invariants: **Void Black** base with **Acid Green** and **Glitch Magenta** accents; **Space Mono** (loud, uppercase) + **JetBrains Mono** (body), Audiowide for the title; rigid **12-column HUD grid** with tight gutters; **glass** panels (blur, 60 % dark surface) with **hard 4 px offset shadows**; terminal prompt prefix `USER_LOG@TAB:>` on inputs; scanline overlay; judgmental tooltips.
- **Sharp (0 px) corners are the default.** _Amendment:_ users may opt into **Soft corners** or **Pill buttons** under **Settings › Appearance › Control shape**; these are accessibility/preference options applied through CSS radius tokens and do not change the brand default.
- The root `design/` folder holds reference HTML mock-ups (main console, note editor, to-do hub, tab-guilt intervention) that new screens should resemble.
- Every temperature reading uses the 2lakes.app colour scale defined in `DESIGN.md`.

## Consequences

- Visual PRs can be reviewed against a written standard rather than taste.
- Theme suites ([ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md)) are expressed as **deviations from `DESIGN.md` tokens**, so the default look stays the free "Glitch-Core" suite.
- Marketing material ([`doc/PLAN/MARKETING.md`](../PLAN/MARKETING.md)) inherits the same voice: sarcastic, loud, no soft "productivity app" tone.

## References

- [`DESIGN.md`](../../DESIGN.md), [`design/`](../../design/)
- [`.cursor/rules/design-md-source-of-truth.mdc`](../../.cursor/rules/design-md-source-of-truth.mdc), [`design-dir-ux-examples.mdc`](../../.cursor/rules/design-dir-ux-examples.mdc)
- [`apps/extension/lib/theme.ts`](../../apps/extension/lib/theme.ts) — `applyDocumentTheme`, `UI_SHAPES`
