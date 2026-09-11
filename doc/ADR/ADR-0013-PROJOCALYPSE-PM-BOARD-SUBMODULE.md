# ADR-0013: The roadmap is a checkbox plan synced to the Projocalypse board (git submodule)

| Status | ✅ Accepted                                            |
| ------ | ------------------------------------------------------ |
| Date   | 2026-06-17                                             |
| Scope  | `doc/PLAN/`, `.projocalypse/`, `packages/projocalypse` |

## Context

The maintainer also builds **Projocalypse**, a local-first project-management board. Tabocalypse needs a backlog that humans can read in git, agents can update mechanically, and that renders as a sprint board without a hosted tracker (Jira, Linear) that would add cost and an external dependency.

## Decision

- **Narrative roadmap** in `doc/PLAN/ROADMAP.md` (themes P1–P7, candidate table), and a **machine-readable plan** in `doc/PLAN/ROADMAP-PM-BOARD.md`: one checkbox per task with a stable `pm:PM-T###` id and a `pm:section=` sprint column (`W1`–`W10`, `Done`).
- Projocalypse is vendored as a **git submodule** at `packages/projocalypse`; `pnpm pm:setup` builds its CLI, `pnpm pm:board` serves the board on port 5173, `pnpm pm:sync` bridges the plan into `.projocalypse/pending/tabocalypse-roadmap.json` (committed), `pnpm pm:stale` reports drift.
- After major shipped work, marking the matching task done and running the sync is **required before commit**, alongside the changelog ([ADR-0012](ADR-0012-CURATED-CHANGELOG-AND-DOC-LAYOUT.md)).
- Candidate items enter the board only with maintainer intent; rejected directions (ad-supported models, subscriptions) are recorded in `ROADMAP.md` with strike-through so the reasoning is preserved.

## Consequences

- The board is reproducible from git alone; no account, no server.
- Contributors must init the submodule (`pnpm pm:setup`) to use the board, but can edit the plan file without it.
- Agents have an unambiguous closure ritual: CHANGELOG → board → `pm:sync` → `pm:stale` → commit.

## References

- [`doc/PLAN/PROJOCALYPSE.md`](../PLAN/PROJOCALYPSE.md), [`doc/PLAN/ROADMAP-PM-BOARD.md`](../PLAN/ROADMAP-PM-BOARD.md), [`doc/PLAN/ROADMAP.md`](../PLAN/ROADMAP.md)
- [`.cursor/rules/tabocalypse-pm-board.mdc`](../../.cursor/rules/tabocalypse-pm-board.mdc)
- [`scripts/pm-roadmap-bridge.mjs`](../../scripts/pm-roadmap-bridge.mjs), [`scripts/pm-stale-check.mjs`](../../scripts/pm-stale-check.mjs)
