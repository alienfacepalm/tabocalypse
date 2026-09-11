# Tabocalypse monetization plan

**Status:** Package A ("Purist") approved 2026-09-11 and narrowed the same day to remove every scheduled obligation and every advertising model (see the rule below). Phase 0 (licensing, docs, roadmap, site CTAs) shipped; Phases 1–4 are roadmap items (`PM-T073`–`PM-T077` in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md)). Phase 5 is reframed as **brand kits** (one-time, see [THEME-SUITES.md](./THEME-SUITES.md)); the monthly drop workflow (`PM-T079`) is dropped. Theme suites and the dashboard designer are planned in [THEME-SUITES.md](./THEME-SUITES.md).

**Constraint that shapes everything:** Tabocalypse has **no publisher backend**. Everything is local in the browser, and state is portable JSON (themes, humor packs, layouts, plugins). That portable JSON is the unit of value. It can be shared free, sold as **signed JSON** via a third-party merchant link-out, and verified **offline** inside the extension. No server, no telemetry, no publisher API keys, zero recurring publisher cost.

**Rule that shapes the rest: no scheduled obligations, no ads.** Nothing in this plan may commit the maintainer to deliver anything on a cadence, keep a subscription alive, or turn around someone else's request. Nothing in the extension, the homepage, or the packs may carry advertising of any kind: no affiliate links, no sponsored slots or packs, no search-partner revenue share, no analytics collected to price or serve ads. Revenue comes from two sources only: **one-off purchases** (people buy a thing if they want it, with no promise of further releases) and **donations of any kind**, including cryptocurrency. Where a platform forces a "membership" tier, it is only a recurring tip with no perks and no drop schedule.

---

## Product snapshot (why this can be monetized)

- Cross-browser new-tab HUD (Chrome/Edge MV3, Safari MV3, Firefox MV2), 14 widgets, 10 humor packs, deep theme system (10 palettes + Auto HUD wallpaper sampling, per-monitor draggable layouts), declarative plugin SDK, browser-native cross-device sync, JSON import/export.
- Brand = trust: "No publisher backend / No telemetry / BYO AI key only / Declarative plugins only" (the four pillars on the homepage). Monetization must not spend that asset.
- Comparable: Momentum Plus is about $3.33/month billed annually and Momentum earns roughly $1M/year. That is the category ceiling.
- Store policy (Chrome Web Store, enforcement from 2026-08-01): data collection must be strictly necessary to the single purpose (no analytics/ads data grabs); affiliate links need in-UI disclosure and explicit consent; extensions whose primary purpose is ads are prohibited. Externally purchased unlocks are allowed when disclosed.

---

## The spectrum

Invariant fit: ✅ fully local · ⚠️ needs one rule amended · ❌ needs a publisher backend. Revenue is a rough indie-benchmark range at ~10k installs.

| #   | Model                                                                                 | Fit | Effort | Revenue @10k                    | Verdict                                            |
| --- | ------------------------------------------------------------------------------------- | --- | ------ | ------------------------------- | -------------------------------------------------- |
| 1   | **Donations of any kind** (one-time tips, recurring tips with no perks, crypto)       | ✅  | S      | $20–100/mo                      | Ship day one; floor, not a business                |
| 1b  | Supporter membership with monthly signed-pack drop                                    | ✅  | S      | $100–600/mo                     | **Not pursuing**: scheduled content obligation     |
| 1c  | **Crypto donations** (static wallet addresses or hosted donation page, link-out only) | ✅  | S      | small, unpredictable            | Ship day one alongside 1                           |
| 2   | **Paid content packs as signed JSON** (humor, layouts)                                | ✅  | S–M    | $200–800/mo                     | Core, low risk; released when ready                |
| 2b  | **Theme suites as signed JSON** (3–5 themes that reskin the whole HUD)                | ✅  | M      | $300–1,200/mo                   | Core; plan in [THEME-SUITES.md](./THEME-SUITES.md) |
| 3   | **Widgets as signed JSON** (unlockable built-ins + declarative recipes)               | ✅  | M      | $300–1,500/mo                   | Core, highest margin per unit                      |
| 4   | **Pro one-time unlock** (lifetime license, verified offline)                          | ✅  | M      | $500–2,000/mo                   | **Primary SKU**                                    |
| 5   | Pro annual subscription (token re-issued by email)                                    | ✅  | M      | $800–3,000/mo                   | **Not pursuing**: renewal obligation               |
| 6   | **Creator sales** of self-signed JSON (plugins, packs, themes) on creators' own pages | ✅  | S      | $0 to us; spreads the platform  | **Encouraged**: no cut, no review, no signing      |
| 7   | **Brand kits** for companies (custom branding + managed policy), one-time license     | ✅  | M      | $150–200 per org, unpredictable | **Yes, one-off only**: no seats, renewals, SLA     |
| 8   | Affiliate links (crypto exchange "Trade", partner wallpapers)                         | ⚠️  | S      | $50–300/mo                      | **Rejected**: advertising                          |
| 9   | Search partner rev-share (opt-in engine)                                              | ⚠️  | M      | $100–1,000/mo                   | **Rejected**: advertising                          |
| 10  | Sponsored packs / partner wallpaper slot                                              | ⚠️  | S      | $100–500/mo                     | **Rejected**: advertising                          |
| 11  | Opt-in aggregate analytics (to price ads)                                             | ❌  | M      | enabler only                    | **Rejected**: ad enabler, telemetry                |
| 12  | Hosted sync / AI proxy / accounts subscription                                        | ❌  | L      | high ceiling, high cost         | **Rejected**: kills the brand, adds opex           |
| 13  | Fully paid app, no free tier                                                          | ✅  | S      | poor (no trial funnel)          | Rejected for launch; maybe Safari only             |
| 14  | Open-core licensing (AGPL extension, MIT SDK) + paid packs                            | ✅  | S      | trust + contributors            | Done (Phase 0)                                     |

