# ADR-0017: Theme suites and brand kits are signed JSON theme packs on a free theme engine

| Status | 🧪 Proposed (plan approved for the board; nothing built yet) |
| ------ | ------------------------------------------------------------ |
| Date   | 2026-09-11                                                   |
| Scope  | Roadmap items PM-T080–PM-T087                                |

## Context

Today a "theme" is a palette swap plus dark/light mode and a control shape. Reskinning the whole HUD (type, chrome, motion, background sets, personality copy, layout) is the most visible thing that could be sold, and companies have asked for branded, locked-down new tabs for staff. Both must fit [ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md), [ADR-0002](ADR-0002-DECLARATIVE-PLUGINS-ONLY.md), and [ADR-0016](ADR-0016-MONETIZATION-ONE-OFF-LINK-OUT-NO-ADS.md).

## Decision

- Build a **free theme engine**: a pack with `kind: "theme"` (validated by the plugin SDK) maps tokens for colours, type roles (bundled `@fontsource` menu or embedded WOFF2 under a size cap, never remote fonts), shape and shadow, panel chrome, motion profile (always yielding to `prefers-reduced-motion`), background sets (data URLs or user-approved HTTPS), personality copy, and a layout template, onto the existing CSS variables applied before first paint. Themes add **no code and no JavaScript bundle weight**.
- Heavy assets live in `storage.local`; `storage.sync` carries only a small pointer slice ([ADR-0008](ADR-0008-SETTINGS-PERSISTENCE-SYNC-AND-LOCAL.md)).
- **Theme suites** (3–5 themes sharing a mood) are sold as one signed JSON download; the default "Glitch-Core" suite and a Starter suite stay free. Names avoid trademarks.
- **Brand kits** populate the pack's `brand` block (title or logo, footer links, pinned links, hidden widgets, locked settings keys, personality lock). The block renders only with a one-time `brand` entitlement per organisation, unlimited devices, no seats, no renewal, no SLA. Deployment is via managed storage policy on Chrome, Edge, and Firefox; Safari imports the file by hand.
- A **static, buildless designer page** (`site/design/`) previews, exports, and signs packs entirely in the browser with WebCrypto; nothing is uploaded.
- The importer enforces the no-ads policy mechanically where it can (rejecting `utm_` and known affiliate patterns on any URL).

## Consequences

- Themes become the on-ramp for creators: the same file format is free to make, free to share, and optionally sold on the creator's own page.
- Light-mode suites need a light variant of the temperature colour scale; font menu contents and wallpaper licensing (original or CC0) are open questions in the plan.
- Whether Pro includes first-party suites must be decided before Pro launches and never changed afterwards.

## References

- [`doc/PLAN/THEME-SUITES.md`](../PLAN/THEME-SUITES.md) — pack format, suites, designer, brand kits, pricing, phases
- [`doc/PLAN/ROADMAP-PM-BOARD.md`](../PLAN/ROADMAP-PM-BOARD.md) — PM-T080–PM-T087
- [ADR-0007](ADR-0007-DESIGN-MD-SOURCE-OF-TRUTH.md) — the default suite is `DESIGN.md`
