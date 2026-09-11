# ADR-0019: Documentation screenshots are captured by a checked-in Playwright script

| Status | ✅ Accepted                                                                                 |
| ------ | ------------------------------------------------------------------------------------------- |
| Date   | 2026-09-11                                                                                  |
| Scope  | `scripts/capture-doc-screenshots.ts`, `doc/assets/screenshots/`, `site/assets/screenshots/` |

## Context

The homepage shipped with hand-run Playwright captures that were not reproducible from the repo. Docs, store listings, and the marketing plan all need current images of the HUD and Settings, and they go stale after every visual change. Mock-ups would misrepresent the product.

## Decision

- A **Playwright** script (`pnpm screenshots:docs`) loads the built `chrome_edge-mv3` folder into a throwaway headless Chromium profile, drives the real new-tab page through stable hooks (`button[aria-label="Settings"]`, `details.acc-item` summaries, `[data-hud-panel-id]`, personality and palette chips), seeds a HUD location in storage, and writes files to **`doc/assets/screenshots/`**.
- Full-page HUD shots are JPEG (wallpaper photos compress well); dialogs and individual panels are PNG for crisp text. Viewport is fixed at 1600×1000.
- `playwright` is a root devDependency; browsers come from the developer's Playwright cache (`pnpm exec playwright install chromium` once).
- Live data is used on purpose (real weather, Steam Charts, wallpaper) so captures are honest; small run-to-run variation is accepted. Nothing is added to the extension solely for screenshots beyond the existing accessible names and panel ids.
- Docs and the marketing plan reference these files by fixed names; recapturing after a visual change is part of "done" for UI work that changes what a screenshot shows.

## Consequences

- Store screenshots ([`doc/STORE-LISTING.md`](../STORE-LISTING.md)) and the homepage can be refreshed in one command instead of a manual session.
- The script depends on the built output existing (`pnpm build` or `pnpm build:chrome`) and on network access to public endpoints.
- Changing an `aria-label` or section title used by the script is a breaking change for it; keep the hooks in sync.

## References

- [`scripts/capture-doc-screenshots.ts`](../../scripts/capture-doc-screenshots.ts)
- [`doc/assets/screenshots/`](../assets/screenshots/), [`site/README.md`](../../site/README.md)
- [ADR-0018](ADR-0018-STATIC-MARKETING-SITE-ON-GITHUB-PAGES.md)
