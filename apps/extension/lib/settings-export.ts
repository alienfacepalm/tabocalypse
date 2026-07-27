import type { ISettings } from "./settings";

/** Keys that must not appear in a default settings backup file. */
export const SETTINGS_EXPORT_SECRET_KEYS = [
  "openaiApiKey",
  "geminiApiKey",
  "balancedNewsApiKey",
  "steamWebApiKey",
] as const;

export type TSettingsExportSecretKey = (typeof SETTINGS_EXPORT_SECRET_KEYS)[number];

/**
 * Clone settings for JSON export. By default API keys are cleared so backup files
 * are safe to share; pass `includeSecrets: true` only when the user explicitly opts in.
 */
export function settingsForJsonExport(
  settings: ISettings,
  options?: { includeSecrets?: boolean },
): ISettings {
  if (options?.includeSecrets) {
    return { ...settings };
  }
  const next: ISettings = { ...settings };
  for (const key of SETTINGS_EXPORT_SECRET_KEYS) {
    next[key] = "";
  }
  return next;
}

export function exportSettingsJsonText(
  settings: ISettings,
  options?: { includeSecrets?: boolean },
): string {
  return JSON.stringify(settingsForJsonExport(settings, options), null, 2);
}
