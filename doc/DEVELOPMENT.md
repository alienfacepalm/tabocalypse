# Development guide

## Prerequisites

- **Node.js** 20 or newer (see root `package.json` → `engines`)
- **pnpm** 11.x — the exact version is pinned in [`packageManager`](../package.json) and [`.npmrc`](../.npmrc) sets `package-manager-strict=true`. Install via [pnpm.io/installation](https://pnpm.io/installation) or Corepack: `corepack enable && corepack prepare pnpm@latest --activate`

## Clone and install

From the **repository root**:

```bash
git clone <your-fork-or-upstream-url> tabocalypse
cd tabocalypse
pnpm install
```

Use a normal **git** clone so the **Husky** `pre-commit` hook (lint-staged) can install.

## Monorepo layout

| Path                                                     | Role                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`apps/extension`](../apps/extension/)                   | WXT + React extension (new tab UI, background, manifest)                       |
| [`packages/plugin-sdk`](../packages/plugin-sdk/)         | `@tabocalypse/plugin-sdk` — types + `validatePluginJsonText` (no browser APIs) |
| [`packages/example-plugin`](../packages/example-plugin/) | Sample `tabocalypse-plugin.json` for authors                                   |
| [`examples/`](../examples/)                              | Pack starter JSON and notes                                                    |

## Day-to-day commands

All commands run from the **repo root** unless noted.

| Command                 | Purpose                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`              | WXT dev server (Chrome target by default); reload the unpacked extension after changes                                                                                                                                  |
| `pnpm dev:firefox`      | Same for Firefox                                                                                                                                                                                                        |
| `pnpm build`            | Production build → `chrome_edge-mv3/`, `safari-mv3/`, and `firefox-mv2/` under `apps/extension/output/`. Regenerates the embedded Settings changelog first, then renames WXT's `chrome-mv3` folder to `chrome_edge-mv3` |
| `pnpm build:chrome`     | Chromium only → `apps/extension/output/chrome_edge-mv3/` (fastest loop for Chrome/Edge testing and screenshots)                                                                                                         |
| `pnpm build:firefox`    | Firefox only → `apps/extension/output/firefox-mv2/` (WXT emits MV2 for Firefox here)                                                                                                                                    |
| `pnpm build:safari`     | Safari MV3 only → `apps/extension/output/safari-mv3/`                                                                                                                                                                   |
| `pnpm zip`              | WXT zip for one browser target (see [publishing](PUBLISHING-EXTENSION-STORES.md))                                                                                                                                       |
| `pnpm package:stores`   | **Recommended before store upload:** `pnpm check`, full `pnpm build`, all browser zips, and `DELIVERABLES.md` under `apps/extension/output/store-deliverables/`                                                         |
| `pnpm check`            | Format check, ESLint (zero warnings), tests, TypeScript for SDK + extension (`format:check`, `lint`, `test`, `check:sdk`, `check:extension` run individually)                                                           |
| `pnpm format`           | Prettier write on tracked file types                                                                                                                                                                                    |
| `pnpm test`             | Vitest (`pnpm test:watch` for watch mode)                                                                                                                                                                               |
| `pnpm screenshots:docs` | Capture HUD and Settings screenshots from the built `chrome_edge-mv3` folder into `doc/assets/screenshots/` (Playwright, headless). See [Screenshots](#screenshots)                                                     |
| `pnpm scripts:list`     | Print every root and workspace script with a one-line description                                                                                                                                                       |

Less common: `pnpm generate:settings-changelog` (rebuild the Settings › Changelog embed from `doc/CHANGELOG.md`), `pnpm scrape:unsuck-classics` (maintainer humor-pack scrape), `pnpm --filter extension icons:transparent-public`, and the `pnpm pm:*` board commands in [PLAN/PROJOCALYPSE.md](PLAN/PROJOCALYPSE.md).

**Pre-commit hook.** Husky runs lint-staged (ESLint fix + Prettier on staged files), then **bumps the extension patch version** in `apps/extension/package.json` and regenerates `lib/changelog/changelog.generated.ts`, staging both. Every commit is therefore a distinct patch build; only minor/major bumps are edited by hand ([ADR-0005](ADR/ADR-0005-PNPM-ONLY-MONOREPO.md), [ADR-0012](ADR/ADR-0012-CURATED-CHANGELOG-AND-DOC-LAYOUT.md)).

Weather **location map** regressions: `apps/extension/lib/weather/weather-static-map-measure.test.ts`, `weather-static-map-url.test.ts`, and the network e2e in `weather-static-map-load.e2e.test.ts` (Yandex hybrid tile fetch).

**Safari** ships from **`safari-mv3`** (or **`chrome_edge-mv3`**; both are MV3) with Apple’s **Safari Web Extension** converter on macOS — see [Install and test locally](INSTALL-LOCAL-TESTING.md#safari) and [Publishing](PUBLISHING-EXTENSION-STORES.md#safari-mac-app-store).

## Load the extension during development

1. Run `pnpm dev` (or `pnpm build` for a static folder).
2. **Chrome / Edge:** `chrome://extensions` → **Developer mode** → **Load unpacked** → choose `apps/extension/output/chrome_edge-mv3`.
3. **Firefox:** `about:debugging` → **This Firefox** → **Load Temporary Add-on** → pick `manifest.json` inside the Firefox output folder under `apps/extension/output/`.
4. **Safari:** On macOS, convert `apps/extension/output/safari-mv3` (or `chrome_edge-mv3`) and run from Xcode — same links as above.

