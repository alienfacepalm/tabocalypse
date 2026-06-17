---
name: tabocalypse-pm-board
description: >-
  Keep Tabocalypse roadmap Projocalypse board current — run pm:board locally, sync
  ROADMAP-PM-BOARD.md checkboxes to committed .projocalypse/pending/tabocalypse-roadmap.json,
  run pm:stale after pull. Use when plan markdown changes, shipping roadmap work,
  or user asks for PM board / projocalypse / roadmap sync.
---

# Tabocalypse PM board (Projocalypse)

**Package:** `tabocalypse-roadmap` · **Plan:** [doc/PLAN/ROADMAP-PM-BOARD.md](../../doc/PLAN/ROADMAP-PM-BOARD.md) · **Pending:** `.projocalypse/pending/tabocalypse-roadmap.json`

**Candidates (pre-board):** [doc/PLAN/ROADMAP.md](../../doc/PLAN/ROADMAP.md)

## When to use

- User asks to update PM board, sync projocalypse, or refresh roadmap status
- PR touches `doc/PLAN/ROADMAP-PM-BOARD.md`, `ROADMAP.md`, or `.projocalypse/`
- After approving new items from `ROADMAP.md` → copy into `ROADMAP-PM-BOARD.md` with `pm:PM-T###` ids

## Bootstrap

```bash
pnpm pm:setup
pnpm pm:board
```

## Sync loop

```bash
pnpm pm:sync
pnpm pm:stale
pnpm pm:board
```

1. **Edit plan** — checkboxes + `pm:section=` comments in `ROADMAP-PM-BOARD.md`.
2. **Sync** — `pnpm pm:sync`; commit plan + pending JSON when pending changes.
3. **Verify** — reload `pnpm pm:board` to import pending tasks.

## Column names

Use exact strings from `.projocalypse/workspace.json` (`W1`–`W10`, one week per column):

- `W1 · Ship blockers` through `W10 · Stretch & backlog`
- `Done`

## Do not

- Add `pm:` items without maintainer approval (board is populated from [ROADMAP.md](../../doc/PLAN/ROADMAP.md))
- Commit plan checkbox changes without running `pnpm pm:sync` when checkboxes changed
- Duplicate `pm:PM-T###` ids
