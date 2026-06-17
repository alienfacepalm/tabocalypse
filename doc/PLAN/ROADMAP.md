# Tabocalypse — future enhancements roadmap

Human-readable backlog for Tabocalypse after the current alpha. **Machine-readable checkboxes** for Projocalypse live in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md) once items are approved and synced.

**PM board:** `pnpm pm:setup` then `pnpm pm:board` — see [PROJOCALYPSE.md](./PROJOCALYPSE.md).

---

## How to use this doc

1. **Sprint board:** all items are tracked in [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md) as one-week sprints (`W1`–`W10`). Run `pnpm pm:sync` after checkbox edits.
2. **This file** keeps narrative notes and original theme groupings (P0–P5) for reference.
3. Open the board: `pnpm pm:board` — see [PROJOCALYPSE.md](./PROJOCALYPSE.md).

**Product constraints** (non-negotiable): no publisher backend or telemetry; declarative plugins only; BYO AI keys; link-out support/donations.

---

## P0 · Ship blockers (pre-store)

Items that block **any** public store listing. See also [CROSS-BROWSER-PUBLISHING-PLAN.md](../CROSS-BROWSER-PUBLISHING-PLAN.md).

| ID    | Candidate                                                   | Notes                                               |
| ----- | ----------------------------------------------------------- | --------------------------------------------------- |
| T-001 | **Firefox Gecko add-on ID** — replace placeholder in `.env` | AMO requires a unique reverse-domain ID             |
| T-002 | **Privacy policy at public HTTPS URL**                      | Host `PRIVACY.md`; stores reject repo-only          |
| T-003 | **Store screenshots** (1280×800 / 440×280)                  | New tab default, Settings, import/BYO AI disclaimer |
| T-004 | **Permission justification copy** pre-written for reviewers | `bookmarks`, `topSites`, `tabs`, BYO AI host        |
| T-005 | **Support URL**                                             | GitHub Issues or contact page                       |
| T-006 | **Safari converter smoke test** on macOS                    | `safari-mv3` → Xcode wrapper → load signed build    |

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

| ID    | Candidate                                                  | Notes                                     |
| ----- | ---------------------------------------------------------- | ----------------------------------------- |
| T-020 | **Graduate Speed test** from default-off to on-by-default  | After more soak time                      |
| T-021 | **Graduate Balanced news** default-on for new installs     | Optional API key path documented          |
| T-022 | **AI chat widget** polish + safer defaults                 | Still BYO key; off by default until ready |
| T-023 | **Calendar / agenda widget** (local-only events)           | No backend; `alarms` + storage            |
| T-024 | **RSS / feed reader widget** (user URLs)                   | Privileged fetch allowlist per host       |
| T-025 | **Pinned quick links** grid (user-curated)                 | Distinct from Top sites / bookmarks strip |
| T-026 | **Multi-monitor HUD presets** export/import                | JSON file alongside settings export       |
| T-027 | **Weather HUD streak & points** graduate from Experimental | When scoring feels stable                 |

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

| Week | Column                      | Focus                                                                                            |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| W1   | Ship blockers               | Store prerequisites (Gecko ID, privacy URL, screenshots, Safari smoke)                           |
| W2   | Chrome launch               | Release CI, listing copy, Chrome Web Store                                                       |
| W3   | Multi-store rollout         | Edge, Firefox AMO, Safari App Store                                                              |
| W4   | New tab essentials          | Quick links, Speed test default-on, error deep links, offline indicator                          |
| W5   | News & productivity         | Balanced news default, calendar, RSS, onboarding tour                                            |
| W6   | AI & HUD layout             | AI chat polish, weather streak, HUD preset export                                                |
| W7   | Settings & data trust       | Backup/restore, sync conflicts, pack import URL                                                  |
| W8   | Plugins & packs             | Marketplace index, pack CLI, more humor packs                                                    |
| W9   | Accessibility & performance | Keyboard audit, reduced motion, contrast, perf budget                                            |
| W10  | Stretch & backlog           | iframe widget, i18n, P2P sync, custom search, tab groups, pomodoro, wallpapers, layout templates |

Checkboxes and `pm:PM-T###` ids: [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md).
