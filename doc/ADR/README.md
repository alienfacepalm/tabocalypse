# Architecture decision records

Short, dated records of the decisions that shape Tabocalypse. Each file states the **context**, the **decision**, and its **consequences** so a new contributor (or agent) can see _why_ the code and rules look the way they do, not just _what_ they say.

Most records were backfilled on 2026-09-11 from the Cursor rules under `.cursor/rules/`, the plans under `doc/PLAN/`, `DESIGN.md`, and git history; the **Date** in each record is when the decision first landed in the repo, not when the record was written.

## Format

One decision per file, `ADR-NNNN-SHORT-TITLE.md` (uppercase, see [`documentation-layout.mdc`](../../.cursor/rules/documentation-layout.mdc)). Sections: **Status**, **Context**, **Decision**, **Consequences**, **References**. Amend a record by adding an _Amendments_ list rather than rewriting history; supersede it by adding a new record and linking both ways.

Status icons: ✅ Accepted · 🧪 Proposed · ♻️ Superseded · ❌ Rejected

## Index

| ADR                                                                | Decision                                                                                  | Status | Date       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------ | ---------- |
| [ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md)                       | Local-first: no publisher backend, no telemetry, zero recurring publisher cost            | ✅     | 2026-05-03 |
| [ADR-0002](ADR-0002-DECLARATIVE-PLUGINS-ONLY.md)                   | Plugins and packs are declarative JSON; no user JavaScript ever runs                      | ✅     | 2026-05-03 |
| [ADR-0003](ADR-0003-BRING-YOUR-OWN-AI-KEYS.md)                     | AI features use only user-supplied keys and base URLs                                     | ✅     | 2026-05-03 |
| [ADR-0004](ADR-0004-WXT-REACT-CROSS-BROWSER-TARGETS.md)            | WXT + React; one Chromium MV3 build for Chrome and Edge, Safari MV3, Firefox MV2          | ✅     | 2026-05-05 |
| [ADR-0005](ADR-0005-PNPM-ONLY-MONOREPO.md)                         | pnpm-only monorepo with strict package-manager enforcement                                | ✅     | 2026-05-03 |
| [ADR-0006](ADR-0006-TAILWIND-ONLY-EXTENSION-UI.md)                 | Tailwind is the only styling system for extension UI, via one entry stylesheet            | ✅     | 2026-05-04 |
| [ADR-0007](ADR-0007-DESIGN-MD-SOURCE-OF-TRUTH.md)                  | `DESIGN.md` (glitch-core) is the design source of truth; sharp by default, shapes opt-in  | ✅     | 2026-05-04 |
| [ADR-0008](ADR-0008-SETTINGS-PERSISTENCE-SYNC-AND-LOCAL.md)        | Settings split into a synced slice and a local slice, mirrored and merged by save time    | ✅     | 2026-05-04 |
| [ADR-0009](ADR-0009-PRIVILEGED-FETCH-HOST-ALLOWLIST.md)            | Network calls from widgets go through the background worker against a host allowlist      | ✅     | 2026-05-04 |
| [ADR-0010](ADR-0010-SHARED-HUD-LOCATION-PER-MONITOR-LAYOUT.md)     | One shared HUD location for geo panels; layout and camera are per monitor and local       | ✅     | 2026-06-15 |
| [ADR-0011](ADR-0011-FEEDBACK-VIA-MAILTO-ONLY.md)                   | Feedback opens the user's mail app; builds carry no SMTP credentials                      | ✅     | 2026-07-27 |
| [ADR-0012](ADR-0012-CURATED-CHANGELOG-AND-DOC-LAYOUT.md)           | Curated major/minor changelog embedded in Settings; docs live in `doc/` with UPPERCASE    | ✅     | 2026-05-05 |
| [ADR-0013](ADR-0013-PROJOCALYPSE-PM-BOARD-SUBMODULE.md)            | Roadmap is a checkbox plan synced to the Projocalypse board (git submodule)               | ✅     | 2026-06-17 |
| [ADR-0014](ADR-0014-RELEASE-PACKAGING-VIA-GITHUB-RELEASES.md)      | Store zips are built by CI when a GitHub Release is published; tag must match the version | ✅     | 2026-06-02 |
| [ADR-0015](ADR-0015-LICENSING-AGPL-EXTENSION-MIT-SDK.md)           | Extension is AGPL-3.0; plugin SDK is MIT                                                  | ✅     | 2026-09-11 |
| [ADR-0016](ADR-0016-MONETIZATION-ONE-OFF-LINK-OUT-NO-ADS.md)       | One-off purchases and donations only; link-out checkout; offline verification; no ads     | ✅     | 2026-09-11 |
| [ADR-0017](ADR-0017-THEME-SUITES-AND-BRAND-KITS-AS-SIGNED-JSON.md) | Theme suites and brand kits are signed JSON theme packs on a free theme engine            | 🧪     | 2026-09-11 |
| [ADR-0018](ADR-0018-STATIC-MARKETING-SITE-ON-GITHUB-PAGES.md)      | Marketing homepage is a static, buildless page deployed to GitHub Pages                   | ✅     | 2026-09-07 |
| [ADR-0019](ADR-0019-DOC-SCREENSHOTS-VIA-PLAYWRIGHT-SCRIPT.md)      | Documentation screenshots are captured by a checked-in Playwright script                  | ✅     | 2026-09-11 |

## Adding a record

1. Copy the section layout from any record; number it after the last entry.
2. Link it here and, when it changes a shipped behaviour, add a line to [`doc/CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]**.
3. If the decision becomes a rule agents must follow, mirror it in `.cursor/rules/` and `AGENTS.md` (see [`doc/AGENT-INSTRUCTIONS.md`](../AGENT-INSTRUCTIONS.md)).
