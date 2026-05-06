# Changelog

All notable user-facing and shipped behavior changes for Tabocalypse are summarized here. This file complements Git history: it is **curated**, not a duplicate of `git log`. Append entries when merging meaningful fixes or features (skip typo-only or purely internal refactors unless they affect shipped artifacts).

Extension versioning follows **`apps/extension/package.json`** (`version` field). Use **`[Unreleased]`** for changes landed on the default branch that are not yet tied to a published version bump; roll entries into a dated, versioned section when you cut a release or bump the extension package version.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Classic jargon** humor voice and a built-in glossary pack (**Unsuck It Classics**), embedded via the maintainer scraper workflow.

### Changed

- Settings: optional permissions, weather, alarms, and BYO AI are grouped in accordions; import, debug, and data sections are folded similarly; the overlay is treated as a **dialog** (not “modal”) in naming.
- Settings: **Chaos** preset is the default with **Gen-Z** humor voice; preset buttons show a clear active state; first-run settings intro can auto-open.
- Settings: removed the in-page **Feedback and support** block (support remains configurable via environment / link-out patterns documented in the root README).
- Extension reliability: alarm and link-related text is coerced before React render; alarm reminder storage is normalized for safe display.
- Notes: detached panels avoid a phantom scrollbar and hug content height where intended.
- Tab guilt panel polls for updated tab counts.

### Fixed

- Link HUD widgets (**Top Sites** and **Bookmarks**) refetch when optional host permissions change, so granting access no longer leaves stale error placeholders until a full new-tab reload.
- Restored regressed defaults for **background rotate**, **HUD layout chaotic**, Chaotic labeling, and balanced default HUD widget toggles; **background rotate** defaults to on when settings are absent or invalid.

## [0.1.34] - 2026-05-05

Initial changelog publication for this version line. Entries under **[Unreleased]** summarize substantive changes merged through this date alongside extension package **0.1.34**; future edits may move bullets into dated sections when the extension version is bumped.
