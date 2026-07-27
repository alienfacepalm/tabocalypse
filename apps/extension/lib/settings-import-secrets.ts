import type { ISettings } from "./settings";
import { SETTINGS_EXPORT_REDACTED_KEYS } from "./settings-export";

/**
 * Keep an existing secret / identifier when the imported JSON has an empty/missing
 * value (redacted exports use `""` and must not wipe values on re-import).
 */
export function mergeImportedSecretKey(imported: unknown, current: string): string {
  if (typeof imported === "string" && imported.trim().length > 0) return imported;
  return current;
}

/** Apply merge for all export-redacted credential fields onto a settings object. */
export function applyImportedSecretKeys(
  target: ISettings,
  imported: Partial<ISettings>,
  current: ISettings,
): ISettings {
  const next = { ...target };
  for (const key of SETTINGS_EXPORT_REDACTED_KEYS) {
    next[key] = mergeImportedSecretKey(imported[key], current[key] ?? "");
  }
  return next;
}
