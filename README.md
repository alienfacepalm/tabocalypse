# Tabocalypse

**by AlienFacepalm** — Cross-browser (Chrome / Edge / Firefox / Safari) Manifest V3 extension that replaces the new tab page with utility widgets, curated humor packs, optional user-imported packs, declarative plugins, alarms/notifications, and BYO OpenAI-compatible API testing.

**Agents / AI:** follow [AGENTS.md](AGENTS.md) and [`.cursor/rules/project-conventions.mdc`](.cursor/rules/project-conventions.mdc) (always-on Cursor rules).

## Documentation

Guides live under **`doc/`**. Start at [doc/README.md](doc/README.md); every markdown file in that folder is linked below.

- [doc/README.md](doc/README.md) — index by audience
- [doc/DEVELOPMENT.md](doc/DEVELOPMENT.md) — contributor setup and commands
- [doc/INSTALL-LOCAL-TESTING.md](doc/INSTALL-LOCAL-TESTING.md) — load unpacked without a dev setup
- [doc/PUBLISHING-EXTENSION-STORES.md](doc/PUBLISHING-EXTENSION-STORES.md) — Chrome, Edge, Firefox (AMO), Safari (Mac App Store)
- [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) — packages and extension surfaces
- [doc/CONTRIBUTING.md](doc/CONTRIBUTING.md) — PR workflow and checks
- [doc/TROUBLESHOOTING.md](doc/TROUBLESHOOTING.md) — common issues
- [doc/PLUGIN-SCHEMA.md](doc/PLUGIN-SCHEMA.md) — declarative plugin JSON (v1)
- [doc/STORE-LISTING.md](doc/STORE-LISTING.md) — short store listing checklist

## Product notes

- **No publisher backend** — link-out only for donate / feature ideas (configure in `.env`).
- **No publisher-paid APIs** — default weather uses Open-Meteo (no key).

## Monorepo layout

| Path                                                 | Purpose                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`apps/extension`](apps/extension)                   | WXT browser extension (core new tab app).                                                          |
| [`packages/plugin-sdk`](packages/plugin-sdk)         | `@tabocalypse/plugin-sdk` — declarative plugin types + `validatePluginJsonText` (no browser APIs). |
| [`packages/example-plugin`](packages/example-plugin) | `@tabocalypse/example-plugin` — sample `tabocalypse-plugin.json` for authors.                      |

## Develop

From the **repository root**:

```bash
pnpm install
pnpm run dev          # Chrome (default)
pnpm run dev:firefox
```

Load **Load unpacked** from [`apps/extension/output/chrome-mv3`](apps/extension/output/chrome-mv3) (Chrome/Edge MV3) or `apps/extension/output/firefox-mv2` (Firefox; WXT emits MV2 for Firefox in this project). **Safari** does not load that folder directly: use the Chrome MV3 output with Apple’s **Safari Web Extension** converter on macOS, then run/sign via Xcode — see [doc/INSTALL-LOCAL-TESTING.md](doc/INSTALL-LOCAL-TESTING.md) and [doc/PUBLISHING-EXTENSION-STORES.md](doc/PUBLISHING-EXTENSION-STORES.md).

Put `.env` next to [`apps/extension/wxt.config.ts`](apps/extension/wxt.config.ts) if you use WXT env vars (or follow WXT’s env file discovery for that app).

## Build

```bash
pnpm run build
pnpm run build:firefox
pnpm run zip
```

## Quality (format, lint, tests, types)

From the **repository root**:

```bash
pnpm run format        # Prettier — write
pnpm run format:check  # Prettier — CI-style check
pnpm run lint          # ESLint (incl. no-explicit-any)
pnpm run test          # Vitest
pnpm run check         # format:check + lint + test + tsc (SDK + extension)
```

GitHub Actions runs **`pnpm run check`** then **`pnpm run build`** on pushes and pull requests to `main` / `master` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

**pnpm-only:** `.npmrc` sets `package-manager-strict=true`. Use a **git** clone so `pnpm install` can install the **Husky** pre-commit hook (`lint-staged`: ESLint + Prettier on staged files).

## Configure support URLs

Copy [`apps/extension/.env.example`](apps/extension/.env.example) to `apps/extension/.env` (or project root per WXT docs).

**Option A — JSON list (any number of rows):** set `WXT_TABOCALYPSE_SUPPORT_LINKS` to a single-line JSON array. Each object needs `label` and `url` (`https://` or `http://`). Optional `kind` picks the default icon: `feedback`, `donate`, `source`, or `link`.

Example:

```json
[
  { "label": "Send feedback", "url": "https://example.com/form", "kind": "feedback" },
  { "label": "Donate", "url": "https://example.com/donate", "kind": "donate" }
]
```

**Option B — fixed trio:** if `WXT_TABOCALYPSE_SUPPORT_LINKS` is unset or empty, these are used when set:

- `WXT_TABOCALYPSE_DONATE_URL`
- `WXT_TABOCALYPSE_FEATURE_URL` (e.g. GitHub Issues or Google Form)
- `WXT_TABOCALYPSE_GITHUB_URL`

If `WXT_TABOCALYPSE_SUPPORT_LINKS` is set but is not valid JSON array syntax, the build falls back to option B.

## User packs

ZIP containing `pack.json` (see `examples/pack-starter.json`) or a standalone `pack.json` file.

## Plugins

See [doc/PLUGIN-SCHEMA.md](doc/PLUGIN-SCHEMA.md) and the sample in [`packages/example-plugin`](packages/example-plugin). Import [`packages/example-plugin/tabocalypse-plugin.json`](packages/example-plugin/tabocalypse-plugin.json) in the extension settings.

## Store listings

See **[doc/PUBLISHING-EXTENSION-STORES.md](doc/PUBLISHING-EXTENSION-STORES.md)** for Chrome, Edge, Firefox (AMO), and Safari (Mac App Store), plus versioning and privacy alignment. Short checklist: [doc/STORE-LISTING.md](doc/STORE-LISTING.md). Use [PRIVACY.md](PRIVACY.md) as the basis for store privacy fields.

Before publishing to AMO, set a real add-on ID in [`apps/extension/wxt.config.ts`](apps/extension/wxt.config.ts) under `browser_specific_settings.gecko.id` (replace `tabocalypse@alienfacepalm.invalid`).

**Note:** Root [`package.json`](package.json) sets a `pnpm.overrides` pin for `@vitejs/plugin-react` so it stays compatible with WXT’s Vite 6 line; remove or adjust when upgrading WXT/Vite.
