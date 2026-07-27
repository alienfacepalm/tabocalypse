/**
 * Shared secure practices for Settings credential / account-id inputs.
 *
 * - Prefer `type="text"` + CSS disc mask over `type="password"` (managers often clear paste).
 * - Suppress autofill / password-manager heuristics via stable attrs + unique `name`.
 * - Keep secrets and account IDs in `storage.local` (callers); redact from default JSON export.
 */

/** Autofill / password-manager ignore attrs for credential-like Settings inputs. */
export const SETTINGS_CREDENTIAL_INPUT_ATTRS = {
  type: "text" as const,
  autoComplete: "off" as const,
  autoCapitalize: "off" as const,
  autoCorrect: "off" as const,
  spellCheck: false as const,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
};

/** CSS mask used instead of `type="password"` so paste stays reliable. */
export const SETTINGS_SECRET_MASK_STYLE = {
  WebkitTextSecurity: "disc",
} as const;

export type TSettingsCredentialKind = "secret" | "identifier";

/**
 * Trim clipboard paste for credential fields (BOM-safe).
 */
export function normalizeCredentialPaste(
  _kind: TSettingsCredentialKind,
  clipboardText: string,
): string {
  return clipboardText.replace(/^\uFEFF/, "").trim();
}
