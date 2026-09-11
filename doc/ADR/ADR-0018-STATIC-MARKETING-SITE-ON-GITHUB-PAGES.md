# ADR-0018: The marketing homepage is a static, buildless page deployed to GitHub Pages

| Status | ✅ Accepted                            |
| ------ | -------------------------------------- |
| Date   | 2026-09-07                             |
| Scope  | `site/`, `.github/workflows/pages.yml` |

## Context

Store listings need a homepage and a public privacy URL; the supporter chooser and the future theme designer need a home too. Anything with a build step or a host bill would contradict the zero-recurring-cost stance ([ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md)).

## Decision

- `site/` holds plain HTML (`index.html`, `support.html`) with **Tailwind via CDN**, no bundler, no framework, no analytics, no cookies. It is **outside the pnpm workspace**, so `pnpm check` and `pnpm build` ignore it.
- The homepage demonstrates the product with **real captures** of the HUD (Playwright against a local build, see [ADR-0019](ADR-0019-DOC-SCREENSHOTS-VIA-PLAYWRIGHT-SCRIPT.md)) and a live, draggable demo of the panels, dark/light toggle, and palette picker built from the same tokens.
- Deployment is the **GitHub Actions Pages source**: pushes to `master` that touch `site/**` (or the workflow) publish to `https://alienfacepalm.github.io/tabocalypse/`. The `/docs` folder source is not used because `doc/` is reserved for guides ([ADR-0012](ADR-0012-CURATED-CHANGELOG-AND-DOC-LAYOUT.md)).
- The same host will serve the static signed catalog and the theme designer page when those ship; a custom domain is an optional later trust upgrade.

## Consequences

- Site changes ship without touching the extension release cycle.
- There is no site analytics by design; marketing success is measured at the stores and on GitHub ([`doc/PLAN/MARKETING.md`](../PLAN/MARKETING.md)).
- Anyone can preview the site by opening the HTML file or `pnpm dlx serve site`.

## References

- [`site/README.md`](../../site/README.md), [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)
- `doc/CHANGELOG.md` 1.0 — "Marketing homepage launch"
