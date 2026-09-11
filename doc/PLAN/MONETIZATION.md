# Tabocalypse monetization plan

**Status:** Package A ("Purist") approved 2026-09-11. Phase 0 (licensing, docs, roadmap, site CTAs) shipped; Phases 1–5 are roadmap items (`PM-T073`–`PM-T079` in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md)).

**Constraint that shapes everything:** Tabocalypse has **no publisher backend**. Everything is local in the browser, and state is portable JSON (themes, humor packs, layouts, plugins). That portable JSON is the unit of value. It can be shared free, sold as **signed JSON** via a third-party merchant link-out, and verified **offline** inside the extension. No server, no telemetry, no publisher API keys, zero recurring publisher cost.

---

## Product snapshot (why this can be monetized)

- Cross-browser new-tab HUD (Chrome/Edge MV3, Safari MV3, Firefox MV2), 14 widgets, 10 humor packs, deep theme system (10 palettes + Auto HUD wallpaper sampling, per-monitor draggable layouts), declarative plugin SDK, browser-native cross-device sync, JSON import/export.
- Brand = trust: "No publisher backend / No telemetry / BYO AI key only / Declarative plugins only" (the four pillars on the homepage). Monetization must not spend that asset.
- Comparable: Momentum Plus is about $3.33/month billed annually and Momentum earns roughly $1M/year. That is the category ceiling.
- Store policy (Chrome Web Store, enforcement from 2026-08-01): data collection must be strictly necessary to the single purpose (no analytics/ads data grabs); affiliate links need in-UI disclosure and explicit consent; extensions whose primary purpose is ads are prohibited. Externally purchased unlocks are allowed when disclosed.

---

## The spectrum

Invariant fit: ✅ fully local · ⚠️ needs one rule amended · ❌ needs a publisher backend. Revenue is a rough indie-benchmark range at ~10k installs.

| #   | Model                                                                                      | Fit | Effort | Revenue @10k                       | Verdict                                        |
| --- | ------------------------------------------------------------------------------------------ | --- | ------ | ---------------------------------- | ---------------------------------------------- |
| 1   | One-time tips (Ko-fi, GitHub Sponsors)                                                     | ✅  | S      | $20–100/mo                         | Ship day one; floor, not a business            |
| 1b  | **Supporter membership** (GitHub Sponsors + Ko-fi + Patreon) with monthly signed-pack drop | ✅  | S      | $100–600/mo                        | Ship at launch; recurring with no license code |
| 2   | **Paid content packs as signed JSON** (humor, themes, layouts)                             | ✅  | S–M    | $200–800/mo                        | Core, low risk                                 |
| 3   | **Widgets as signed JSON** (unlockable built-ins + declarative recipes)                    | ✅  | M      | $300–1,500/mo                      | Core, highest margin per unit                  |
| 4   | **Pro one-time unlock** (lifetime license, verified offline)                               | ✅  | M      | $500–2,000/mo                      | **Primary SKU**                                |
| 5   | Pro annual subscription (token re-issued by email)                                         | ✅  | M      | $800–3,000/mo                      | Add after 4 proves demand                      |
| 6   | Creator marketplace (static signed catalog, rev-share via merchant)                        | ✅  | M–L    | 20–30% of creator sales            | Year 2; compounds 2 + 3                        |
| 7   | Enterprise / white-label via `storage.managed`                                             | ✅  | M      | $0 until a lead, then $500–5k/deal | Opportunistic B2B                              |
| 8   | Affiliate links (crypto exchange "Trade", partner wallpapers)                              | ⚠️  | S      | $50–300/mo                         | Only after 1k+ installs                        |
| 9   | Search partner rev-share (opt-in engine)                                                   | ⚠️  | M      | $100–1,000/mo                      | Separate release; verify policy first          |
| 10  | Sponsored packs / partner wallpaper slot                                                   | ⚠️  | S      | $100–500/mo                        | Bundle with 8                                  |
| 11  | Opt-in aggregate analytics (to price ads)                                                  | ❌  | M      | enabler only                       | Ad branch only                                 |
| 12  | Hosted sync / AI proxy / accounts subscription                                             | ❌  | L      | high ceiling, high cost            | **Rejected**: kills the brand, adds opex       |
| 13  | Fully paid app, no free tier                                                               | ✅  | S      | poor (no trial funnel)             | Rejected for launch; maybe Safari only         |
| 14  | Open-core licensing (AGPL extension, MIT SDK) + paid packs                                 | ✅  | S      | trust + contributors               | Done (Phase 0)                                 |

