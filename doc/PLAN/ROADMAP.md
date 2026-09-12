# Tabocalypse — future enhancements roadmap

Human-readable backlog for Tabocalypse after the current alpha. **Machine-readable checkboxes** for Projocalypse live in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md) once items are approved and synced.

**PM board:** `pnpm pm:setup` then `pnpm pm:board` — see [PROJOCALYPSE.md](./PROJOCALYPSE.md).

---

## How to use this doc

1. **Sprint board:** all items are tracked in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md) as one-week sprints (`W1`–`W10`). Run `pnpm pm:sync` after checkbox edits.
2. **This file** keeps narrative notes and original theme groupings (P0–P5) for reference.
3. Open the board: `pnpm pm:board` — see [PROJOCALYPSE.md](./PROJOCALYPSE.md).

**Product constraints** (non-negotiable): no publisher backend or telemetry; declarative plugins only; BYO AI keys; link-out support/donations/purchases (no in-extension checkout; offline signature verification of purchased tokens and signed JSON is allowed); **no ads anywhere** (extension, site, first- or third-party packs/plugins); **no scheduled delivery obligations** — see [MONETIZATION.md](./MONETIZATION.md).

---

## P0 · Ship blockers (pre-store)

_(Removed from the active roadmap — store prerequisites are tracked outside this board when needed. See [CROSS-BROWSER-PUBLISHING-PLAN.md](../CROSS-BROWSER-PUBLISHING-PLAN.md) for publishing ops.)_

---

## P1 · Store launch (Chrome → Edge → Firefox → Safari)

| ID    | Candidate                                      | Notes                                            |
| ----- | ---------------------------------------------- | ------------------------------------------------ |
| T-010 | **Chrome Web Store** first publish             | Strictest MV3 checks; reuse zip for Edge         |
| T-011 | **Microsoft Edge Add-ons** listing             | Same Chromium MV3 artifact                       |
| T-012 | **Firefox AMO** submit with sources zip        | `wxt zip -b firefox --sources`                   |
| T-013 | **Safari Mac App Store** path                  | Apple converter + App Store Connect              |
| T-014 | **Release CI** — tagged build + store zips     | Extend [GITHUB-ACTIONS.md](../GITHUB-ACTIONS.md) |
| T-015 | **STORE-LISTING.md** copy finalized per portal | Short/long descriptions aligned                  |

---

## P2 · Widgets & HUD

| ID    | Candidate                                                  | Notes                                          |
| ----- | ---------------------------------------------------------- | ---------------------------------------------- |
| T-020 | **Graduate Speed test** from default-off to on-by-default  | After more soak time                           |
| T-021 | **Graduate Balanced news** default-on for new installs     | Optional API key path documented               |
| T-022 | **AI chat widget** polish + safer defaults                 | Still BYO key; off by default until ready      |
| T-023 | **Calendar / agenda widget** (local-only events)           | No backend; `alarms` + storage                 |
| T-024 | **RSS / feed reader widget** (user URLs)                   | Privileged fetch allowlist per host            |
| T-025 | **Pinned quick links** grid (user-curated)                 | Distinct from Top sites / bookmarks strip      |
| T-026 | **Multi-monitor HUD presets** export/import                | JSON file alongside settings export            |
| T-027 | **Weather HUD streak & points** graduate from Experimental | When scoring feels stable                      |
| T-088 | **Daily quiz** widget + local XP rewards (shipped)         | Bundled bank; XP is a game gate, not a license |

---

## P3 · Plugins & packs

| ID    | Candidate                                                       | Notes                                           |
| ----- | --------------------------------------------------------------- | ----------------------------------------------- |
| T-030 | **Plugin marketplace** (curated static index, link-out install) | No publisher store; user imports JSON           |
| T-031 | **Pack authoring CLI** in `@tabocalypse/plugin-sdk`             | Validate + scaffold `tabocalypse-plugin.json`   |
| T-032 | **More built-in humor packs**                                   | Maintainer scrape workflow like Unsuck Classics |
| T-033 | **Widget type: external iframe** (strict CSP)                   | High risk — only if store policy allows         |
| T-034 | **Settings export includes pack manifests**                     | Backup/restore story                            |

---

## P4 · Settings & data

| ID    | Candidate                                             | Notes                             |
| ----- | ----------------------------------------------------- | --------------------------------- |
| T-040 | **Full settings backup/restore** (encrypted optional) | File pick; no cloud sync server   |
| T-041 | **Per-widget settings deep links** from HUD errors    | Already partial — extend coverage |
| T-042 | **Sync conflict UI** when `storage.sync` diverges     | Rare but confusing today          |
| T-043 | **Import pack from URL** (user-pasted HTTPS)          | Allowlist + validation only       |
| T-044 | **Onboarding tour** (first-run beyond settings intro) | Focus / Chaos / widget highlights |

---

## P5 · Polish & accessibility

