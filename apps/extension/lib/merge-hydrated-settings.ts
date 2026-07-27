import {
  coerceNotes,
  mergeNotePanelsForStorageReload,
  mergeNotesPreferNewerBaseline,
  type ISettings,
} from "./settings";

/**
 * Merge a disk reload with in-memory settings. Notes use epoch-aware merge;
 * when `preserveBaselinePrefs` is true (local persist in flight), keep non-note
 * preference fields from the baseline so storage.onChanged cannot clobber edits.
 */
export function mergeHydratedSettingsWithBaseline(
  baseline: ISettings,
  disk: ISettings,
  options: { preserveMyLinesDraft: boolean; preserveBaselinePrefs: boolean },
): ISettings {
  const mergedNotes = coerceNotes(mergeNotesPreferNewerBaseline(baseline.notes, disk.notes));
  const validNoteIds = new Set(mergedNotes.map((n) => n.id));
  const bEpoch = baseline.notePanelsEpoch ?? 0;
  const dEpoch = disk.notePanelsEpoch ?? 0;
  const notePanels = mergeNotePanelsForStorageReload(
    baseline.notePanels,
    disk.notePanels,
    bEpoch,
    dEpoch,
    validNoteIds,
  );
  const notePanelsEpoch = Math.max(bEpoch, dEpoch);

  if (options.preserveBaselinePrefs) {
    return {
      ...baseline,
      notes: mergedNotes,
      notePanels,
      notePanelsEpoch,
      ...(options.preserveMyLinesDraft ? {} : { myLines: disk.myLines }),
    };
  }

  return {
    ...disk,
    notes: mergedNotes,
    notePanels,
    notePanelsEpoch,
    ...(options.preserveMyLinesDraft ? { myLines: baseline.myLines } : {}),
  };
}
