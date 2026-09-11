# Tabocalypse marketing homepage

Static, buildless landing page for Tabocalypse (Tailwind via CDN, no bundler). Not part of the pnpm workspace — nothing here runs through `pnpm check` or `pnpm build`.

## Preview locally

Open `site/index.html` directly in a browser, or serve the folder so relative asset paths resolve over HTTP:

```bash
pnpm dlx serve site
```

## Deploy

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) deploys this folder to GitHub Pages on every push to `master` that touches `site/**` (source: GitHub Actions, not a `/docs` branch folder). Live at `https://alienfacepalm.github.io/tabocalypse/` once Pages is enabled for the repo (**Settings → Pages → Source → GitHub Actions**, one-time). Screenshots under `assets/screenshots/` are real captures from a local build of `apps/extension`, not mockups. Regenerate the source captures with `pnpm build:chrome && pnpm screenshots:docs` (writes `doc/assets/screenshots/`, see [`doc/DEVELOPMENT.md`](../doc/DEVELOPMENT.md#screenshots)), then convert the ones you want here to WebP and keep the existing filenames so `index.html` needs no edits.
