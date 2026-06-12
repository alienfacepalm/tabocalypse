/** Default maintainer inbox for in-extension feedback (override via build-time env). */
export const FEEDBACK_SMTP_DEFAULT_TO = "jagon@alienfacepalm";

export interface IFeedbackSmtpConfig {
  secureToken: string;
  from: string;
  to: string;
}

function readEnv(key: string): string {
  return String(
    (import.meta as ImportMeta & { env: Record<string, string> }).env[key] ?? "",
  ).trim();
}

/** Build-time SMTP.js / Elastic Email secure token + verified sender (see `.env.example`). */
export function getFeedbackSmtpConfig(): IFeedbackSmtpConfig | null {
  const secureToken = readEnv("WXT_TABOCALYPSE_FEEDBACK_SMTP_SECURE_TOKEN");
  const from = readEnv("WXT_TABOCALYPSE_FEEDBACK_FROM");
  const to = readEnv("WXT_TABOCALYPSE_FEEDBACK_TO") || FEEDBACK_SMTP_DEFAULT_TO;
  if (!secureToken || !from) {
    return null;
  }
  return { secureToken, from, to };
}

export function isFeedbackSmtpConfigured(): boolean {
  return getFeedbackSmtpConfig() !== null;
}
