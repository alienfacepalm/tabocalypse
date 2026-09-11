# ADR-0002: Plugins and packs are declarative JSON; no user JavaScript

| Status | ✅ Accepted                                   |
| ------ | --------------------------------------------- |
| Date   | 2026-05-03                                    |
| Scope  | `packages/plugin-sdk`, extension import paths |

## Context

Users want to extend the new tab with their own content (humor packs, link grids, quotes). A JavaScript plugin API would be the most flexible option, but it would turn the extension into a script host: store reviewers treat remotely loaded or user-supplied code as remote code execution, and one malicious pack could read every other widget's data.

## Decision

- A plugin is a **JSON manifest** (`tabocalypse-plugin.json`, `schemaVersion: 1`) containing widgets of **allowlisted types** only (`StaticText`, `RotatingQuotes`, `LinkGrid`). A humor pack is a JSON `pack.json` (optionally inside a ZIP).
- Validation lives in the standalone package **`@tabocalypse/plugin-sdk`** (`validatePluginJsonText`) so it can be unit-tested on Node and reused by authoring tools. The extension re-validates on import and again on load, dropping malformed widgets instead of crashing.
- **No `eval`, no `new Function`, no loading `.js` from imports.** ESLint enforces `no-eval` / `no-implied-eval` / `no-new-func` repo-wide.
- Links are **HTTPS only**; strings have length caps; ids are sanitised.
- Future "premium" widget types (data cards, RSS lists) must also be declarative, with any network host approved by the user at import time.

## Consequences

- Plugin authors get a small, stable surface and a validator they can run locally; the trade-off is that a plugin cannot compute anything.
- Store submissions can state "does not execute remote code" truthfully.
- Selling plugins (see [ADR-0016](ADR-0016-MONETIZATION-ONE-OFF-LINK-OUT-NO-ADS.md)) does not change the rule; signed JSON is provenance, not a code-signing escape hatch.
- Theme packs ([ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md)) reuse the same validator and the same "values only, never code" principle.

## References

- [`doc/PLUGIN-SCHEMA.md`](../PLUGIN-SCHEMA.md)
- [`packages/plugin-sdk/src/validate.ts`](../../packages/plugin-sdk/src/validate.ts)
- [`apps/extension/lib/plugin-import.ts`](../../apps/extension/lib/plugin-import.ts)
- [`eslint.config.mjs`](../../eslint.config.mjs)
