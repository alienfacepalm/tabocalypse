## Tabocalypse Copilot instructions

These instructions apply to GitHub Copilot Chat / coding agent features operating in this repo.

### Source of truth

- **Behavior**: `AGENTS.md`
- **Repo/tooling/product constraints**: `.cursor/rules/project-conventions.mdc`
- **Other Cursor rules**: all applicable `.cursor/rules/*.mdc` with `alwaysApply: true`
- **Docs index**: `doc/README.md`
- **Keep in sync**: `doc/AGENT-INSTRUCTIONS.md`

### Constraints to follow

- pnpm only (no npm)
- extension UI: Tailwind only
- TypeScript: no `any`
- naming: interfaces `I*`, type aliases `T*`
- filenames: kebab-case
- product: no publisher backend/keys; declarative plugins only (no user JS execution)
- never paste secrets (`.env`, tokens, API keys, user data)

### How to propose changes

- Prefer **small, surgical diffs** over rewrites.
- Provide file paths and patch-shaped edits.
- If multiple approaches exist, list tradeoffs instead of picking silently.

### Verification

Before calling work done:

- `pnpm check`
- If extension UI/packaging/tooling was touched: `pnpm build`
