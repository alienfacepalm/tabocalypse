---
name: check-commit-push
description: >-
  Runs pnpm check (format, lint, test, typecheck), then commits and pushes only
  if validation passes. Use when the user asks to check, test, commit, and push,
  run check and push, says ccp, or wants changes committed after the quality gate.
disable-model-invocation: true
---

# check-commit-push

Run **check → commit → push** end-to-end. **Do not commit or push if checks fail.**

## 1. Check

From the **repo root**:

1. Run **`pnpm check`** (includes `format:check`, `lint`, **`test`**, SDK + extension typecheck).
2. If Prettier fails, run **`pnpm format`**, then **`pnpm check`** again.
3. If the session touched **extension UI, packaging, `wxt.config.ts`, manifest, or public assets**, also run **`pnpm build`** after check passes. Skip build only when changes are clearly unrelated to the extension.
4. On any failure: fix, re-run until green. **Stop here — no commit, no push.**

Details: [validate-commit-push.mdc](../../rules/validate-commit-push.mdc).

## 1b. Docs (after check passes, before commit)

Review staged/changed paths against [update-docs-before-commit.mdc](../../rules/update-docs-before-commit.mdc). **Keep [`doc/CHANGELOG.md`](../../doc/CHANGELOG.md) [Unreleased] up to date** — required for user-facing changes. Update privacy/store docs when required. Stage doc updates with the same commit when they belong together.

## 2. Commit (only if check passed)

Skip this section if there is nothing to commit.

1. Run **`git status`** and **`git diff`** (staged + unstaged) in parallel.
2. Stage **intentional** paths only — never **`apps/extension/output/`**, **`.wxt/`**, **`node_modules/`**, secrets (`.env`, keys).
3. Draft a **Conventional Commits** message: [git-commit-prefixes.mdc](../../rules/git-commit-prefixes.mdc). Imperative summary; body explains _why_ when helpful.
4. Commit (PowerShell: here-string for multi-line message). If pre-commit hook fails, fix and create a **new** commit — do not amend unless hook-only auto-fix rules apply.

If checks passed but **no diff**, say so and skip commit.

## 3. Push (only if check passed)

1. **`git push`** to the tracked upstream (e.g. **`origin master`**).
2. **Skip push** only when: user forbade push, no **`origin`**, not a git repo, or no network — state why.
3. On push failure (auth, branch protection), report the error and next steps.

## Git safety (always)

- Never change git config, force-push **`main`/`master`**, or use **`--no-verify`** unless the user explicitly asked.
- Never commit secrets.

## Done

Report: checks (and build if run), pass/fail, commit hash/message if any, push result or skip reason.
