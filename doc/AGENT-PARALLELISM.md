# Agent parallelism (Cursor chats)

This guide is for contributors who run **multiple Cursor chats/agents** in parallel.

## The rule

**One writer per worktree.** If two agents edit the same branch + working directory, you will get overwritten changes and oscillating diffs.

## Recommended setup: git worktrees

Use a dedicated worktree per writer chat.

PowerShell example from repo root:

```powershell
# Create a sibling folder for worktrees
mkdir ..\tabocalypse-wt -ErrorAction SilentlyContinue | Out-Null

# Create a branch + worktree for a second writer
git worktree add ..\tabocalypse-wt\agent-a -b agent/a

# Create a third writer
git worktree add ..\tabocalypse-wt\agent-b -b agent/b
```

Then open each worktree folder in its own Cursor window/chat and keep each writer confined to that folder.

## Lightweight lock (optional)

If you must collaborate in a single worktree, use a lock file:

- Copy `.cursor/LOCK.template.md` to `.cursor/LOCK.md`
- Fill it in before editing
- Clear it when done

`LOCK.md` is gitignored so it won’t pollute commits.

## Minimize merge conflicts

Use “ownership lanes” (see `AGENTS.md`) so parallel branches touch different areas of the repo whenever possible.
