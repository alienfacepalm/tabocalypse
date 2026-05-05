# Alpha setup (clone, build, install in developer mode)

This guide is for **Alpha users** and **developers** who want to **build Tabocalypse from source** and install it into a browser in **developer mode**.

If you already have a pre-built folder/zip from someone else, use **[Install and test locally](INSTALL-LOCAL-TESTING.md)** instead.

## Supported browsers

Tabocalypse supports **Chrome**, **Microsoft Edge**, **Mozilla Firefox**, and **Apple Safari**.

Safari testing requires **macOS + Xcode** (or Apple Command Line Tools) because Safari does not support Chrome’s “Load unpacked” flow.

## Prerequisites

- **Git**
- **Node.js** \(>= 20\) (see root `package.json` → `engines`)
- **pnpm** (this repo enforces pnpm via `.npmrc`)

### Install pnpm

Pick one:

- **Corepack (recommended)**:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

- **npm global install (fallback)**:

```bash
npm install -g pnpm
```

Verify:

```bash
node --version
pnpm --version
```

## Clone the repo

```bash
git clone <your-fork-or-upstream-url> tabocalypse
cd tabocalypse
```

## Install dependencies

From the repo root:

```bash
pnpm install
```

Notes:

- Use a normal **git clone** (not a downloaded source zip) so `pnpm install` can install the **Husky** pre-commit hook.
- If you see “wrong package manager”, you’re likely running `npm install` by accident—use `pnpm install`.

## Build the extension

From the repo root:

```bash
pnpm build
```

Build outputs are written to:

- `apps/extension/output/chrome_edge-mv3` (Chrome / Edge)
- `apps/extension/output/firefox-mv2` (Firefox)
- `apps/extension/output/safari-mv3` (Safari-targeted MV3 bundle for Apple’s tools)

## Install in each browser (developer mode)

### Chrome (MV3)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select: `apps/extension/output/chrome_edge-mv3` (the folder containing `manifest.json`).
5. Open a **new tab**.

### Microsoft Edge (MV3)

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select: `apps/extension/output/chrome_edge-mv3`.
5. Open a **new tab**.

### Firefox (temporary add-on)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**
3. Choose `apps/extension/output/firefox-mv2/manifest.json`.

Temporary add-ons do **not** persist across Firefox restarts; you must load it again.

### Safari (macOS)

Safari does not support “Load unpacked”. You convert the built bundle into an Xcode project, then run it.

1. On **macOS**, install **Xcode** (or Apple Command Line Tools).
2. After building, convert the bundle (example):

```bash
xcrun safari-web-extension-converter /path/to/tabocalypse/apps/extension/output/safari-mv3
```

3. Open the generated Xcode project and **Run** to load the extension into Safari for testing.

Reference: [Safari Web Extensions](https://developer.apple.com/safari/extensions/).

## Optional: run the dev build (hot rebuilds)

From the repo root:

```bash
pnpm dev          # Chrome target by default
pnpm dev:firefox
```

After changes, use the browser’s **Reload** control for the installed extension, then open a fresh new tab.

## If something goes wrong

- Ensure you selected the folder that contains `manifest.json` at its root.
- See **[Troubleshooting](TROUBLESHOOTING.md)**.
