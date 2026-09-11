# ADR-0014: Store zips are built by CI when a GitHub Release is published; the tag must match the version

| Status | ✅ Accepted                                                              |
| ------ | ------------------------------------------------------------------------ |
| Date   | 2026-06-02                                                               |
| Scope  | `.github/workflows/release.yml`, `scripts/package-store-deliverables.ts` |

## Context

Four store portals each want a zip with the manifest at its root, Firefox additionally wants a sources zip, and Safari wants an MV3 folder to convert on macOS. Building these by hand on a developer machine is error-prone (wrong folder zipped, stale build, mismatched version), and the pre-commit patch bump ([ADR-0005](ADR-0005-PNPM-ONLY-MONOREPO.md)) makes "which version is this zip" a real question.

## Decision

- **Publishing a GitHub Release** with tag `v{version}` triggers the **Release packages** workflow. It fails fast if the tag does not equal `apps/extension/package.json` `version`, requires the production Gecko id secret, runs `pnpm check`, then `pnpm package:stores --skip-check`.
- `package-store-deliverables.ts` is the single packaging script for CI and local use: full `pnpm build`, WXT zips for Chromium (duplicated as `-chrome.zip` and `-edge.zip`, byte-identical) and Firefox (+ `-firefox-sources.zip`), a tar-built `-safari-mv3.zip`, a `DELIVERABLES.md` checklist, and **`verify-store-zip.ts`** checks on every artifact (manifest at root, version match, Chrome equals Edge).
- Assets attach to the release; a manual `workflow_dispatch` run uploads a `tabocalypse-store-deliverables` artifact instead (for dry runs).
- Uploading to each store remains a manual, human step documented in `doc/PUBLISHING-EXTENSION-STORES.md`; no store API tokens live in CI.
- CI on pull requests runs only `pnpm check`; an owner-merge gate workflow enforces who may merge to `master`.

## Consequences

- Any release artifact is reproducible from a tag; the DELIVERABLES checklist records which zip goes where.
- Windows-specific `tar` quirks required extra tests, which is why `verify-store-zip.test.ts` has Windows skips.
- Adding a new browser target means extending one script and one table in `GITHUB-ACTIONS.md`.

## References

- [`doc/GITHUB-ACTIONS.md`](../GITHUB-ACTIONS.md), [`doc/PUBLISHING-EXTENSION-STORES.md`](../PUBLISHING-EXTENSION-STORES.md)
- [`.github/workflows/release.yml`](../../.github/workflows/release.yml), [`ci.yml`](../../.github/workflows/ci.yml), [`owner-merge-gate.yml`](../../.github/workflows/owner-merge-gate.yml)
- [`scripts/package-store-deliverables.ts`](../../scripts/package-store-deliverables.ts), [`scripts/verify-store-zip.ts`](../../scripts/verify-store-zip.ts)