### Packages

- **A · Purist (approved, no-obligation form):** 1 + 1c + 2 + 2b + 3 + 4 + 6 + 7 + 14. Invariants untouched, zero infra, zero schedule. Free tier is exactly today's product plus the theme engine, so anyone can use free or third-party themes. Pro adds **new** widgets and premium packs; theme suites and brand kits are sold on their own; each is released whenever it is ready and sold as a one-off. Third-party creators sell their own signed JSON with no involvement from us. Donations (fiat and crypto) are accepted with nothing promised in return. Ceiling roughly $1.5–4k/mo at 10k installs plus occasional brand-kit sales.
- **B · Subscriptions (not pursuing):** A + 5. The only remaining idea outside A is the annual token, and it is a renewal obligation. Kept on paper for reference only.
- **C · Ad-supported branch (rejected):** B + 8 + 9 + 10 + 11. Ruled out by the no-ads rule regardless of install count. Listed only so the reasoning is on record: it would also require amending two invariants (opt-in telemetry, a publisher Cloudflare Worker), store-listing monetization disclosures, PRIVACY.md changes, and Chrome affiliate consent UI.

---

## Pricing

| SKU                         | Price                                       | Delivery                                                                                                                                    |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabocalypse Free            | $0                                          | Store. Everything shipped today.                                                                                                            |
| Donations (fiat)            | any amount, one-time or recurring           | GitHub Sponsors, Ko-fi, Patreon. Recurring tips carry no perks and no schedule.                                                             |
| Donations (crypto)          | any amount                                  | Static wallet addresses (with QR) on `site/support.html`, or a hosted crypto donation page. Link-out only; no wallet code in the extension. |
| Tabocalypse Pro (lifetime)  | $19 one-time (launch $12)                   | Lemon Squeezy → signed token by email → paste in Settings. No expiry, no renewal.                                                           |
| Content packs               | $2–5 each, or included in Pro               | Signed JSON download from the merchant. Released when ready, no cadence.                                                                    |
| Widget recipes              | $3–8 each, or included in Pro               | Signed JSON; premium widget types unlock on a verified signature                                                                            |
| Single theme                | $3                                          | Signed JSON; the theme engine itself is free. See [THEME-SUITES.md](./THEME-SUITES.md).                                                     |
| Theme suite (3–5 themes)    | $7–9                                        | One signed JSON download                                                                                                                    |
| Brand Kit license (per org) | $149 one-time (bundle with all suites $199) | `brand` token, unlimited devices, no renewal, no SLA; deploy via managed policy or file import                                              |
| Third-party plugins/themes  | creator's price                             | Sold on the creator's own page; Tabocalypse takes nothing and reviews nothing                                                               |

Pro gates **new** things only (Pomodoro, calendar/agenda, RSS, tab-groups widget, premium humor voices, layout templates). Never claw back a shipped free feature. Pro is a lifetime grant: the token has no `exp` claim, so the 30-day grace logic in Phase 2 is unused unless a future SKU needs it. Whether Pro also includes first-party theme suites is an open question in THEME-SUITES.md; decide before Pro launches.