### Packages

- **A · Purist (approved):** 1 + 1b + 2 + 3 + 4 + 14. Invariants untouched, zero infra. Free tier is exactly today's product. Pro adds **new** widgets, premium packs, theme bundles. Supporter membership funds a monthly content drop. Ceiling roughly $2–4k/mo at 10k installs.
- **B · Purist + creator economy (next):** A + 5 + 6 + 7. Static signed catalog on GitHub Pages; third-party recipe authors sell via their own merchant pages, AlienFacepalm signs after review and takes a share. Enterprise SKU is a `team` token pasted into managed policy. Ceiling roughly $5–10k/mo.
- **C · Ad-supported branch (on paper only):** B + 8 + 9 + 10 + 11. Requires amending two invariants (opt-in telemetry, a publisher Cloudflare Worker), store-listing monetization disclosures, PRIVACY.md changes, and Chrome affiliate consent UI. Only worth revisiting past ~10k installs.

---

## Pricing

| SKU                        | Price                         | Delivery                                                                                        |
| -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Tabocalypse Free           | $0                            | Store. Everything shipped today.                                                                |
| Supporter membership       | ~$3/mo                        | GitHub Sponsors + Ko-fi + Patreon in parallel; same monthly signed-pack drop, members-only post |
| Tabocalypse Pro (lifetime) | $19 one-time (launch $12)     | Lemon Squeezy → signed token by email → paste in Settings                                       |
| Pro Annual (later)         | $12/yr                        | Same token with an `exp` claim; renewal re-issued by email                                      |
| Content packs              | $2–5 each, or included in Pro | Signed JSON download from the merchant                                                          |
| Widget recipes             | $3–8 each, or included in Pro | Signed JSON; premium widget types unlock on a verified signature                                |
| Team (managed policy)      | $5/seat/yr, 10-seat minimum   | `team` token + enterprise deployment doc                                                        |
| Creator marketplace        | creator sets price; 25% share | Creator's merchant page; AlienFacepalm signs the listing                                        |

Pro gates **new** things only (Pomodoro, calendar/agenda, RSS, tab-groups widget, theme bundles, premium humor voices, layout templates). Never claw back a shipped free feature.

**Merchant:** Lemon Squeezy (merchant of record, ~5% + $0.50 per sale, handles VAT, native license keys and file delivery). Not Patreon for Pro: no license-key automation and higher fees.

---

## Supporter membership (Patreon-style)

- **Perk:** one signed JSON drop per month (humor pack, theme bundle, wallpaper set, or widget recipe) posted members-only. Members download and import through the existing pack/plugin import. No entitlement code needed; the content is the perk.
- **Platforms (run in parallel):** GitHub Sponsors (0% fee for individuals; sponsors-only private repo hosts the drops), Ko-fi memberships (5%), Patreon (~8–12% + processing; best discovery for non-developers). Same tier name, price, and perk everywhere. One file per month, attached to a members-only post on each platform.
- **Chooser page:** the extension footer and homepage link to one "Become a supporter" page (`site/support.html`) listing the platforms, so platforms can be added or dropped without an extension release.
- **Obligation:** build a three-month buffer of drops before announcing; membership churn tracks content gaps.

---

## Widgets as signed JSON

Two tiers, one envelope:

