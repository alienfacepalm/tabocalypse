# Tabocalypse

**by AlienFacepalm** — Cross-browser (Chrome / Edge / Firefox / Safari) Manifest V3 extension that replaces the new tab page with utility widgets, curated humor packs, optional user-imported packs, declarative plugins, alarms/notifications, and BYO OpenAI-compatible API testing.

**Agents / AI:** follow [AGENTS.md](AGENTS.md), [`.cursor/rules/project-conventions.mdc`](.cursor/rules/project-conventions.mdc) (always-on Cursor rules), and per-tool wrappers (`CLAUDE.md`, `ANTIGRAVITY.md`, `.clinerules`, etc. — kept in sync via [doc/AGENT-INSTRUCTIONS.md](doc/AGENT-INSTRUCTIONS.md)).

## Documentation

Guides live under **`doc/`**. Start at [doc/README.md](doc/README.md); every markdown file in that folder is linked below.

- [doc/README.md](doc/README.md) — index by audience
- [doc/DEVELOPMENT.md](doc/DEVELOPMENT.md) — contributor setup and commands
- [doc/INSTALL-LOCAL-TESTING.md](doc/INSTALL-LOCAL-TESTING.md) — load unpacked without a dev setup
- [doc/PUBLISHING-EXTENSION-STORES.md](doc/PUBLISHING-EXTENSION-STORES.md) — Chrome, Edge, Firefox (AMO), Safari (Mac App Store)
- [doc/CROSS-BROWSER-PUBLISHING-PLAN.md](doc/CROSS-BROWSER-PUBLISHING-PLAN.md) — phased store rollout and deliverables
- [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) — packages and extension surfaces
- [doc/CONTRIBUTING.md](doc/CONTRIBUTING.md) — PR workflow and checks
- [doc/TROUBLESHOOTING.md](doc/TROUBLESHOOTING.md) — common issues
- [doc/PLUGIN-SCHEMA.md](doc/PLUGIN-SCHEMA.md) — declarative plugin JSON (v1)
- [doc/STORE-LISTING.md](doc/STORE-LISTING.md) — short store listing checklist
- [doc/ALPHA-SETUP.md](doc/ALPHA-SETUP.md) — clone, build, and install in developer mode
- [doc/AGENT-INSTRUCTIONS.md](doc/AGENT-INSTRUCTIONS.md) — agent-agnostic rules and sync targets
- [doc/CHANGELOG.md](doc/CHANGELOG.md) — curated summary of user-facing and shipped changes (parallel to Git history)
- [doc/GITHUB-ACTIONS.md](doc/GITHUB-ACTIONS.md) — CI and automated release packaging for Chrome, Edge, Firefox, and Safari

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
pnpm dev          # Chrome (default)
pnpm dev:firefox
```

After **`pnpm build`**, WXT writes **`apps/extension/output/chrome_edge-mv3`** (Chrome/Edge MV3), **`apps/extension/output/safari-mv3`** (Safari-targeted MV3), and **`apps/extension/output/firefox-mv2`** (Firefox; WXT emits MV2 for Firefox in this project). Load **Load unpacked** from `chrome_edge-mv3` for Chromium browsers. **Safari** does not use Chromium’s **Load unpacked** flow: on macOS, point Apple’s **Safari Web Extension** converter at **`safari-mv3`** or **`chrome_edge-mv3`**, then run/sign via Xcode — see [doc/INSTALL-LOCAL-TESTING.md](doc/INSTALL-LOCAL-TESTING.md) and [doc/PUBLISHING-EXTENSION-STORES.md](doc/PUBLISHING-EXTENSION-STORES.md).

Put `.env` next to [`apps/extension/wxt.config.ts`](apps/extension/wxt.config.ts) if you use WXT env vars (or follow WXT’s env file discovery for that app).

## Build

```bash
pnpm build
pnpm build:firefox
pnpm build:safari
pnpm zip
```

## Quality (format, lint, tests, types)

From the **repository root**:

```bash
pnpm format        # Prettier — write
pnpm format:check  # Prettier — CI-style check
pnpm lint          # ESLint (incl. no-explicit-any)
pnpm test          # Vitest
pnpm check         # format:check + lint + test + tsc (SDK + extension)
```

**GitHub Actions** runs **`pnpm check`** on pull requests and attaches store-ready browser zips when you **publish** a GitHub Release ([doc/GITHUB-ACTIONS.md](doc/GITHUB-ACTIONS.md)). Run **`pnpm check`** and (for packaging-sensitive changes) **`pnpm build`** locally before merging.

**pnpm-only:** `.npmrc` sets `package-manager-strict=true`. Use a **git** clone so `pnpm install` can install the **Husky** pre-commit hook (`lint-staged`: ESLint + Prettier on staged files).

## Configure support URLs

Copy [`apps/extension/.env.example`](apps/extension/.env.example) to `apps/extension/.env` (or project root per WXT docs).

**Option A — JSON list (any number of rows):** set `WXT_TABOCALYPSE_SUPPORT_LINKS` to a single-line JSON array. Each object needs `label` and `url` (`https://` or `http://`). Optional `kind` categorizes links as `feedback`, `donate`, `source`, or `link`; the footer shows plain-text labels only.

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
