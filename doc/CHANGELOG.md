# Changelog

All notable user-facing and shipped behavior changes for Tabocalypse are summarized here. This file complements Git history: it is **curated**, not a duplicate of `git log`. Append entries when merging meaningful fixes or features (skip typo-only or purely internal refactors unless they affect shipped artifacts).

Extension versioning follows **`apps/extension/package.json`** (`version` field).

This changelog intentionally tracks **major/minor lines only** (for example `1.2`, `0.3`), not patch versions. Git history and tags cover patch-level detail; this file is meant to stay readable and highlight what a user will notice.

Use **`[Unreleased]`** for changes landed on the default branch that are not yet tied to a published **major/minor** bump; roll entries into a dated, versioned section when you bump the extension to a new **major or minor** version (for example `0.1.x → 0.2.0` or `1.x → 2.0`).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Balanced News** HUD panel: topic list from FreeQuickNews with category filters, left/center/right perspective icons, and assignment tooltips on article rows.
- **Balanced News** topic hover previews: article thumbnail, synopsis, and a frosted-glass popover when you hover or focus a topic in the list.
- **Clock** widget: schedule Tabocalypse alarms with labels and background notifications when a reminder fires.
- **Weather** widget: ten-day forecast panel with shared Open-Meteo parsing and day labels.
- **Classic jargon** humor voice and a built-in glossary pack (**Unsuck It Classics**), embedded via the maintainer scraper workflow.

### Changed

- Settings: optional permissions, weather, alarms, and BYO AI are grouped in accordions; import, debug, and data sections are folded similarly; the overlay is treated as a **dialog** (not “modal”) in naming.
- Settings: **Chaos** preset is the default with **Gen-Z** humor voice; preset buttons show a clear active state; first-run settings intro can auto-open.
- Settings: removed the in-page **Feedback and support** block (support remains configurable via environment / link-out patterns documented in the root README).
- Extension reliability: alarm and link-related text is coerced before React render; alarm reminder storage is normalized for safe display.
- Notes: detached panels avoid a phantom scrollbar and hug content height where intended; sticky note layout is stored **per monitor** while the master notes list still syncs.
- HUD auto-layout: improved placement for denser widget grids on the new tab canvas.
- HUD panels and corner resize grips stay above the fixed footer during drag, grid snap, and column reflow.
- **Todos** widget: denser list rows with a smaller remove control so more tasks fit in the panel.
- Tab guilt panel polls for updated tab counts.

### Fixed

- **Clock** alarms: test notifications try the page and background paths, with mocked regression tests for MV3 promise API, icon fallbacks, and timeouts; packaged `notification-icon.png` ships in the extension bundle for reliable Windows toasts.
- Link HUD widgets (**Top Sites** and **Bookmarks**) refetch when optional host permissions change, so granting access no longer leaves stale error placeholders until a full new-tab reload.
- Restored regressed defaults for **background rotate**, **HUD layout chaotic**, Chaotic labeling, and balanced default HUD widget toggles; **background rotate** defaults to on when settings are absent or invalid.
- Humor banner toggle is honored again; reload hint copy names the correct browser-specific steps.
- Weather **2 Lakes** accordion stays collapsed on first load.
- **Rearrange** (F10 / header dashboard icon) stacks panels into columns inferred from where you placed them, grows each column to the fold, and no longer leaves large empty gaps under short panels.
- Enabling a HUD widget reflows the column stack when auto-reposition is on, and column layouts now patch every panel together so new widgets do not overlap neighbors.
- HUD panel resize grips and the snap grid stay above the fixed page footer instead of drawing underneath it.

## [0.1] - 2026-05-05

Initial changelog publication for the **0.1.x** minor line. Entries under **[Unreleased]** summarize substantive changes merged after this date and will be rolled into a new **major/minor** section (for example `0.2`) when that bump happens.
