# ADR-0005: pnpm-only monorepo with strict package-manager enforcement

| Status | ✅ Accepted        |
| ------ | ------------------ |
| Date   | 2026-05-03         |
| Scope  | Repository tooling |

## Context

The repo holds the extension, a publishable SDK, an example plugin, and (later) the Projocalypse submodule. Mixed lockfiles from npm and pnpm had already caused drift in sibling projects, and Husky hooks plus CI need one deterministic install path.

## Decision

- **pnpm is the only package manager.** The root `package.json` pins `packageManager` (currently pnpm 11) and `engines.node >= 20`; `.npmrc` sets `package-manager-strict=true` so npm and yarn refuse to install. `package-lock.json` and `npm-shrinkwrap.json` are gitignored.
- Workspaces: `apps/extension`, `packages/plugin-sdk`, `packages/example-plugin`, `packages/projocalypse` (submodule). Root scripts delegate with `pnpm --filter`.
- Quality gate is one command, **`pnpm check`** (Prettier check, ESLint with zero warnings, Vitest, `tsc` for SDK and extension). CI runs the same command.
- Husky `pre-commit` runs lint-staged and also bumps the extension **patch** version and regenerates the embedded changelog so every commit is a distinct build.

## Consequences

- Docs and agent rules must say `pnpm dlx` rather than `npx`; contributors on npm see an install error rather than a divergent lockfile.
- The automatic patch bump means only minor/major bumps are done by hand, and `doc/CHANGELOG.md` tracks major/minor lines only ([ADR-0012](ADR-0012-CURATED-CHANGELOG-AND-DOC-LAYOUT.md)).
- Adding a dependency is a deliberate act that touches `pnpm-lock.yaml`; drive-by `npm install` cannot happen.

## References

- [`package.json`](../../package.json), [`.npmrc`](../../.npmrc), [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
- [`.husky/pre-commit`](../../.husky/pre-commit), [`scripts/bump-extension-version.ts`](../../scripts/bump-extension-version.ts)
- [`doc/DEVELOPMENT.md`](../DEVELOPMENT.md)
