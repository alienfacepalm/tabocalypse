# ADR-0016: One-off purchases and donations only; link-out checkout; offline verification; no ads; no scheduled obligations

| Status | ✅ Accepted ("Package A", narrowed the same day)          |
| ------ | --------------------------------------------------------- |
| Date   | 2026-09-11                                                |
| Scope  | Product invariant; roadmap items PM-T073–PM-T077, PM-T085 |

## Context

The project needs some revenue to be sustainable, but every common model conflicts with something: subscriptions and monthly content drops put a solo maintainer on a schedule; hosted sync or an AI proxy needs a backend ([ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md)); affiliate links, sponsored packs, search-partner revenue share, and analytics are advertising and would spend the trust the product is built on. Store policy (Chrome Web Store, 2026-08) additionally restricts ad-driven data collection and requires disclosure for externally purchased unlocks.

## Decision

1. **Revenue sources are exactly two:** one-off purchases (Pro lifetime unlock, content packs, widget recipes, single themes and theme suites, one-time Brand Kit license per organisation) and **donations of any kind** (one-time or recurring tips with no perks, including cryptocurrency).
2. **No advertising, anywhere** — extension, homepage, and every first- or third-party pack, plugin, or theme: no affiliate links, sponsored slots, partner placements, revenue share, or analytics collected to price or serve ads.
3. **No scheduled delivery obligations** — no subscriptions with promised drops, no content cadences, no review or signing queues for other people's work, no per-seat renewals or SLAs. Things ship when they are ready and are sold as they are.
4. **Checkout is always link-out** to a third-party merchant (Lemon Squeezy for first-party SKUs; GitHub Sponsors, Ko-fi, Patreon, static wallet addresses for donations). The invariant "no in-extension payments" is amended to **"no in-extension checkout or payment processing"** so that the extension may **verify signatures offline** (ECDSA P-256 via WebCrypto, public key baked in) for license tokens and signed JSON packs. No network, no money movement.
5. **Third-party creators may sell** their own self-signed JSON on their own pages; Tabocalypse takes no cut, hosts no store, and signs nothing on request. Signer identity is shown on import (trust on first use).
6. **Pro gates new things only**; a shipped free feature is never clawed back. Bad signatures import as _unverified_, never rejected; signed JSON is provenance and convenience, not DRM.

## Consequences

- Removed from the roadmap: supporter membership with monthly drop, Pro annual, Team per-seat, curated marketplace with review. Rejected outright: the ad-supported branch.
- Entitlements, signed-pack envelope, "What's new" banner, static signed catalog, and brand kits become roadmap phases; none exist in code yet, and docs must say "planned" until they ship.
- `PRIVACY.md`, `STORE-LISTING.md`, and `site/support.html` must describe purchases as link-out with offline verification and must not mention drops or perks.
- Marketing ([`doc/PLAN/MARKETING.md`](../PLAN/MARKETING.md)) leads with the no-ads, no-backend stance as the differentiator.

## References

- [`doc/PLAN/MONETIZATION.md`](../PLAN/MONETIZATION.md) — spectrum, packages, pricing, technical phases
- [`.cursor/rules/project-conventions.mdc`](../../.cursor/rules/project-conventions.mdc) — "Support / donations / purchases", "No advertising", "No scheduled delivery obligations"
- [`doc/PLUGIN-SCHEMA.md`](../PLUGIN-SCHEMA.md) — content policy
- [ADR-0015](ADR-0015-LICENSING-AGPL-EXTENSION-MIT-SDK.md), [ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md)
