# Agent instructions (non-Cursor)

This repo supports multiple coding agents. These rules are **agent-agnostic** and should be reflected in each agent’s convention file (for example `CLAUDE.md`, `.clinerules`, etc.).

## Sources of truth

- **Behavior** (simplicity, surgical edits, verification): `AGENTS.md`
- **Repo + product constraints**: `.cursor/rules/project-conventions.mdc`
- **Other Cursor rules**: all applicable `.cursor/rules/*.mdc` with `alwaysApply: true`
- **Docs index**: `doc/README.md`

## Hard constraints (must always be restated)

- **pnpm only** (no npm)
- **Extension UI styling**: Tailwind only
- **TypeScript**: no `any`
- **Naming**: interfaces `I*`, type aliases `T*`
- **Filenames**: kebab-case
- **Product**: no publisher backend/keys; declarative plugins only (no user JS execution)
- **Secrets**: never paste `.env`, tokens, API keys, user data

## Preferred change shape

- Keep changes **small and reviewable** (avoid wide refactors unless asked).
- Ask for **patch-shaped** output per file (diffs) or precise before/after snippets with exact file paths.

## Verification (before “done”)

From repo root:

- `pnpm check`
- If extension UI/packaging/tooling was touched: `pnpm build`

## Alignment rule (keep agent files synced)

When you change either:

- `AGENTS.md`, or
- `.cursor/rules/project-conventions.mdc`

…you must review and update, as needed:

- `doc/AGENT-INSTRUCTIONS.md` (this file)
- `CLAUDE.md`
- `ANTIGRAVITY.md`
- `.clinerules`
- `.github/copilot-instructions.md`
- `.continue/rules.md`

If you add a new agent integration file, it must also:

- Link to `AGENTS.md` and `.cursor/rules/project-conventions.mdc`
- Include the **Hard constraints** section (or clearly delegate to this doc)