**Merchant:** Lemon Squeezy (merchant of record, ~5% + $0.50 per sale, handles VAT, native license keys and file delivery). Not Patreon for Pro: no license-key automation and higher fees.

**Removed SKUs:** Supporter membership with monthly drop, Pro Annual, Team per-seat-per-year, and the curated creator marketplace. Each one put the maintainer on a schedule or on the hook for someone else's request. Team is replaced by the one-time Brand Kit; the marketplace is replaced by self-serve creator sales.

---

## Donations of any kind

- **What a donation is:** a gift. No perks, no tiers with deliverables, no members-only drops. Anyone who wants to give can give; the maintainer owes nothing in return beyond a thank-you.
- **Fiat platforms (run in parallel):** GitHub Sponsors (0% fee for individuals), Ko-fi (5%; simplest one-time tip, no account needed), Patreon (~8–12% + processing; best discovery for non-developers). If a platform forces a "tier", it is a single recurring-tip tier with no perk text beyond "keeps the project going".
- **Crypto:** publish static wallet addresses (BTC, ETH, and any others the maintainer holds) with QR codes and a copy button on `site/support.html`. A hosted donation page from a processor is an acceptable alternative. Either way it is a link-out from the extension footer; the extension never embeds wallet code, never reads clipboard for addresses, and never fetches balances. Store policies allow donation links; they prohibit mining and in-extension payment handling, neither of which applies.
- **Chooser page:** the extension footer and homepage link to one "Support" page (`site/support.html`) listing every channel, so channels can be added or dropped without an extension release.
- **No obligation:** nothing is announced ahead of time and no buffer of content is required. If a pack or widget ships later, donors get it on the same terms as everyone else.

---

## Widgets as signed JSON

Two tiers, one envelope:

1. **Unlockable built-in widgets.** Code ships in the binary, dormant behind `hasEntitlement(ent, "pro")` or `hasEntitlement(ent, "widget:<id>")`. The signed JSON is only the grant. Zero new security surface.
2. **Declarative recipe widgets.** Extend the plugin schema (v2) with a few richer, still-declarative types: `DataCard` (user-approved HTTPS JSON endpoint + constrained field template + refresh interval), `Countdown`, `RssList`, `StatChart`. A sold widget is a signed recipe. Host permission is requested from the user at import time (same optional-host-permission pattern as BYO AI), so networking stays user-directed. Premium types render only when the envelope signature verifies; unsigned plugins still import with the free types.

**Honesty clause (use in store copy and docs):** signed JSON is provenance and convenience, not DRM. Files are copyable. The "Verified by AlienFacepalm" badge and one-click catalog install are the value.

---

## Third-party creators

Anyone may build and **sell** plugins, humor packs, layouts, and themes for Tabocalypse. This is how the platform spreads, so the rules are designed to need nothing from us:

- **Self-signed.** The signed-pack envelope carries the creator's own `kid` and public key. The extension shows `Signed by <name> · key <fingerprint>` and pins the key on first import (trust on first use). AlienFacepalm's key is only for first-party packs. There is no registry, no review queue, no signing on request.
- **Self-sold.** Creators use their own merchant page (Gumroad, Lemon Squeezy, Ko-fi shop, and so on). We take no cut and host no store. The static catalog (Phase 4) lists first-party packs only; creators may link to it from their own pages, not the other way round.
- **Same rules as first-party.** Declarative JSON only; HTTPS links only; **no ads** of any kind (no affiliate links, sponsored content, or tracking parameters). The importer enforces what it can mechanically and the policy is written in [`PLUGIN-SCHEMA.md`](../PLUGIN-SCHEMA.md).
- **Tooling we provide, once:** the SDK validator, a `sign-pack` command, an example signed pack, and the static designer page for themes ([THEME-SUITES.md](./THEME-SUITES.md)). No support desk.

---

## Technical design summary (Phases 1–6)

