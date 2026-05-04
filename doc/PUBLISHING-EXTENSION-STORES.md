# Publishing Tabocalypse to extension stores

This guide is for **maintainers** shipping Tabocalypse to **Chrome Web Store**, **Microsoft Edge Add-ons**, **Firefox Add-ons (AMO)**, and **Safari** (via **Mac App Store** / App Store Connect). It complements the short [store listing checklist](STORE-LISTING.md).

## Before you publish (all stores)

1. **Version** — Bump `version` in [`apps/extension/package.json`](../apps/extension/package.json). WXT uses this when generating the MV3 manifest.
2. **Privacy** — Store forms will ask what data you collect. Use [`PRIVACY.md`](../PRIVACY.md) as the source of truth; keep store text aligned with actual behavior (local storage, optional network to Open-Meteo, user-supplied AI base URL, link-out donate URLs).
3. **Permissions** — Match [`apps/extension/wxt.config.ts`](../apps/extension/wxt.config.ts): `storage`, `alarms`, `notifications`; optional `bookmarks`, `topSites`, `tabs`; `host_permissions` for Open-Meteo; optional OpenAI-compatible host for BYO testing only.
4. **Single purpose** — The extension replaces the **new tab page** with widgets and optional humor/plugins; say that clearly in the listing (see checklist).
5. **Screenshots** — Capture the new tab: default view; **Settings** open (widgets + any “chaos” / import sections); import / BYO AI disclaimer if shown. Follow each store’s resolution and count limits.
6. **Fundraising** — Donate / feature links open **third-party sites** only; Tabocalypse does not process payments. Say so if the store asks about monetization.

## Build artifacts

From the repo root:

```bash
pnpm run build           # chrome-mv3 + safari-mv3 + firefox-mv2 → apps/extension/output/
pnpm run build:firefox   # Firefox only → apps/extension/output/firefox-mv2/
pnpm run build:safari    # Safari MV3 only → apps/extension/output/safari-mv3/
pnpm run zip             # Store-style zip (WXT); confirm output path in the CLI log
```

For Chrome and Edge MV3, the **Load unpacked** folder is usually `chrome-mv3`. The **zip** command packages the right tree for upload—verify the generated file name and contents before upload. **Safari** packaging uses Apple’s tools on a Mac against the **`safari-mv3`** folder (or **`chrome-mv3`**; both are MV3 from the same build) — see [Safari (Mac App Store)](#safari-mac-app-store).

## Chrome Web Store

- **Developer program:** one-time registration fee; use a Google account tied to your publisher identity.
- **Upload:** New item → upload the **zip** from `pnpm run zip` (or zip `chrome-mv3` yourself ensuring `manifest.json` is at the root).
- **Listing:** Title, short + long description, category, screenshots, **privacy practices** questionnaire.
- **Review:** Google may take from hours to several days; respond to policy questions in the dashboard.

Official: [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore).

## Microsoft Edge Add-ons

- Often the **same MV3 package** as Chrome works; Edge has a separate [Partner Center](https://partner.microsoft.com/dashboard) listing.
- Complete the Edge-specific privacy and permissions questionnaire using the same facts as Chrome.

Official: [Publish your extension to the Microsoft Edge Add-ons store](https://learn.microsoft.com/microsoft-edge/extensions-chromium/developer-guide/publish-extension).

## Firefox (AMO)

1. **Add-on ID** — Replace the placeholder in `wxt.config.ts`:

   ```ts
   browser_specific_settings: {
     gecko: {
       id: "tabocalypse@alienfacepalm.invalid", // ← use your real reverse-ID string
     },
   },
   ```

   AMO requires a **unique** add-on ID; coordinate with your Mozilla account.

2. **Signing** — Submit the **source** (or built XPI per Mozilla’s process). Follow [Extension Workshop](https://extensionworkshop.com/documentation/publish/) for signing, listed versions, and review expectations.

3. **Source code** — If you minify or bundle, Mozilla may ask for build instructions and unobfuscated source; keep the repo reproducible (`pnpm install`, `pnpm run build`).

Official: [Distribute your extension](https://extensionworkshop.com/documentation/publish/).

## Safari (Mac App Store)

WXT emits **`apps/extension/output/safari-mv3/`** (Manifest V3 for Safari). The default **`pnpm run build`** refreshes **`chrome-mv3`**, **`safari-mv3`**, and **`firefox-mv2`** together; you can also run **`pnpm run build:safari`** for Safari only.

1. Run **`pnpm run build`** (or **`pnpm run build:safari`**) so `apps/extension/output/safari-mv3/` is up to date.
2. On a **Mac**, use Apple’s **`safari-web-extension-converter`** (from Xcode / Command Line Tools) to turn that folder into a **Safari Web Extension** Xcode project — same idea as local testing in [Install and test locally](INSTALL-LOCAL-TESTING.md#safari).
3. Complete **signing**, **notarization** (if you distribute outside the store), and **App Store Connect** listing steps per Apple’s current documentation.

Official: [Safari Web Extensions](https://developer.apple.com/safari/extensions/).

## Edge cases and policy tips

- **Remote code** — Tabocalypse does not load remote code for core UI; declarative plugins are **JSON** interpreted by the app. Say that clearly if reviewers ask.
- **“User data”** — Imported packs/plugins stay on device; no AlienFacepalm backend (see product rules in [project conventions](../.cursor/rules/project-conventions.mdc)).
- **OpenAI / BYO AI** — Disclose that **optional** test sends a request to a **user-configured** host with a **user-supplied** key.

## After release

- Monitor store **reviews** and **crash reports** (if enabled).
- Keep **PRIVACY.md** and store disclosures updated when permissions or network behavior change.