1. **Unlockable built-in widgets.** Code ships in the binary, dormant behind `hasEntitlement(ent, "pro")` or `hasEntitlement(ent, "widget:<id>")`. The signed JSON is only the grant. Zero new security surface.
2. **Declarative recipe widgets.** Extend the plugin schema (v2) with a few richer, still-declarative types: `DataCard` (user-approved HTTPS JSON endpoint + constrained field template + refresh interval), `Countdown`, `RssList`, `StatChart`. A sold widget is a signed recipe. Host permission is requested from the user at import time (same optional-host-permission pattern as BYO AI), so networking stays user-directed. Premium types render only when the envelope signature verifies; unsigned plugins still import with the free types.

**Honesty clause (use in store copy and docs):** signed JSON is provenance and convenience, not DRM. Files are copyable. The "Verified by AlienFacepalm" badge and one-click catalog install are the value.

---

## Technical design summary (Phases 1–5)

| Phase | Item                                                                                | Board ID         | Key points                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | "What's new" banner after update                                                    | PM-T073          | `lastSeenVersion` in the sync slice; `lib/changelog/whats-new.ts` reuses `parseChangelogMarkdown`; dismissible banner with "See changelog" and, when unentitled, "Upgrade" link-out. Fresh installs never see it.                                                                                                                                                                                     |
| 2     | Offline license entitlements                                                        | PM-T074          | Token `tblic1.<b64url payload>.<b64url sig>`, ECDSA P-256 via `crypto.subtle.verify`, public JWK baked into the build. Claims: `v, kid, prod, tier, seats, iat, exp?, jti, sub, feats?, packs?`. Stored in the **sync** slice (a grant, not a spendable secret) and redacted on export like API keys. 30-day grace after `exp`. Settings › License section. Safari: hide Buy links (Apple IAP rules). |
| 3     | Signed pack/plugin envelope + Verified badge                                        | PM-T075          | `{ format: "tabocalypse-signed-pack/1", kid, payload, sig }` detected in `parsePackJsonText` and plugin import. Bad signature imports as unverified, not rejected. Pack `kind`: humor, theme, plugin, layout.                                                                                                                                                                                         |
| 4     | Plugin schema v2 premium widget types; static signed catalog with link-out purchase | PM-T076, PM-T077 | Catalog `catalog/v1/index.json` on GitHub Pages, fetched **only** when the user opens Settings › Browse packs. Entries carry `purchaseUrl` + `downloadUrl` + `sha256`. Extends roadmap T-030. Pack authoring CLI (T-031) gains `sign-pack`.                                                                                                                                                           |
| 5     | Enterprise via `storage.managed`; monthly supporter drop workflow                   | PM-T078, PM-T079 | `public/managed-schema.json` (brand, palette, disabled widgets, `intranetLinks`, `licenseToken`, `lockedKeys`); `lib/managed-policy.ts` applied at the end of `loadSettings`; `doc/ENTERPRISE-DEPLOYMENT.md`. Safari has no managed storage.                                                                                                                                                          |

Ad-branch items (affiliate, search partner, sponsored slot, opt-in analytics) are intentionally **not** on the board.

---

## Invariant amendment (applied in Phase 0)

"No in-extension payments" now reads: **no in-extension checkout or payment processing.** Purchases (memberships, Pro, paid packs) happen on third-party sites via link-out. **Offline signature verification** of purchased tokens or signed JSON content inside the extension is allowed: no network, no money movement, same class of operation as `validatePluginJsonText`. See `.cursor/rules/project-conventions.mdc`.

---

## Assumptions to confirm before Phases 2–4

- GitHub Pages (`alienfacepalm.github.io/tabocalypse`) is acceptable as the catalog host; a custom domain would be better for trust.
- Lemon Squeezy can deliver a custom license string in the receipt email (custom fields exist; verify the exact mechanism).
- Apple IAP rules apply to the Safari wrapper app; Safari may ship all-free initially.
- Chrome Web Store and Firefox AMO wording on externally purchased unlocks and search partners; re-verify at submission time (policies changed 2026-08).
- P-256 chosen over Ed25519 for Safari/Firefox WebCrypto coverage.
- Supporter platform handles (`github.com/sponsors/alienfacepalm`, `ko-fi.com/alienfacepalm`, `patreon.com/alienfacepalm`) must be created and confirmed; `site/support.html` uses them as placeholders.
