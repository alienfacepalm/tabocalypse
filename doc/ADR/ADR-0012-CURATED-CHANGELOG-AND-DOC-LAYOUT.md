# ADR-0012: Curated major/minor changelog embedded in Settings; docs live in `doc/` with UPPERCASE names

| Status | ✅ Accepted                                      |
| ------ | ------------------------------------------------ |
| Date   | 2026-05-05 (changelog), 2026-05-03 (doc layout)  |
| Scope  | `doc/`, `doc/CHANGELOG.md`, Settings › Changelog |

## Context

The pre-commit hook bumps the extension patch version on every commit ([ADR-0005](ADR-0005-PNPM-ONLY-MONOREPO.md)), so a changelog that tracked every version would be noise. Users, store reviewers, and agents all need one readable list of what changed. The repo also serves several coding agents, which need one predictable place to find guides.

## Decision

- **`doc/CHANGELOG.md`** follows Keep a Changelog and tracks **major/minor lines only**. Everything landing on the default branch goes under **[Unreleased]** in plain language about what users notice; entries roll into a dated section when the minor or major version is bumped by hand. Patch detail stays in git history.
- Keeping [Unreleased] current is a **commit blocker** for user-facing work, on the same footing as a failing test.
- The changelog is **embedded in the extension**: `generate-settings-changelog.ts` converts it to `lib/changelog/changelog.generated.ts`, shown under **Settings › Changelog**. The pre-commit hook regenerates it so the embed never goes stale.
- **Documentation layout:** all guides live in **`doc/`** (never `docs/`), with **uppercase basenames** (`DEVELOPMENT.md`, `PLUGIN-SCHEMA.md`); `README.md` is the conventional exception. Plans go under `doc/PLAN/`, decision records under `doc/ADR/`, images under `doc/assets/`. Every new `doc/*.md` is linked from the root `README.md` and `doc/README.md`.
- Rules for agents (`.cursor/rules/*.mdc`, `AGENTS.md`) are mirrored into per-agent files (`CLAUDE.md`, `.clinerules`, Copilot, Continue) via `doc/AGENT-INSTRUCTIONS.md`.

## Consequences

- Release notes for stores are copied from a dated changelog section rather than written from scratch.
- `changelog.generated.ts` is a generated file that is nevertheless committed; hand edits are forbidden.
- GitHub Pages cannot use a `/docs` folder source; the site deploys via Actions instead ([ADR-0018](ADR-0018-STATIC-MARKETING-SITE-ON-GITHUB-PAGES.md)).

## References

- [`.cursor/rules/documentation-layout.mdc`](../../.cursor/rules/documentation-layout.mdc), [`update-docs-before-commit.mdc`](../../.cursor/rules/update-docs-before-commit.mdc), [`settings-changelog-version-bump.mdc`](../../.cursor/rules/settings-changelog-version-bump.mdc)
- [`doc/CHANGELOG.md`](../CHANGELOG.md), [`apps/extension/scripts/generate-settings-changelog.ts`](../../apps/extension/scripts/generate-settings-changelog.ts)
