# ADR-0008: Settings are split into a synced slice and a local slice, mirrored and merged by save time

| Status | ✅ Accepted                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| Date   | 2026-05-04; amended 2026-07-27 (mirror merge), 2026-09-10 (per-note items, coalesced writes, single wallpaper store) |
| Scope  | `apps/extension/lib/settings.ts` and every caller                                                                    |

## Context

With no publisher backend ([ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md)) the only cross-device channel is the browser's `storage.sync`, which is small (about 8 KB per item, roughly 100 KB total on Chromium), rate-limited, and sometimes unavailable. Some data must never leave the device (API keys), some is device-specific (per-monitor panel positions, wallpapers that can be megabytes), and some is chatty (typing in a note, dragging a slider).

## Decision

1. **Two slices, one API.** `loadSettings` / `saveSettings` in `lib/settings.ts` are the only writers.
   - `tabocalypseSync` (`storage.sync`): preferences worth sharing — personality preset, theme, widget defaults, search engine, weather units, shared HUD coordinates, `hasSeenSettingsIntro`, experimental flags, and a `prefsSavedAt` timestamp.
   - `tabocalypseLocal` (`storage.local`): API keys and Steam ID, todos, wallpapers, imported packs and plugins, per-display panel positions and widget overrides, bookmark strip order.
2. **Local mirror of the sync slice** (`tabocalypseSyncMirror`). Saves always land locally; on load the cloud copy and the mirror are merged by `prefsSavedAt` (newer wins, ties keep the mirror so a local write after a failed sync is never discarded). New tabs read the mirror immediately instead of waiting for sync.
3. **Notes are one sync item each** (`tabocalypseNote:<id>`), with `tabocalypseNotes` holding only ordering and panel metadata. A note larger than the per-item cap stays on this device and the HUD names it; the rest keep syncing.
4. **Coalesced partial writes.** A write cache diffs each slice and only writes keys that changed; rapid edits are debounced (250 ms trailing) into one write, serialised, and flushed when the tab is hidden or closed. Dragging a panel no longer rewrites wallpapers.
5. **Single wallpaper store.** `userBackgroundImages[]` plus an active id; the legacy single-URL and URL-list fields are read once for migration and never written.
6. Every new tab listens to `storage.onChanged` and re-hydrates, with `mergeHydratedSettings` protecting in-flight edits.

## Consequences

- Cross-device behaviour is predictable and documented in `PRIVACY.md`; per-monitor state never syncs, by design.
- Adding a settings field means choosing a slice deliberately and updating the coercion, export redaction, and storage-change helpers; tests in `settings.test.ts` cover migrations.
- Sync quota warnings ("changing too fast") disappeared after coalescing; the trade-off is a small window in which a crash loses the last 250 ms of edits.
- Future features (license tokens, theme pointers) follow the same rule: small grants in sync, heavy assets in local.

## References

- [`.cursor/rules/settings-persistence.mdc`](../../.cursor/rules/settings-persistence.mdc)
- [`apps/extension/lib/settings.ts`](../../apps/extension/lib/settings.ts), [`merge-hydrated-settings.ts`](../../apps/extension/lib/merge-hydrated-settings.ts), [`settings-export.ts`](../../apps/extension/lib/settings-export.ts)
- `doc/CHANGELOG.md` — 1.0 "Browser sync" and [Unreleased] "Notes" / "Settings writes" entries
