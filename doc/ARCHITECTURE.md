# Architecture overview

## High level

Tabocalypse is a **browser extension** that overrides the **new tab page** with a React UI: widgets (search, clock, weather, crypto prices, notes, todos, links, plugins, humor), settings persisted in **`browser.storage`**, and a **service worker** background script for alarms/notifications.

There is **no publisher-operated backend** for core features; optional network use is **user-directed** (weather, links, BYO AI base URL). See [project conventions](../.cursor/rules/project-conventions.mdc).

## Packages

| Package                           | Responsibility                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **`apps/extension`**              | WXT build, React new tab, `background.ts`, manifest, Tailwind-first UI                                          |
| **`@tabocalypse/plugin-sdk`**     | Shared types and `validatePluginJsonText()` — safe to unit test on Node                                         |
| **`@tabocalypse/example-plugin`** | Authoring sample only (published as workspace package, not shipped as a separate npm product unless you choose) |

## Extension surfaces (WXT)

Typical layout under [`apps/extension/entrypoints/`](../apps/extension/entrypoints/):

- **`newtab/`** — New tab page (main user interface).
- **`background.ts`** — MV3 service worker: alarms, notifications, and other background tasks.

Generated types and dev cache live under **`.wxt/`** (gitignored); shipped browser folders (**`chrome_edge-mv3`**, **`safari-mv3`**, **`firefox-mv2`**) are built under **`apps/extension/output/`** (gitignored). **Safari** App Store packaging still uses Apple’s **Safari Web Extension** tools on macOS from the **`safari-mv3`** (or **`chrome_edge-mv3`**) folder. Do not edit generated files by hand.

## Data flow (simplified)

1. **Settings** — Read/write via `webextension-polyfill` → `browser.storage.local` / sync (see `lib/settings` and related modules).
2. **User packs / plugins** — Imported as files or JSON, validated with **`@tabocalypse/plugin-sdk`**, stored locally.
3. **Weather** — Fetches from **Open-Meteo** when the widget is used, subject to user coordinates or prompt.
4. **Crypto prices** — Fetches public USD market samples for **BTC** and **ETH** from **CoinGecko** when that widget is enabled (no shipped API key).

## Search widget (web vs assist)

The HUD **search** field has two actions: classic **web search** on the selected engine, and an optional **assist** action that opens a third-party AI / chat surface in a **new tab** (for example **Bing Copilot Search** (`/copilotsearch`), Google AI in Search, or Duck.ai via DuckDuckGo handoff).

- Tabocalypse does **not** fetch or render those answers inside the new tab page and does **not** use **publisher API keys** or a **backend** for this feature — it only opens HTTPS URLs with the query encoded, using the user’s normal browser session on the vendor site.
- Prompt prefill, login requirements, regional availability, and UI changes are entirely up to the third party and may shift without notice.

## Further reading

- [Development](DEVELOPMENT.md) — commands and load-unpacked paths
- [Plugin schema](PLUGIN-SCHEMA.md) — declarative plugin JSON