| ID    | Candidate                                                     | Notes                                  |
| ----- | ------------------------------------------------------------- | -------------------------------------- |
| T-050 | **Keyboard navigation audit** across HUD + Settings           | WCAG-oriented pass                     |
| T-051 | **Reduced motion** respects `prefers-reduced-motion` globally | Partial today on chaos animations      |
| T-052 | **High-contrast theme** variant                               | DESIGN.md palette extension            |
| T-053 | **i18n / locale strings** extraction                          | Large effort; English-first until then |
| T-054 | **Offline-first indicator** in footer                         | When cached weather/crypto/news shown  |
| T-055 | **Performance budget** for new-tab cold load                  | Measure on low-end hardware            |

---

## P6 · Monetization (Package A — see [MONETIZATION.md](./MONETIZATION.md))

| ID    | Candidate                                                             | Notes                                                                    |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| T-070 | **Licensing**: AGPL-3.0 extension, MIT plugin SDK                     | Done — `LICENSE`, `packages/plugin-sdk/LICENSE`, `license` fields        |
| T-071 | **Monetization doc + invariant amendment + listing/privacy copy**     | Done — no in-extension checkout; offline signature verification allowed  |
| T-072 | **Supporter chooser page** + homepage CTA                             | Done — `site/support.html` (GitHub Sponsors, Ko-fi, Patreon)             |
| T-073 | **"What's new" banner** after update                                  | `lastSeenVersion`; reuses changelog parser; Upgrade link when unentitled |
| T-074 | **Offline license entitlements** (signed token, Settings › License)   | ECDSA P-256 via WebCrypto; sync slice; redacted on export                |
| T-075 | **Signed pack/plugin envelope** + Verified badge                      | Bad signature imports as unverified, never rejected                      |
| T-076 | **Plugin schema v2 premium widget types** (DataCard, Countdown, RSS…) | Declarative only; user grants host permission at import                  |
| T-077 | **Static signed catalog** with link-out purchase                      | Extends T-030; fetched only when the user opens Browse packs             |
| T-078 | ~~Enterprise managed-storage policy + Team token~~                    | Reframed as one-time **Brand Kit** (T-085); per-seat renewals dropped    |
| T-079 | ~~Monthly supporter drop workflow~~                                   | Dropped — a content cadence violates the no-scheduled-obligations rule   |

---

## P7 · Theme suites & brand kits (see [THEME-SUITES.md](./THEME-SUITES.md))

| ID    | Candidate                                                                 | Notes                                                                         |
| ----- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| T-080 | **Theme engine**: `kind: "theme"` packs, token → CSS vars, Themes library | Free for everyone; heavy assets in `storage.local`, pointer in sync           |
| T-081 | **Typography roles**: bundled font menu, embedded WOFF2 with cap          | No remote fonts                                                               |
| T-082 | **Chrome, shape, motion tokens**                                          | Blur, opacity, borders, shadow style, scanlines; reduced motion always wins   |
| T-083 | **Background sets, layout templates, personality copy** in themes         | Data URLs or user-approved HTTPS                                              |
| T-084 | **Dashboard designer** page (`site/design/`)                              | Static, buildless; live preview, export, in-browser WebCrypto signing         |
| T-085 | **Brand kits** for companies                                              | `brand` block + one-time `brand` token + `storage.managed` loader; no seats   |
| T-086 | **First-party theme suites**                                              | Neon Nights, Quiet Work, Retro Machines, Markets & Ops, Living World; Starter |
| T-087 | **Creator docs + `sign-pack` CLI**                                        | Self-signed, self-sold; no-ads policy text                                    |

---

## Backlog (ideas — not yet prioritized)

| ID    | Candidate                                                                |
| ----- | ------------------------------------------------------------------------ |
| T-060 | P2P settings sync (WebRTC) — aligns with Projocalypse embed strategy doc |
| T-061 | Custom search engines (user-defined URL template)                        |
| T-062 | Tab groups summary widget (needs `tabGroups` permission research)        |
| T-063 | Pomodoro / focus timer tied to Clock alarms                              |
| T-064 | Wallpaper rotation from user folder (File System Access API)             |
| T-065 | HUD layout templates (productivity vs news-heavy)                        |

---

## Sprint schedule (1 week each)

| Week | Column                      | Focus                                                                                                              |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| W1   | Ship blockers               | Store prerequisites (Gecko ID, privacy URL, screenshots, Safari smoke)                                             |
| W2   | Chrome launch               | Release CI, listing copy, Chrome Web Store                                                                         |
| W3   | Multi-store rollout         | Edge, Firefox AMO, Safari App Store                                                                                |
| W4   | New tab essentials          | Quick links, Speed test default-on, error deep links, offline indicator                                            |
| W5   | News & productivity         | Balanced news default, calendar, RSS, onboarding tour                                                              |
| W6   | AI & HUD layout             | AI chat polish, weather streak, HUD preset export                                                                  |
| W7   | Settings & data trust       | Backup/restore, sync conflicts, pack import URL                                                                    |
| W8   | Plugins & packs             | Catalog index, pack CLI, more humor packs, theme engine + theme tokens, creator docs                               |
| W9   | Accessibility & performance | Keyboard audit, reduced motion, contrast, perf budget                                                              |
| W10  | Stretch & backlog           | iframe widget, i18n, P2P sync, custom search, tab groups, pomodoro, wallpapers, designer, brand kits, theme suites |

Checkboxes and `pm:PM-T###` ids: [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md).