After code changes, use the browser’s **reload extension** control; for `dev`, WXT may rebuild — reload again if the new tab page looks stale.

## Configuration

Copy [`apps/extension/.env.example`](../apps/extension/.env.example) to `apps/extension/.env`. Every variable is optional except the Gecko ID before a Firefox store submit; none of them is a secret.

| Variable                                                      | Purpose                                                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `WXT_TABOCALYPSE_SUPPORT_LINKS`                               | JSON array of footer links (`label`, `url`, `kind`: `donate` / `feedback` / `source`), e.g. the supporter chooser page |
| `WXT_TABOCALYPSE_DONATE_URL` / `_FEATURE_URL` / `_GITHUB_URL` | Legacy single-URL equivalents of the list above                                                                        |
| `WXT_TABOCALYPSE_FIREFOX_GECKO_ID`                            | Unique reverse-domain add-on id for Firefox AMO (placeholder `tabocalypse@alienfacepalm.invalid` otherwise)            |
| `WXT_TABOCALYPSE_BUILTIN_HUMOR_PACKS_URL`                     | Optional HTTPS JSON that refreshes built-in humor pack lines (schema v1; see `lib/humor/humor-content-cache.ts`)       |
| `WXT_TABOCALYPSE_FEEDBACK_TO`                                 | Recipient for **Settings › Feedback & Feature Requests** (mailto only, no SMTP); defaults to the maintainer address    |

- **Manifest and browser IDs:** [`apps/extension/wxt.config.ts`](../apps/extension/wxt.config.ts) — permissions, host allowlist, and Firefox `browser_specific_settings.gecko.id`.

## Screenshots

Documentation and marketing images are **real captures**, never mock-ups ([ADR-0019](ADR/ADR-0019-DOC-SCREENSHOTS-VIA-PLAYWRIGHT-SCRIPT.md)):

```bash
pnpm build:chrome                      # or pnpm build
pnpm exec playwright install chromium  # once per machine
pnpm screenshots:docs                  # writes doc/assets/screenshots/*.png|jpg
```

The script ([`scripts/capture-doc-screenshots.ts`](../scripts/capture-doc-screenshots.ts)) loads the built extension in a throwaway headless Chromium profile, walks through the first-run welcome, the HUD in Balanced / Focus / Light modes, each panel, and the main Settings sections. It uses live public data, so recapture after any visual change and commit the new files with it.

<p align="center"><img src="assets/screenshots/hud-default.jpg" alt="Tabocalypse HUD, Balanced personality, dark mode" width="720"></p>

## Conventions for contributors

- **[AGENTS.md](../AGENTS.md)** — how we scope changes and verify work.
- **[`.cursor/rules/project-conventions.mdc`](../.cursor/rules/project-conventions.mdc)** — product invariants (no publisher backend, declarative plugins only, BYO AI keys, Tailwind for UI, pnpm, tests for critical paths, file naming, and tooling).

## Useful references

- [WXT documentation](https://wxt.dev/)
- [Plugin schema](PLUGIN-SCHEMA.md)
- [Architecture](ARCHITECTURE.md)
- [Architecture decision records](ADR/README.md) — why the constraints above exist
