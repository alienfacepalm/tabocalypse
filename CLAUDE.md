## Tabocalypse + Claude Code instructions

This file is a thin wrapper around the agent-agnostic rules in `doc/AGENT-INSTRUCTIONS.md`.

This repository also contains the “source of truth” for behavior and repo constraints:

- **Behavior**: `AGENTS.md`
- **Repo/tooling/product constraints**: `.cursor/rules/project-conventions.mdc` (pnpm-only, Tailwind-only for extension UI, no `any`, naming rules, etc.)
- **Other Cursor rules**: all applicable `.cursor/rules/*.mdc` with `alwaysApply: true`
- **Docs index**: `doc/README.md`
-
- **Keep in sync**: `doc/AGENT-INSTRUCTIONS.md`

### How to work in this repo

- **Keep changes surgical**: touch only what the task requires. Avoid “rewrite the whole file.”
- **No secrets**: never paste `.env`, tokens, API keys, user data, or private URLs into prompts.
- **Restate constraints in every prompt**:
  - pnpm only (no npm)
  - extension UI: Tailwind only
  - TypeScript: no `any`
  - naming: interfaces `I*`, type aliases `T*`
  - filenames: kebab-case
  - product: no publisher backend/keys; declarative plugins only (no user JS execution)

### Preferred output format from Claude

- **Patch-shaped** output per file (diffs) or precise before/after snippets with exact file paths.
- If uncertain which files to edit, propose a **minimal file list** first.

### Verification before “done”

From repo root:

- `pnpm run check`
- If extension UI/packaging/tooling was touched: `pnpm run build`
