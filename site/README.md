# Tabocalypse marketing homepage

Static, buildless landing page for Tabocalypse (Tailwind via CDN, no bundler). Not part of the pnpm workspace — nothing here runs through `pnpm check` or `pnpm build`.

## Preview locally

Open `site/index.html` directly in a browser, or serve the folder so relative asset paths resolve over HTTP:

```bash
npx serve site
```

## Deploy

Point GitHub Pages (or any static host) at this `site/` folder. Screenshots under `assets/screenshots/` are real captures from a local build of `apps/extension` (Playwright + the `chrome_edge-mv3` output), not mockups — recapture them the same way after any visual change worth showing off.