| Phase | Item                                                                                                                    | Board ID                   | Key points                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | "What's new" banner after update                                                                                        | PM-T073                    | `lastSeenVersion` in the sync slice; `lib/changelog/whats-new.ts` reuses `parseChangelogMarkdown`; dismissible banner with "See changelog" and, when unentitled, "Upgrade" link-out. Fresh installs never see it.                                                                                                                                                                                     |
| 2     | Offline license entitlements                                                                                            | PM-T074                    | Token `tblic1.<b64url payload>.<b64url sig>`, ECDSA P-256 via `crypto.subtle.verify`, public JWK baked into the build. Claims: `v, kid, prod, tier, seats, iat, exp?, jti, sub, feats?, packs?`. Stored in the **sync** slice (a grant, not a spendable secret) and redacted on export like API keys. 30-day grace after `exp`. Settings › License section. Safari: hide Buy links (Apple IAP rules). |
| 3     | Signed pack/plugin envelope + Verified badge                                                                            | PM-T075                    | `{ format: "tabocalypse-signed-pack/1", kid, payload, sig }` detected in `parsePackJsonText` and plugin import. Bad signature imports as unverified, not rejected. Pack `kind`: humor, theme, plugin, layout.                                                                                                                                                                                         |
| 4     | Plugin schema v2 premium widget types; static signed catalog with link-out purchase                                     | PM-T076, PM-T077           | Catalog `catalog/v1/index.json` on GitHub Pages, fetched **only** when the user opens Settings › Browse packs. Entries carry `purchaseUrl` + `downloadUrl` + `sha256`. Extends roadmap T-030. Pack authoring CLI (T-031) gains `sign-pack`.                                                                                                                                                           |
| 5     | Brand kits: `brand` block in theme packs, `brand` entitlement, `storage.managed` loader, `doc/ENTERPRISE-DEPLOYMENT.md` | PM-T085 (reframes PM-T078) | One-time license per organization, unlimited devices, no seats or renewals. `lib/managed-policy.ts` applied at the end of `loadSettings` with `lockedKeys` enforced. Safari has no managed storage (manual import). Full design in [THEME-SUITES.md](./THEME-SUITES.md).                                                                                                                              |
| 6     | Theme engine, designer page, first-party suites, creator tooling                                                        | PM-T080–PM-T087            | See [THEME-SUITES.md](./THEME-SUITES.md).                                                                                                                                                                                                                                                                                                                                                             |
| —     | ~~Monthly supporter drop workflow~~ (dropped)                                                                           | PM-T079                    | A content cadence; removed under the no-scheduled-obligations rule and already dropped from the board.                                                                                                                                                                                                                                                                                                |

Phase 4's catalog is a **static index of AlienFacepalm's own signed packs**. Third-party creators sell on their own pages with their own keys (see "Third-party creators" above); there is no submission form, review queue, or signing on request.

Ad-branch items (affiliate, search partner, sponsored slot, opt-in analytics) are rejected under the no-ads rule and must never be added to the board.

---

## Invariant amendment (applied in Phase 0)

"No in-extension payments" now reads: **no in-extension checkout or payment processing.** Purchases (Pro, paid packs, theme suites, brand kits, third-party creations) and donations happen on third-party sites via link-out. **Offline signature verification** of purchased tokens or signed JSON content inside the extension is allowed: no network, no money movement, same class of operation as `validatePluginJsonText`. See `.cursor/rules/project-conventions.mdc`.

---

## Assumptions to confirm before Phases 2–4

- GitHub Pages (`alienfacepalm.github.io/tabocalypse`) is acceptable as the catalog host; a custom domain would be better for trust.
- Lemon Squeezy can deliver a custom license string in the receipt email (custom fields exist; verify the exact mechanism).
- Apple IAP rules apply to the Safari wrapper app; Safari may ship all-free initially.
- Chrome Web Store and Firefox AMO wording on externally purchased unlocks; re-verify at submission time (policies changed 2026-08).
- P-256 chosen over Ed25519 for Safari/Firefox WebCrypto coverage.
- Supporter platform handles (`github.com/sponsors/alienfacepalm`, `ko-fi.com/alienfacepalm`, `patreon.com/alienfacepalm`) must be created and confirmed; `site/support.html` uses them as placeholders.
- Crypto wallet addresses (and which chains to list) must be supplied by the maintainer before `site/support.html` can show them. Addresses are public by nature; never place private keys, seed phrases, or exchange API keys anywhere in the repo.
- `site/support.html`, `doc/STORE-LISTING.md`, and `PRIVACY.md` describe tips with no perks and no monthly drop, matching this document; keep them in line whenever a SKU or channel changes.
- Store-policy check for brand kits: a policy-deployed, rebranded new tab is still the same store build with configuration; confirm Chrome, Edge, and Firefox listing wording covers "appearance and links configurable by enterprise policy" before selling the first kit.
- Trust-on-first-use for creator keys means a key change looks like a new signer; the UI copy must say so plainly without implying the file is malicious.
