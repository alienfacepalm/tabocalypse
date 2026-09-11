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
  - product: no publisher backend/keys; declarative plugins only (no user JS execution); no in-extension checkout (purchases are link-out; offline signature verification of purchased tokens/signed JSON is allowed); no ads anywhere (extension, site, first- or third-party packs/plugins); no scheduled delivery obligations

### Preferred Antigravity output

- Diffs/patches per file, or minimal before/after snippets with exact file paths.

### Verification before “done”

- `pnpm check`
- If extension UI/packaging/tooling was touched: `pnpm build`
- User-facing work: update `doc/CHANGELOG.md` **[Unreleased]** before commit
- Major / roadmap work: update `doc/PLAN/ROADMAP-PM-BOARD.md`, run `pnpm pm:sync`, confirm with `pnpm pm:stale`
