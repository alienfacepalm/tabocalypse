# Troubleshooting

## “Load unpacked” fails or the extension does not appear

- Select the directory that contains **`manifest.json` at its root** — for Chrome MV3 builds from this repo, that is usually `apps/extension/output/chrome_edge-mv3`, not the repo root and not `output` alone (pick the `chrome_edge-mv3` folder, not the parent `output` folder).
- If you used a **zip**, unzip first; Chrome does not load zip files directly for unpacked installs.

## New tab still shows the default page

- Confirm the extension is **enabled** on `chrome://extensions` or `edge://extensions` (Chromium). On **Safari**, enable the extension under **Settings → Safari → Extensions** after loading it from your Xcode / converter workflow.
- Click **Reload** on the extension card after installing a new build.
- Some browsers cache the new tab page — close all new-tab tabs and open a fresh one.

## Firefox temporary add-on disappeared

Temporary add-ons are cleared when Firefox restarts. Load again from `about:debugging`, or install from **AMO** once published.

## `pnpm install` errors with “wrong package manager”

This repo sets **`package-manager-strict=true`** in [`.npmrc`](../.npmrc). Use **pnpm**, not `npm install`.

## Husky / pre-commit did not run

Hooks install when **`pnpm install`** runs inside a **git** clone. If you downloaded a source zip without `.git`, hooks will not install—run `pnpm check` manually before committing.

## Development build looks stale

After `pnpm dev`, WXT rebuilds on save; use the browser’s **reload extension** and refresh the new tab.

## The footer version does not match `apps/extension/package.json`

`apps/extension/output/` is gitignored and only changes when you build. Every commit bumps the patch version, so after a `git pull` the built folder is usually a version behind — run `pnpm build` (or `pnpm build:chrome`) and reload the extension.

## Widgets say “reload the extension” after an update

The background service worker still runs an older host allowlist. Click **Reload** on the extension card (`chrome://extensions`, `edge://extensions`, or `about:debugging`) and open a fresh new tab.

## `pnpm screenshots:docs` fails to launch Chromium

Install the Playwright browser once (`pnpm exec playwright install chromium`) and make sure `apps/extension/output/chrome_edge-mv3/manifest.json` exists (`pnpm build:chrome`). The capture script needs network access to the same public endpoints the widgets use.
