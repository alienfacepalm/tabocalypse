# ADR-0004: WXT + React, one Chromium MV3 build for Chrome and Edge, Safari MV3, Firefox MV2

| Status | ✅ Accepted                                                      |
| ------ | ---------------------------------------------------------------- |
| Date   | 2026-05-05 (Chromium output rename); toolchain choice 2026-05-03 |
| Scope  | `apps/extension` build and packaging                             |

## Context

The product must ship on Chrome, Edge, Firefox, and Safari from one codebase. Manifest V3 is mandatory on Chromium stores; Firefox still packages best as MV2 through WXT; Safari requires Apple's converter on macOS regardless of manifest version.

## Decision

- Build with **[WXT](https://wxt.dev/)** (Vite-based) and **React 19**, using `webextension-polyfill` for the `browser.*` API surface.
- Produce three browser folders under `apps/extension/output/`:
  - **`chrome_edge-mv3`** — WXT's `chrome-mv3` output, renamed by [`rename-chrome-mv3-to-chrome-edge-mv3.ts`](../../apps/extension/scripts/rename-chrome-mv3-to-chrome-edge-mv3.ts) to make explicit that **Chrome and Edge share one identical build**. Store zips differ only by filename.
  - **`safari-mv3`** — WXT Safari MV3 build, converted with `safari-web-extension-converter` on macOS for the App Store.
  - **`firefox-mv2`** — WXT Firefox build with `browser_specific_settings.gecko.id` from `WXT_TABOCALYPSE_FIREFOX_GECKO_ID`.
- The new tab page is the single UI entrypoint (`chrome_url_overrides.newtab`); an MV3 **service worker** (`background.ts`) owns alarms, notifications, and privileged fetches ([ADR-0009](ADR-0009-PRIVILEGED-FETCH-HOST-ALLOWLIST.md)).
- WXT's dev runner is disabled; developers load the unpacked folder themselves.

## Consequences

- One `pnpm build` yields every store artifact; `pnpm package:stores` zips and verifies them (manifest at zip root, version match, Chrome and Edge byte-identical).
- Safari testing and publishing still need a Mac; docs must always list Safari alongside the other three browsers.
- Generated folders (`.wxt/`, `output/`) are gitignored and must never be edited by hand.
- Anything that differs per browser (managed storage, notification behaviour on Windows) must be handled at runtime, not by forking the source.

## References

- [`apps/extension/wxt.config.ts`](../../apps/extension/wxt.config.ts)
- [`.cursor/rules/chromium-output-folder-name.mdc`](../../.cursor/rules/chromium-output-folder-name.mdc), [`extension-build-output.mdc`](../../.cursor/rules/extension-build-output.mdc), [`safari-supported-browser.mdc`](../../.cursor/rules/safari-supported-browser.mdc)
- [`doc/PUBLISHING-EXTENSION-STORES.md`](../PUBLISHING-EXTENSION-STORES.md), [`doc/CROSS-BROWSER-PUBLISHING-PLAN.md`](../CROSS-BROWSER-PUBLISHING-PLAN.md)
