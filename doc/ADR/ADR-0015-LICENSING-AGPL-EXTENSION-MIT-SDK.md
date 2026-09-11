# ADR-0015: The extension is AGPL-3.0; the plugin SDK is MIT

| Status | ✅ Accepted                                                |
| ------ | ---------------------------------------------------------- |
| Date   | 2026-09-11 (Monetization Phase 0)                          |
| Scope  | `LICENSE`, `packages/plugin-sdk/LICENSE`, `license` fields |

## Context

Until Phase 0 the repo had no license file, which legally meant "all rights reserved" and blocked contributions and forks. Monetization ([ADR-0016](ADR-0016-MONETIZATION-ONE-OFF-LINK-OUT-NO-ADS.md)) needs an open-core shape: the app stays open so the trust claims are verifiable, while the maintainer keeps the option to sell content and licenses around it.

## Decision

- **`apps/extension` is licensed AGPL-3.0-only.** Anyone may use, study, modify, and redistribute it; a modified version offered to users (including a rebranded fork) must publish its source under the same terms. `package.json` `license` fields match.
- **`@tabocalypse/plugin-sdk` is MIT** so plugin, pack, and theme authors, and any authoring tools, can depend on the validator without copyleft concerns.
- Paid content (packs, theme suites, brand kits) is **data**, not code, and is licensed separately by its own `license` field (for example `CC-BY-NC-4.0`); signed JSON is provenance, not DRM.
- Third-party creators own what they make and may license and sell it as they choose, subject to the no-ads content policy.

## Consequences

- Companies that want a private, rebranded fork have a clear alternative: the one-time Brand Kit ([ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md)).
- Store listings state the license; the Firefox AMO sources zip already satisfies the source-availability expectation.
- Contributions are accepted under AGPL-3.0 by default; `CONTRIBUTING.md` should say so.

## References

- [`LICENSE`](../../LICENSE), [`packages/plugin-sdk/LICENSE`](../../packages/plugin-sdk/LICENSE)
- [`doc/PLAN/MONETIZATION.md`](../PLAN/MONETIZATION.md) — spectrum row 14 "Open-core licensing"
- `doc/CHANGELOG.md` [Unreleased] — "Licensing"
