# Architecture overview

## High level

Tabocalypse is a **browser extension** that overrides the **new tab page** with a React UI: widgets (search, clock, weather, notes, todos, links, plugins, humor), settings persisted in **`browser.storage`**, and a **service worker** background script for alarms/notifications.

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

Generated types and build output live under **`.wxt/`** and **`.output/`** (gitignored); do not edit generated files by hand.

## Data flow (simplified)

1. **Settings** — Read/write via `webextension-polyfill` → `browser.storage.local` / sync (see `lib/settings` and related modules).
2. **User packs / plugins** — Imported as files or JSON, validated with **`@tabocalypse/plugin-sdk`**, stored locally.
3. **Weather** — Fetches from **Open-Meteo** when the widget is used, subject to user coordinates or prompt.

## Further reading

- [Development](DEVELOPMENT.md) — commands and load-unpacked paths
- [Plugin schema](PLUGIN-SCHEMA.md) — declarative plugin JSON
