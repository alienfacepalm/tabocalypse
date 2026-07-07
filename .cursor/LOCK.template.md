# Agent lock (do not commit `LOCK.md`)

This repo occasionally uses multiple Cursor chats/agents. To prevent “diff thrash”, use a **single-writer lock**.

## How to use

- Copy this file to `.cursor/LOCK.md` (ignored by git).
- Before making edits in a chat, claim the lock by filling the fields below.
- When done, release the lock (clear the fields).

## Lock state

- **Owner**:
- **Chat/agent**:
- **Branch**:
- **Worktree path**:
- **Scope (what you’re changing)**:
- **Files / directories**:
- **Started**:
- **Expected release**:

## Notes

- Advisors should stay read-only and provide patches/snippets for the Driver to apply.
- If you need true parallel coding, use separate **branches + worktrees** so each writer is isolated.
