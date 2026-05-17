# Contributing

Shipped Tabocalypse—the new tab people use every day—only gets better when someone reads the constraints, runs the checks, and lands a **small, honest** change. **That effort is the product.** If you are contributing, your work reaches real users (clearer UI, safer plugins, fewer rough edges). Thank you for being part of it.

## Workflow

1. **Fork / branch** from the default branch your team uses (`main` or `master`).
2. **Install** with `pnpm install` (see [Development](DEVELOPMENT.md)).
3. **Implement** the smallest change that satisfies the issue; follow [AGENTS.md](../AGENTS.md) (surgical edits, clear success criteria).
4. **Verify** before opening a PR:

   ```bash
   pnpm check
   pnpm build
   ```

   There is no GitHub Actions workflow yet; those commands match what CI would run once added.

5. **Pre-commit** — Staged files run through **lint-staged** (ESLint + Prettier). Fix reported issues or run `pnpm format` and `pnpm lint` locally.

## Conventions

Product and toolchain rules live in [`.cursor/rules/project-conventions.mdc`](../.cursor/rules/project-conventions.mdc) (always-on for Cursor) and the summary table in [AGENTS.md](../AGENTS.md). Highlights:

- **pnpm** only; no `npm` lockfiles.
- **TypeScript** — no `any`; match existing naming in the folder you touch.
- **File names** — kebab-case for app/package sources (see ESLint `unicorn/filename-case`).
- **Tests** — add or update tests with changes to **critical** logic (especially `plugin-sdk` validation and security-sensitive paths).

## Documentation

When you change user-visible behavior, permissions, or network use, update **[PRIVACY.md](../PRIVACY.md)** and, if you maintain store listings, **[Publishing](PUBLISHING-EXTENSION-STORES.md)** / **[STORE-LISTING.md](STORE-LISTING.md)** as needed.

For user-facing shipped changes, also add an entry to **[doc/CHANGELOG.md](CHANGELOG.md)**. That changelog is **major/minor only** (it does not track patch versions), so keep entries under **[Unreleased]** until the next major/minor bump.
