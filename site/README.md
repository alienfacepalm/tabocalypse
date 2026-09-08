# Tabocalypse marketing homepage

Static, buildless landing page for Tabocalypse (Tailwind via CDN, no bundler). Not part of the pnpm workspace — nothing here runs through `pnpm check` or `pnpm build`.

## Preview locally

Open `site/index.html` directly in a browser, or serve the folder so relative asset paths resolve over HTTP:

```bash
npx serve site
```

## Deploy

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) deploys this folder to GitHub Pages on every push to `master` that touches `site/**` (source: GitHub Actions, not a `/docs` branch folder). Live at `https://alienfacepalm.github.io/tabocalypse/` once Pages is enabled for the repo (**Settings → Pages → Source → GitHub Actions**, one-time). Screenshots under `assets/screenshots/` are real captures from a local build of `apps/extension` (Playwright + the `chrome_edge-mv3` output), not mockups — recapture them the same way after any visual change worth showing off.
