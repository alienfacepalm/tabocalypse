# Install and test Tabocalypse locally (non-developers)

This page is for **testers** and **early users** who want to run the extension on their computer **without** setting up a full development environment. You still need a **built** copy of the extension (a folder or a zip someone gives you).

## What you need

- **Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, or **Apple Safari** (recent version). **Safari Web Extensions** are built and run on **macOS** (see [Safari](#safari) below).
- Either:
  - **A zip file** built by a developer (`pnpm run zip` from the project — produces a store-style archive), **or**
  - **An unpacked folder** such as `apps/extension/output/chrome_edge-mv3`, `safari-mv3`, or `firefox-mv2` after someone runs `pnpm run build` for you.

Tabocalypse **does not** install like a normal desktop app from an `.exe` or `.dmg`. You load it through the browser’s **developer / temporary add-on** flow.

## Chrome or Microsoft Edge (Chromium)

1. Unzip the archive if you received a **zip** (you should see a `manifest.json` at the top level of the folder you load).
2. Open the extensions page:
   - Chrome: paste `chrome://extensions` in the address bar.
   - Edge: paste `edge://extensions`.
3. Turn on **Developer mode** (toggle in the corner).
4. Click **Load unpacked** and select the folder that contains **`manifest.json`** (for local builds, that is usually `chrome_edge-mv3` inside `apps/extension/output`).
5. Open a **new tab** — it should show Tabocalypse instead of the default new tab page.

**Updates:** When you get a newer build, click **Remove** for the old entry, then **Load unpacked** again on the new folder (or use **Reload** after replacing files in the same folder).

## Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose **`manifest.json`** inside the Firefox build output folder (from this repo, under `apps/extension/output/firefox-mv2` after `pnpm run build` or `pnpm run build:firefox`).

Temporary add-ons **do not persist** across browser restarts; for longer testing, the maintainer should publish to **AMO** (Firefox Add-ons) or you can use **Firefox Developer Edition** / **Nightly** policies per Mozilla’s docs.

## Safari

Safari does **not** use Chrome’s **Load unpacked** flow. You need an **MV3** extension folder (from this repo, `apps/extension/output/safari-mv3` or `chrome_edge-mv3` after `pnpm run build`) and a **Mac** with **Xcode**.

1. Install **Xcode** (or Apple’s Command Line Tools that ship **`safari-web-extension-converter`**).
2. Convert the extension bundle, for example:

   ```bash
   xcrun safari-web-extension-converter /path/to/tabocalypse/apps/extension/output/safari-mv3
   ```

   This creates an Xcode project you open in Xcode to **Run** the embedded app and load the extension in Safari for testing.

3. For distribution, follow Apple’s **Mac App Store** / **App Store Connect** flow for Safari Web Extensions.

Official overview: [Safari Web Extensions](https://developer.apple.com/safari/extensions/).

## Permissions you will see

The extension may ask for **storage**, **alarms**, **notifications**, and optionally **bookmarks**, **top sites**, or **tabs** when you enable related widgets. Weather uses **Open-Meteo**; optional AI testing uses **only a URL and API key you provide**. Details: [PRIVACY.md](../PRIVACY.md).

## If something goes wrong

- Confirm you loaded the folder that contains **`manifest.json`** at its root (not a parent directory).
- Try **removing** the extension and **loading unpacked** again.
- See [Troubleshooting](TROUBLESHOOTING.md) for quick fixes.

If you want to **build from source** yourself, follow [Development](DEVELOPMENT.md) instead.
