# Store listing checklist

For a full publishing walkthrough (Chrome, Edge, Firefox, Safari, builds, privacy), see **[`PUBLISHING-EXTENSION-STORES.md`](PUBLISHING-EXTENSION-STORES.md)** and the phased **[`CROSS-BROWSER-PUBLISHING-PLAN.md`](CROSS-BROWSER-PUBLISHING-PLAN.md)**.

## Before you upload

1. Run **`pnpm package:stores`** from the repo root (or download zips from a published GitHub Release — see [GITHUB-ACTIONS.md](GITHUB-ACTIONS.md)).
2. Host **[`PRIVACY.md`](../PRIVACY.md)** at a public **HTTPS** URL (GitHub default-branch link, GitHub Pages, or your site).
3. Set **`WXT_TABOCALYPSE_FIREFOX_GECKO_ID`** in `apps/extension/.env` before Firefox submit (not the placeholder `tabocalypse@alienfacepalm.invalid`).
4. Capture screenshots (see below).
5. Pre-write permission justifications (see below) — Chrome and Firefox reviewers often ask.

## Listing copy (starter)

**Title:** Tabocalypse

**Short description (≤132 chars):**  
Replace your new tab with widgets, humor packs, and optional imports — local-first, no publisher backend.

**Long description (expand per store):**  
Tabocalypse replaces your browser’s new tab page with clocks, weather, todos, notes, search, crypto prices, speed test, and optional humor or user-imported JSON packs. Core settings and content stay on your device. Network use is limited to features you enable (weather, backgrounds, optional BYO AI). No AlienFacepalm account, sync server, or publisher API keys.

**Single purpose:**  
Overrides the new tab page to show configurable widgets and optional humor or declarative plugins. User-imported packs are optional personal content.

**Monetization:**  
Donate/support links open third-party sites only; the extension does not process payments.

## Permission justifications (for reviewer notes)

| Permission / host                 | Why Tabocalypse needs it                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `storage`                         | Save settings, todos, notes, imported packs, and widget toggles on device             |
| `alarms`                          | User-scheduled reminders and notifications                                            |
| `notifications`                   | Show alarm/reminder notifications the user configured                                 |
| `bookmarks` (optional)            | Bookmark search widget — only when the user enables it                                |
| `topSites` (optional)             | Frequent sites widget — only when the user enables it                                 |
| `tabs` (optional)                 | Open search results and assist handoffs in a new tab                                  |
| `api.open-meteo.com`              | Weather widget coordinates → forecast (no publisher API key)                          |
| `api.coingecko.com`               | Crypto prices widget (public market data)                                             |
| `peapix.com` / `img.peapix.com`   | Optional Bing spotlight background imagery                                            |
| `duckduckgo.com`                  | Live search suggestions when Search widget is enabled and DuckDuckGo is selected      |
| `suggestqueries.google.com`       | Live search suggestions when Search widget is enabled and Google is selected          |
| `api.bing.com`                    | Live search suggestions when Search widget is enabled and Bing is selected            |
| `green2.kingcounty.gov`           | Optional Pacific Northwest lake buoy weather data                                     |
| `speed.cloudflare.com`            | Optional network speed test widget                                                    |
| OpenAI-compatible host (optional) | BYO AI settings test and optional AI chat widget — user-supplied URL and API key only |

**Remote code:** Tabocalypse does not execute remote code. Declarative plugins are JSON interpreted by the app; no user-supplied JavaScript.

## Screenshots

Capture at least:

- Default new tab (widgets visible)
- **Settings** open — widget toggles and Chaos / import section
- Import flow or BYO AI disclaimer if shown in your build

Typical store sizes: **1280×800** and/or **440×280** — confirm each portal’s current spec before upload.

## Policy alignment

- **Single purpose**: Replace the new tab page with widgets and optional humor; user-imported JSON/ZIP packs are optional personal content.
- **Permissions**: `storage`, `alarms`, `notifications`; optional `bookmarks`, `topSites`, `tabs`; `host_permissions` for Open-Meteo, CoinGecko, Peapix/Bing imagery, and search suggestion endpoints for the user’s chosen engine; optional HTTPS/localhost hosts for BYO AI (settings test and optional AI chat widget).
- **Privacy**: Summarize [PRIVACY.md](../PRIVACY.md); disclose user-directed network calls (weather, user-configured AI base URL).
- **Fundraising**: Donate links open third-party sites; the extension does not process payments.
