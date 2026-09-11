# Projocalypse in Tabocalypse

Tabocalypse embeds **[Projocalypse](https://github.com/alienfacepalm/projocalypse)** as a **git submodule** at `packages/projocalypse` (same pattern as [Talemail](https://github.com/alienfacepalm/talemail)).

## How sync works

| Layer             | What                                                                        | In git?          |
| ----------------- | --------------------------------------------------------------------------- | ---------------- |
| **Plan (master)** | `doc/PLAN/ROADMAP-PM-BOARD.md` — `- [ ] pm:PM-T###` checkboxes              | Yes              |
| **CLI bridge**    | `.projocalypse/pending/tabocalypse-roadmap.json` — tasks for browser import | **Yes — commit** |
| **Live board**    | IndexedDB when you run `pnpm pm:board`                                      | No (per browser) |

**Flow:** edit plan checkboxes → `pnpm pm:sync` → commit pending JSON → run `pnpm pm:board` → UI imports pending batch.

Candidate options are drafted in [ROADMAP.md](./ROADMAP.md); approved items land in `ROADMAP-PM-BOARD.md` with stable `pm:` ids.

---

## Bootstrap (first time or fresh clone)

```bash
pnpm pm:setup
pnpm pm:board    # http://127.0.0.1:5173
```

Or manually:

```bash
git clone --recurse-submodules https://github.com/alienfacepalm/tabocalypse.git
# or, if already cloned:
git submodule update --init --recursive packages/projocalypse

pnpm install
pnpm --filter projocalypse build:cli
pnpm pm:sync
pnpm pm:board
```

Registry and package key are **already committed** — you do **not** need `pnpm pm:init` on Tabocalypse.

---

## Host implementation

| Script / path                               | Role                                                           |
| ------------------------------------------- | -------------------------------------------------------------- |
| `scripts/pm-setup.mjs`                      | `pnpm pm:setup` — bootstrap entrypoint                         |
| `scripts/pm-roadmap-bridge.mjs`             | `pnpm pm:sync` — parse plan → pending JSON                     |
| `scripts/lib/pm-roadmap-bridge.mjs`         | Bridge logic                                                   |
| `scripts/lib/projocalypse-bridge-serve.mjs` | Path security for `/.projocalypse/` static JSON                |
| `scripts/projocalypse-host-vite.mjs`        | Vite config: Projocalypse UI + JSON bridge middleware          |
| `scripts/projocalypse-board-dev.mjs`        | `pnpm pm:board` — starts host Vite on port 5173                |
| `.projocalypse/workspace.json`              | Package registry (`tabocalypse-roadmap`, plan globs, sections) |

Root **`pm:sync`** runs the Tabocalypse roadmap bridge. Root **`pm:gap`** / **`pm:status`** call upstream Projocalypse CLI. The `pm:roadmap:*` aliases (`plan`, `bridge`, `gap`, `sync`, `status`) and `pm:init` scope the same CLI commands to the `tabocalypse-roadmap` package; `pm:setup` also runs `pm:doctor` at the end.

---

## Daily commands

| Command                 | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm pm:board`         | Local UI + serve `/.projocalypse/` JSON bridge (port **5173**) |
| `pnpm pm:sync`          | Regenerate pending JSON from plan markdown                     |
| `pnpm pm:stale`         | Exit 1 if pending JSON is behind plan                          |
| `pnpm pm:setup`         | Re-run bootstrap after submodule bump or broken checkout       |
| `pnpm pm:doctor`        | Verify dirs and root scripts                                   |
| `pnpm pm:gap`           | Gap analysis (plan vs board snapshot)                          |
| `pnpm projocalypse:dev` | Standalone Projocalypse UI (no Tabocalypse JSON bridge)        |

---

## Roadmap columns (1 week per sprint)

| Column                             | Theme                                             |
| ---------------------------------- | ------------------------------------------------- |
| `W1 · Ship blockers`               | Gecko ID, privacy URL, screenshots, Safari smoke  |
| `W2 · Chrome launch`               | Release CI, listing copy, Chrome Web Store        |
| `W3 · Multi-store rollout`         | Edge, Firefox AMO, Safari App Store               |
| `W4 · New tab essentials`          | Quick links, Speed test default, error deep links |
| `W5 · News & productivity`         | Balanced news, calendar, RSS, onboarding          |
| `W6 · AI & HUD layout`             | AI chat polish, weather streak, HUD presets       |
| `W7 · Settings & data trust`       | Backup/restore, sync conflicts, pack import       |
| `W8 · Plugins & packs`             | Marketplace index, pack CLI, humor packs          |
| `W9 · Accessibility & performance` | Keyboard, reduced motion, contrast, perf          |
| `W10 · Stretch & backlog`          | iframe widget, i18n, P2P, stretch ideas           |

Use these exact strings in `pm:section=` comments.

---

## Agents

- **`tabocalypse-pm-board`** skill — sync loop after plan edits
- **`projocalypse-plan-sync`** — gap codes; not installed in this repo's `.cursor/` by default, copy it from `packages/projocalypse/templates/cursor/projocalypse-plan-sync.mdc` if you want it

Upstream: [packages/projocalypse/doc/MONOREPO.md](../../packages/projocalypse/doc/MONOREPO.md)
