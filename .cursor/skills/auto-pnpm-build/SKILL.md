---
name: auto-pnpm-build
description: After implementing a new feature or fix and confirming pnpm check passes, run pnpm build automatically from the repo root. Use when work is complete, checks are green, and the change could affect extension packaging or shipped behavior.
---

# Auto pnpm build (after checks)

## Instructions

When a **new feature or fix is in and complete**:

1. Run `pnpm check` from the repo root.
2. If `pnpm check` fails, fix issues and repeat until it passes.
3. Once `pnpm check` passes, run `pnpm build` from the repo root.
4. If `pnpm build` fails, fix issues and re-run `pnpm build` (and re-run `pnpm check` if the fix was non-trivial).
5. Only treat the work as done after both commands succeed (unless the user explicitly asks to skip `pnpm build`).

## Notes

- Prefer PowerShell-friendly commands (no bash heredocs).
- If the change is _clearly unrelated_ to extension packaging (rare), say why you’re skipping `pnpm build` and wait for user confirmation.

## Example

- After finishing the implementation and tests pass:
  - Run `pnpm check`
  - Then run `pnpm build`
