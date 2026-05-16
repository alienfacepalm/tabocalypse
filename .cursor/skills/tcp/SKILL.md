---
name: tcp
description: >-
  Run test, commit, and push — validate the repo, commit staged work with a clear
  message, push to origin. Use when the user says "tcp", "test commit and push",
  or "test, commit and push".
disable-model-invocation: true
---

# tcp — test, commit, and push

When the user says **tcp** (or asks to **test, commit, and push**), run this workflow end-to-end. Do not stop after checks alone unless there is nothing to commit.

## 1. Test (validate)

From the **repo root**:

1. Run **`pnpm check`** (format check, ESLint, tests, SDK + extension typecheck).
2. If the session touched **extension UI, packaging, `wxt.config.ts`, manifest, or public assets**, also run **`pnpm build`**. Skip only when changes are clearly unrelated to the extension (e.g. isolated internal docs).
3. On failure: fix, re-run until green. Run **`pnpm format`** if Prettier reports drift.

Tabocalypse details: [validate-commit-push.mdc](../../rules/validate-commit-push.mdc).

## 2. Commit

Only if there are changes to commit:

1. **`git status`** and **`git diff`** (staged + unstaged) in parallel.
2. Stage **intentional** paths only — never **`apps/extension/output/`**, **`.wxt/`**, **`node_modules/`**, secrets (`.env`, keys).
3. Commit with a **Conventional Commits** message: [git-commit-prefixes.mdc](../../rules/git-commit-prefixes.mdc). Use a HEREDOC for the message. Imperative summary; explain _why_ in the body if needed.
4. If the pre-commit hook fails, fix and create a **new** commit (do not amend unless hook-only auto-fix rules apply).

If there is **no diff** to commit after checks pass, say so and skip to push only if the branch is ahead.

## 3. Push

1. **`git push`** to the tracked upstream (e.g. **`origin master`**).
2. **Skip push** only when: user forbade push, no **`origin`**, not a git repo, or no network — state why.
3. On push failure (auth, branch protection), report the error and next steps.

## Git safety (always)

- Never change git config, force-push **`main`/`master`**, or use **`--no-verify`** unless the user explicitly asked.
- Never commit secrets.

## Done

Briefly report: checks run, commit hash/message (if any), push result (or skip reason).
