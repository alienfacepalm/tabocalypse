## Tabocalypse rules (Continue)

### Source of truth

- Behavior guidelines: `AGENTS.md`
- Repo/tooling/product constraints: `.cursor/rules/project-conventions.mdc`
- Other Cursor rules: all applicable `.cursor/rules/*.mdc` with `alwaysApply: true`
- Keep in sync: `doc/AGENT-INSTRUCTIONS.md`

### Constraints

- pnpm only (no npm)
- extension UI: Tailwind only
- TypeScript: no `any`
- naming: interfaces `I*`, type aliases `T*`
- filenames: kebab-case
- product: no publisher backend/keys; declarative plugins only (no user JS execution)
- never paste secrets (`.env`, tokens, API keys, user data)

### Preferred change style

- Small, surgical diffs; avoid whole-file rewrites.
- Patch-shaped output per file, with explicit file paths.

### Verification

- `pnpm run check`
- If extension UI/packaging/tooling was touched: `pnpm run build`
