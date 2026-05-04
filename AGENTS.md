Behavioral guidelines to reduce common LLM coding mistakes. **Cursor:** this file is complemented by [`.cursor/rules/project-conventions.mdc`](.cursor/rules/project-conventions.mdc) (`alwaysApply: true`) and [`.cursor/rules/documentation-layout.mdc`](.cursor/rules/documentation-layout.mdc) for Tabocalypse-specific toolchain, product rules, and documentation layout. **Human docs:** [doc/README.md](doc/README.md); every guide is also linked from the root [README.md](README.md#documentation) (Documentation).

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that **your** changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → add or run checks for invalid inputs, then fix until satisfied
- "Fix the bug" → reproduce, fix, verify (tests or manual steps as appropriate)
- "Refactor X" → ensure build/tests pass before and after

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Tabocalypse — stack and enforcement

**Authoritative toolchain + product rules live in** [`.cursor/rules/project-conventions.mdc`](.cursor/rules/project-conventions.mdc) (always applied). Summary for humans and agents:

| Area                  | Rule                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package manager**   | **pnpm** only (`.npmrc`: `package-manager-strict=true`). This repo ships `pnpm-lock.yaml`; do not commit `package-lock.json`.                                                                                                                                                                                                                                                         |
| **UI styling**        | **Tailwind CSS only** for extension UI (utilities plus `@layer` in [`apps/extension/entrypoints/newtab/tailwind.css`](apps/extension/entrypoints/newtab/tailwind.css)). Do not add parallel global stylesheets, CSS-in-JS for layout/visuals, or a second design system — see `.cursor/rules/project-conventions.mdc`.                                                                |
| **TypeScript**        | No `any`. Interfaces **`I` + PascalCase**, type aliases **`T` + PascalCase** (ESLint + [`.cursor/rules/typescript-type-prefixes.mdc`](.cursor/rules/typescript-type-prefixes.mdc)).                                                                                                                                                                                                   |
| **File names**        | **kebab-case** for source files (e.g. `app.tsx`, `user-packs.ts`). No `camelCase` / `PascalCase` filenames; see conventions for tool exceptions (`package.json`, `wxt.config.ts`, …).                                                                                                                                                                                                 |
| **Product**           | No publisher backend; no publisher API keys; BYO AI only; declarative plugins only (no user JS from imports); donate/ideas are link-out only.                                                                                                                                                                                                                                         |
| **Plans**             | Do not edit the Cursor plan file for Tabocalypse unless the user asks to change the plan.                                                                                                                                                                                                                                                                                             |
| **Testing**           | Maintain **automated test suites** for **critical** components and functions (data integrity, plugin validation/safety, core flows, packaging). Change critical behavior together with new or updated tests; add a minimal `pnpm` test harness if a package has none yet.                                                                                                             |
| **Prettier / ESLint** | **`pnpm run format`** (or **`format:check`** in CI), **`pnpm run lint`**. Config: root `prettier.config.mjs`, `eslint.config.mjs`.                                                                                                                                                                                                                                                    |
| **Verify**            | **`pnpm run check`** runs format check, lint (zero warnings), tests, SDK + extension `tsc`. **Git:** `.husky/pre-commit` runs **lint-staged** on staged files. For **meaningful** changes, also run extension **`pnpm run build`** when packaging is affected, then **commit** and **push** — see [`.cursor/rules/validate-commit-push.mdc`](.cursor/rules/validate-commit-push.mdc). |

**Build (from repo root):** `pnpm run build` (Chrome MV3), `pnpm run build:firefox`, `pnpm run dev`. Extension output: `apps/extension/output/` (WXT `outDir`; visible in Finder).

For skills, MCP usage, and the full table of optional skills, see `.cursor/rules/project-conventions.mdc`.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
