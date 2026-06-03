# GitHub Actions

Tabocalypse uses GitHub Actions for **CI** (quality gate on pull requests) and **release packaging** (browser store zips attached to GitHub Releases).

## Workflows

| Workflow             | File                                                                | When it runs                                                                                          |
| -------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **CI**               | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)           | Push and pull requests to `main` / `master`                                                           |
| **Release packages** | [`.github/workflows/release.yml`](../.github/workflows/release.yml) | When a GitHub Release is **published**, or manually via **Actions → Release packages → Run workflow** |

Both workflows use **Node.js 20**, **pnpm 11.1.2** (from root `package.json`), and `pnpm install --frozen-lockfile`.

## CI

Runs `pnpm check` (format check, ESLint, tests, SDK + extension TypeScript). This matches what contributors should run locally before opening a PR ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Release packages

When you **publish** a GitHub Release, the workflow:

1. Verifies the release tag matches [`apps/extension/package.json`](../apps/extension/package.json) `version` (for example tag `v0.1.81` and version `0.1.81`).
2. Requires repository secret **`WXT_TABOCALYPSE_FIREFOX_GECKO_ID`** (production Firefox add-on ID — not the placeholder).
3. Runs `pnpm check`, then `pnpm package:stores --skip-check` (same script as local maintainers).
4. Uploads artifacts to the release:

| Asset                                       | Purpose                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `tabocalypse-{version}-chrome.zip`          | Chrome Web Store                                                         |
| `tabocalypse-{version}-edge.zip`            | Microsoft Edge Add-ons (same MV3 build as Chrome, separate filename)     |
| `tabocalypse-{version}-firefox.zip`         | Firefox AMO                                                              |
| `tabocalypse-{version}-firefox-sources.zip` | Firefox AMO source review                                                |
| `tabocalypse-{version}-safari-mv3.zip`      | Safari MV3 build (unzip on macOS, then `safari-web-extension-converter`) |
| `DELIVERABLES.md`                           | Maintainer checklist                                                     |

Chrome and Edge zips contain the **same** Chromium MV3 build; only the **filenames** differ so each store portal gets a clearly named upload.

### Repository secret

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Name                               | Value                                                         |
| ---------------------------------- | ------------------------------------------------------------- |
| `WXT_TABOCALYPSE_FIREFOX_GECKO_ID` | Your AMO add-on ID (for example `tabocalypse@yourdomain.com`) |

Set this before the first automated release. Without it, **Release packages** fails on published releases.

### Publishing a release

1. Bump `version` in [`apps/extension/package.json`](../apps/extension/package.json).
2. Merge to the default branch and run `pnpm check` locally if you changed code.
3. Create a GitHub Release with tag **`v{version}`** (for example `v0.1.81`) matching the package version.
4. Publish the release — the workflow attaches the zip assets automatically.

### Manual test run

Use **Actions → Release packages → Run workflow** without creating a release. The workflow uploads a **`tabocalypse-store-deliverables`** artifact instead of attaching files to a release. Firefox may use the placeholder Gecko ID if the secret is unset; published releases still require the secret.

## Local equivalent

```bash
pnpm check
pnpm package:stores --skip-check   # after check, skip duplicate check inside script
```

Output: `apps/extension/output/store-deliverables/`. See [Cross-browser publishing plan](CROSS-BROWSER-PUBLISHING-PLAN.md).
