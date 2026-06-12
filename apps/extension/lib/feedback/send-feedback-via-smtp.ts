import {
  FEEDBACK_SMTP_DEFAULT_TO,
  getFeedbackSmtpConfig,
  type IFeedbackSmtpConfig,
} from "./feedback-smtp-config";
import type { TFeedbackKind } from "./feedback-message";

const ELASTIC_EMAIL_SEND_URL = "https://smtp.elasticemail.com/v4/emails";

export interface IFeedbackEmailPayload {
  kind: TFeedbackKind;
  message: string;
  replyEmail?: string;
  extensionVersion: string;
  userAgent: string;
}

function kindLabel(kind: TFeedbackKind): string {
  return kind === "featureRequest" ? "Feature request" : "Feedback";
}

export function buildFeedbackEmailSubject(payload: IFeedbackEmailPayload): string {
  return `[Tabocalypse ${payload.extensionVersion}] ${kindLabel(payload.kind)}`;
}

export function buildFeedbackEmailBody(payload: IFeedbackEmailPayload): string {
  const lines = [
    `Type: ${kindLabel(payload.kind)}`,
    `Extension version: ${payload.extensionVersion}`,
    `User agent: ${payload.userAgent}`,
  ];
  if (payload.replyEmail?.trim()) {
    lines.push(`Reply-to: ${payload.replyEmail.trim()}`);
  }
  lines.push("", payload.message.trim());
  return lines.join("\n");
}

export function buildFeedbackMailtoUrl(
  payload: IFeedbackEmailPayload,
  to = FEEDBACK_SMTP_DEFAULT_TO,
): string {
  // encodeURIComponent uses %20 for spaces; URLSearchParams uses + (form-urlencoded),
  // which many mail clients (e.g. Mail for Windows) show literally in subject/body.
  const subject = encodeURIComponent(buildFeedbackEmailSubject(payload));
  const body = encodeURIComponent(buildFeedbackEmailBody(payload));
  return `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

/** SMTP.js secure-token payload shape for Elastic Email v4 relay. */
export function buildElasticEmailRequestBody(
  config: IFeedbackSmtpConfig,
  payload: IFeedbackEmailPayload,
): Record<string, string> {
  const body: Record<string, string> = {
    apikey: config.secureToken,
    subject: buildFeedbackEmailSubject(payload),
    from: config.from,
    to: config.to,
    body: buildFeedbackEmailBody(payload),
  };
  const reply = payload.replyEmail?.trim();
  if (reply) {
    body.ReplyTo = reply;
  }
  return body;
}

export async function sendFeedbackViaSmtp(payload: IFeedbackEmailPayload): Promise<void> {
  const config = getFeedbackSmtpConfig();
  if (!config) {
    throw new Error(
      "Feedback email is not configured for this build. Use your email app or set SMTP credentials in the maintainer .env.",
    );
  }

  const requestBody = buildElasticEmailRequestBody(config, payload);
  const res = await fetch(ELASTIC_EMAIL_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(requestBody),
    credentials: "omit",
    cache: "no-store",
  });

  const responseText = (await res.text()).trim();
  if (!res.ok) {
    throw new Error(responseText || `Email relay HTTP ${res.status}`);
  }
  if (responseText !== "OK" && !responseText.toLowerCase().includes("success")) {
    throw new Error(responseText || "Email relay rejected the message");
  }
}
