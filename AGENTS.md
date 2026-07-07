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

**Product first:** prioritize what ships to users—correct behavior, reliable storage, clear UI, and honest docs—over clever internals, novelty, or changes that mostly massage the codebase without improving the experience.

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

| Area                  | Rule                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package manager**   | **pnpm** only (`.npmrc`: `package-manager-strict=true`). This repo ships `pnpm-lock.yaml`; do not commit `package-lock.json`.                                                                                                                                                                                                                                                 |
| **UI styling**        | **Tailwind CSS only** for extension UI (utilities plus `@layer` in [`apps/extension/entrypoints/newtab/tailwind.css`](apps/extension/entrypoints/newtab/tailwind.css)). Do not add parallel global stylesheets, CSS-in-JS for layout/visuals, or a second design system — see `.cursor/rules/project-conventions.mdc`.                                                        |
| **TypeScript**        | No `any`. Interfaces **`I` + PascalCase**, type aliases **`T` + PascalCase** (ESLint + [`.cursor/rules/typescript-type-prefixes.mdc`](.cursor/rules/typescript-type-prefixes.mdc)).                                                                                                                                                                                           |
| **File names**        | **kebab-case** for source files (e.g. `app.tsx`, `user-packs.ts`). No `camelCase` / `PascalCase` filenames; see conventions for tool exceptions (`package.json`, `wxt.config.ts`, …).                                                                                                                                                                                         |
| **Product**           | No publisher backend; no publisher API keys; BYO AI only; declarative plugins only (no user JS from imports); donate/ideas are link-out only. The HUD search **assist** control opens third-party AI/search URLs in a new tab only — no publisher API keys or backend for that handoff, and no inlined answers on the new tab page.                                           |
| **Plans**             | Do not edit the Cursor plan file for Tabocalypse unless the user asks to change the plan.                                                                                                                                                                                                                                                                                     |
| **Testing**           | Maintain **automated test suites** for **critical** components and functions (data integrity, plugin validation/safety, core flows, packaging). Change critical behavior together with new or updated tests; add a minimal `pnpm` test harness if a package has none yet.                                                                                                     |
| **Prettier / ESLint** | **`pnpm format`** (or **`format:check`** in CI), **`pnpm lint`**. Config: root `prettier.config.mjs`, `eslint.config.mjs`.                                                                                                                                                                                                                                                    |
| **Verify**            | **`pnpm check`** runs format check, lint (zero warnings), tests, SDK + extension `tsc`. **Git:** `.husky/pre-commit` runs **lint-staged** on staged files. For **meaningful** changes, also run extension **`pnpm build`** when packaging is affected, then **commit** and **push** — see [`.cursor/rules/validate-commit-push.mdc`](.cursor/rules/validate-commit-push.mdc). |

**Build (from repo root):** `pnpm build` (Chrome MV3 + Safari MV3 + Firefox MV2), `pnpm build:firefox`, `pnpm build:safari`, `pnpm dev`. Extension output: `apps/extension/output/` (WXT `outDir`; visible in Finder). **Safari** App Store / local converter flow uses `safari-mv3` (or `chrome_edge-mv3`) with Apple’s tools on macOS (see [README.md](README.md) → doc links).

For skills, MCP usage, and the full table of optional skills, see `.cursor/rules/project-conventions.mdc`.

---

## 6. Multiple agents / multiple chats (avoid collisions)

If you run multiple Cursor chats/agents in parallel, avoid “diff thrash” (overwrites / oscillating edits) with this workflow:

- **Single writer**: choose one chat as the **Driver** that is allowed to edit the current working tree.
- **Advisors**: other chats should be **read-only** (analysis, search, review) and provide **small, patch-shaped** proposals for the Driver to apply.
- **Parallel coding**: if you truly need multiple writers, isolate them with **separate branches + git worktrees** (or separate clones). Do not have two writers edit the same worktree.
- **Lock**: optionally use `.cursor/LOCK.md` (gitignored) as a lightweight lock. Start from `.cursor/LOCK.template.md`.

### Ownership lanes (reduce merge conflicts)

To keep parallel work additive, assign each writer an “ownership lane” and avoid overlapping edits:

- **Lane 1 (UI)**: `apps/extension/components/**`
- **Lane 2 (logic/layout)**: `apps/extension/lib/**`
- **Lane 3 (docs)**: `doc/**`
- **Lane 4 (tooling)**: root configs (e.g. `prettier.config.mjs`, `eslint.config.mjs`)

### Advisor → Driver handoff format

When an Advisor proposes changes, send:

- **Paths**: exact file paths
- **Edits**: minimal diff/snippet (smallest change that solves the task)
- **Why**: the intent + any assumptions

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
