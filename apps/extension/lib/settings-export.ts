import type { ISettings } from "./settings";

/** API keys — always local; omitted from default JSON export. */
export const SETTINGS_EXPORT_SECRET_KEYS = [
  "openaiApiKey",
  "geminiApiKey",
  "balancedNewsApiKey",
  "steamWebApiKey",
] as const;

/**
 * Account identifiers stored with credentials — omitted from default export
 * so shared backups do not leak who owns the optional Steam boards.
 */
export const SETTINGS_EXPORT_IDENTIFIER_KEYS = ["steamChartsSteamId"] as const;

/** Everything cleared from a default (shareable) settings backup. */
export const SETTINGS_EXPORT_REDACTED_KEYS = [
  ...SETTINGS_EXPORT_SECRET_KEYS,
  ...SETTINGS_EXPORT_IDENTIFIER_KEYS,
] as const;

export type TSettingsExportSecretKey = (typeof SETTINGS_EXPORT_SECRET_KEYS)[number];
export type TSettingsExportRedactedKey = (typeof SETTINGS_EXPORT_REDACTED_KEYS)[number];

/**
 * Clone settings for JSON export. By default API keys and account IDs are cleared
 * so backup files are safe to share; pass `includeSecrets: true` only when the
 * user explicitly opts in (restores both secrets and identifiers).
 */
export function settingsForJsonExport(
  settings: ISettings,
  options?: { includeSecrets?: boolean },
): ISettings {
  if (options?.includeSecrets) {
    return { ...settings };
  }
  const next: ISettings = { ...settings };
  for (const key of SETTINGS_EXPORT_REDACTED_KEYS) {
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
