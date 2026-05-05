# Development guide

## Prerequisites

- **Node.js** 20 or newer (see root `package.json` → `engines`)
- **pnpm** 10.x — this repo uses [`packageManager`](../package.json) and [`.npmrc`](../.npmrc) (`package-manager-strict=true`). Install via [pnpm.io/installation](https://pnpm.io/installation) or Corepack: `corepack enable && corepack prepare pnpm@latest --activate`

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

| Command              | Purpose                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev`           | WXT dev server (Chrome target by default); reload the unpacked extension after changes                  |
| `pnpm dev:firefox`   | Same for Firefox                                                                                        |
| `pnpm build`         | Production build → `chrome_edge-mv3/`, `safari-mv3/`, and `firefox-mv2/` under `apps/extension/output/` |
| `pnpm build:firefox` | Firefox only → `apps/extension/output/firefox-mv2/` (WXT emits MV2 for Firefox here)                    |
| `pnpm build:safari`  | Safari MV3 only → `apps/extension/output/safari-mv3/`                                                   |
| `pnpm zip`           | Produce a store-ready zip (see [publishing](PUBLISHING-EXTENSION-STORES.md))                            |
| `pnpm check`         | Format check, ESLint (zero warnings), tests, TypeScript for SDK + extension                             |
| `pnpm format`        | Prettier write on tracked file types                                                                    |
| `pnpm test`          | Vitest                                                                                                  |

**Safari** ships from **`safari-mv3`** (or **`chrome_edge-mv3`**; both are MV3) with Apple’s **Safari Web Extension** converter on macOS — see [Install and test locally](INSTALL-LOCAL-TESTING.md#safari) and [Publishing](PUBLISHING-EXTENSION-STORES.md#safari-mac-app-store).

## Load the extension during development

1. Run `pnpm dev` (or `pnpm build` for a static folder).
2. **Chrome / Edge:** `chrome://extensions` → **Developer mode** → **Load unpacked** → choose `apps/extension/output/chrome_edge-mv3`.
3. **Firefox:** `about:debugging` → **This Firefox** → **Load Temporary Add-on** → pick `manifest.json` inside the Firefox output folder under `apps/extension/output/`.
4. **Safari:** On macOS, convert `apps/extension/output/safari-mv3` (or `chrome_edge-mv3`) and run from Xcode — same links as above.

After code changes, use the browser’s **reload extension** control; for `dev`, WXT may rebuild — reload again if the new tab page looks stale.

## Configuration

- **Feedback / donate / outbound links:** copy [`apps/extension/.env.example`](../apps/extension/.env.example) to `apps/extension/.env` and set `WXT_TABOCALYPSE_SUPPORT_LINKS` (JSON list) and/or the legacy `WXT_TABOCALYPSE_*_URL` variables (see [README](../README.md)).
- **Manifest and browser IDs:** [`apps/extension/wxt.config.ts`](../apps/extension/wxt.config.ts) — especially Firefox `browser_specific_settings.gecko.id` before AMO release.

## Conventions for contributors

- **[AGENTS.md](../AGENTS.md)** — how we scope changes and verify work.
- **[`.cursor/rules/project-conventions.mdc`](../.cursor/rules/project-conventions.mdc)** — product invariants (no publisher backend, declarative plugins only, BYO AI keys, Tailwind for UI, pnpm, tests for critical paths, file naming, and tooling).

## Useful references

- [WXT documentation](https://wxt.dev/)
- [Plugin schema](PLUGIN-SCHEMA.md)
- [Architecture](ARCHITECTURE.md)
