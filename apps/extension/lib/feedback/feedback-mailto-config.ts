/** Default maintainer inbox for in-extension feedback mailto (override via build-time env). */
export const FEEDBACK_MAILTO_DEFAULT_TO = "jagon@alienfacepalm";

function readEnv(key: string): string {
  return String(
    (import.meta as ImportMeta & { env: Record<string, string> }).env[key] ?? "",
  ).trim();
}

/** Mailto recipient only — no publisher SMTP tokens in the client. */
export function getFeedbackMailtoTo(): string {
  return readEnv("WXT_TABOCALYPSE_FEEDBACK_TO") || FEEDBACK_MAILTO_DEFAULT_TO;
}
