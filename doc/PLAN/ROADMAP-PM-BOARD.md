# Tabocalypse roadmap — Projocalypse plan checklist

**Purpose:** Machine-readable backlog for Projocalypse (`tabocalypse-roadmap` in `.projocalypse/workspace.json`). One **week per sprint column**. Edit checkboxes here; run `pnpm pm:sync` to update `.projocalypse/pending/tabocalypse-roadmap.json`. Check freshness: `pnpm pm:stale`. Setup: `pnpm pm:setup` — see [PROJOCALYPSE.md](./PROJOCALYPSE.md).

**Sprint columns** (`W1`–`W10`) must match `.projocalypse/workspace.json` and `pm:section=` comments below.

**Canon:** Narrative and notes in [ROADMAP.md](./ROADMAP.md). Priority order: store launch → features new-tab users expect → data trust → plugins → a11y → stretch.

**After shipping major work:** mark matching `pm:PM-T###` items done here, run `pnpm pm:sync`, and keep [`doc/CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]** current (see `.cursor/rules/update-docs-before-commit.mdc` and `tabocalypse-pm-board.mdc`).

## W1 · Ship blockers

_(Removed — pre-store checklist items are no longer tracked on the board.)_

## W2 · Chrome launch

- [ ] pm:PM-T014 Release CI — tagged build + store zips <!-- pm:section=W2 · Chrome launch pm:priority=high -->
- [ ] pm:PM-T015 STORE-LISTING.md copy finalized per portal <!-- pm:section=W2 · Chrome launch pm:priority=high -->
- [ ] pm:PM-T010 Chrome Web Store first publish <!-- pm:section=W2 · Chrome launch pm:priority=high -->

## W3 · Multi-store rollout

- [ ] pm:PM-T011 Microsoft Edge Add-ons listing <!-- pm:section=W3 · Multi-store rollout pm:priority=high -->
- [ ] pm:PM-T012 Firefox AMO submit with sources zip <!-- pm:section=W3 · Multi-store rollout pm:priority=high -->
- [ ] pm:PM-T013 Safari Mac App Store path <!-- pm:section=W3 · Multi-store rollout pm:priority=high -->

## W4 · New tab essentials

- [ ] pm:PM-T025 Pinned quick links grid (user-curated) <!-- pm:section=W4 · New tab essentials pm:priority=high -->
- [ ] pm:PM-T020 Graduate Speed test to on-by-default <!-- pm:section=W4 · New tab essentials pm:priority=medium -->
- [ ] pm:PM-T041 Per-widget settings deep links from HUD errors <!-- pm:section=W4 · New tab essentials pm:priority=medium -->
- [ ] pm:PM-T054 Offline-first indicator in footer for cached data <!-- pm:section=W4 · New tab essentials pm:priority=medium -->
- [ ] pm:PM-T073 "What's new" banner after update (lastSeenVersion + changelog) <!-- pm:section=W4 · New tab essentials pm:priority=medium -->

## W5 · News & productivity

- [ ] pm:PM-T021 Graduate Balanced news default-on for new installs <!-- pm:section=W5 · News & productivity pm:priority=medium -->
- [ ] pm:PM-T023 Calendar / agenda widget (local-only) <!-- pm:section=W5 · News & productivity pm:priority=medium -->
- [ ] pm:PM-T024 RSS / feed reader widget (user URLs) <!-- pm:section=W5 · News & productivity pm:priority=medium -->
- [ ] pm:PM-T044 Onboarding tour (widgets + personality presets) <!-- pm:section=W5 · News & productivity pm:priority=medium -->

## W6 · AI & HUD layout

- [ ] pm:PM-T022 AI chat widget polish + safer defaults <!-- pm:section=W6 · AI & HUD layout pm:priority=medium -->
- [ ] pm:PM-T027 Weather HUD streak & points graduate from Experimental <!-- pm:section=W6 · AI & HUD layout pm:priority=medium -->
- [ ] pm:PM-T026 Multi-monitor HUD presets export/import <!-- pm:section=W6 · AI & HUD layout pm:priority=medium -->

## W7 · Settings & data trust

- [ ] pm:PM-T040 Full settings backup/restore (encrypted optional) <!-- pm:section=W7 · Settings & data trust pm:priority=medium -->
- [ ] pm:PM-T042 Sync conflict UI when storage.sync diverges <!-- pm:section=W7 · Settings & data trust pm:priority=medium -->
- [ ] pm:PM-T043 Import pack from user-pasted HTTPS URL <!-- pm:section=W7 · Settings & data trust pm:priority=medium -->
- [ ] pm:PM-T034 Settings export includes pack manifests <!-- pm:section=W7 · Settings & data trust pm:priority=medium -->
- [ ] pm:PM-T074 Offline license entitlements (signed token, Settings › License) <!-- pm:section=W7 · Settings & data trust pm:priority=high -->

## W8 · Plugins & packs

- [ ] pm:PM-T030 Plugin marketplace (curated static index, link-out install) <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T031 Pack authoring CLI in plugin-sdk <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T032 More built-in humor packs (scrape workflow) <!-- pm:section=W8 · Plugins & packs pm:priority=low -->
- [ ] pm:PM-T075 Signed pack/plugin envelope + Verified badge <!-- pm:section=W8 · Plugins & packs pm:priority=high -->
- [ ] pm:PM-T076 Plugin schema v2 premium widget types (DataCard, Countdown, RssList, StatChart) <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T077 Static signed catalog with link-out purchase (extends T-030) <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T080 Theme engine: theme packs, token → CSS vars, Appearance › Themes library <!-- pm:section=W8 · Plugins & packs pm:priority=high -->
- [ ] pm:PM-T081 Typography roles: bundled font menu + embedded WOFF2 cap <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T082 Chrome, shape, motion tokens (reduced motion always wins) <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T083 Background sets, layout templates, personality copy in themes <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->
- [ ] pm:PM-T087 Creator docs: THEME-AUTHORING, sign-pack CLI, no-ads policy, example signed theme <!-- pm:section=W8 · Plugins & packs pm:priority=medium -->

## W9 · Accessibility & performance

- [ ] pm:PM-T050 Keyboard navigation audit (HUD + Settings) <!-- pm:section=W9 · Accessibility & performance pm:priority=medium -->
- [ ] pm:PM-T051 Reduced motion respects prefers-reduced-motion globally <!-- pm:section=W9 · Accessibility & performance pm:priority=medium -->
- [ ] pm:PM-T052 High-contrast theme variant <!-- pm:section=W9 · Accessibility & performance pm:priority=medium -->
- [ ] pm:PM-T055 Performance budget for new-tab cold load <!-- pm:section=W9 · Accessibility & performance pm:priority=medium -->

## W10 · Stretch & backlog

- [ ] pm:PM-T033 Widget type external iframe (strict CSP) <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T053 i18n / locale strings extraction <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T060 P2P settings sync (WebRTC) <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T061 Custom search engines (user URL template) <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T062 Tab groups summary widget <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T063 Pomodoro / focus timer tied to Clock alarms <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T064 Wallpaper rotation from user folder <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T065 HUD layout templates (productivity vs news-heavy) <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->
- [ ] pm:PM-T084 Dashboard designer page (site/design): live preview, export, in-browser signing <!-- pm:section=W10 · Stretch & backlog pm:priority=medium -->
- [ ] pm:PM-T085 Brand kits: brand block, brand token, storage.managed loader, ENTERPRISE-DEPLOYMENT doc (one-time license) <!-- pm:section=W10 · Stretch & backlog pm:priority=medium -->
- [ ] pm:PM-T086 First-party theme suites: Neon Nights, Quiet Work, Retro Machines, Markets & Ops, Living World; free Starter <!-- pm:section=W10 · Stretch & backlog pm:priority=low -->

## Done

- [x] pm:PM-T070 Licensing: AGPL-3.0 extension, MIT plugin SDK <!-- pm:section=Done pm:priority=high -->
- [x] pm:PM-T071 Monetization doc, invariant amendment, listing/privacy monetization copy <!-- pm:section=Done pm:priority=high -->
- [x] pm:PM-T072 Supporter chooser page + homepage CTA (GitHub Sponsors, Ko-fi, Patreon) <!-- pm:section=Done pm:priority=medium -->
