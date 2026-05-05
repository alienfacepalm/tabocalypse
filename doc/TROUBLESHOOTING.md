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
