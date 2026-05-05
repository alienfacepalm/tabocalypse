## Tabocalypse + Antigravity instructions

Use Antigravity as a suggestion engine, but apply changes as **small, reviewable diffs** that follow repo constraints.

### Source of truth in this repo

- **Behavior**: `AGENTS.md`
- **Repo/tooling/product constraints**: `.cursor/rules/project-conventions.mdc`
- **Keep in sync**: `doc/AGENT-INSTRUCTIONS.md`

### Rules

- **No wide refactors** unless explicitly requested.
- **No secrets**: don’t paste `.env`, tokens, API keys, user data.
- **Always comply with constraints**:
  - pnpm only
  - extension UI: Tailwind only
  - TypeScript: no `any`
  - naming: `I*` for interfaces, `T*` for type aliases
  - filenames: kebab-case
  - product: no publisher backend/keys; declarative plugins only (no user JS execution)

### Preferred Antigravity output

- Diffs/patches per file, or minimal before/after snippets with exact file paths.

### Verification before “done”

- `pnpm check`
- If extension UI/packaging/tooling was touched: `pnpm build`
