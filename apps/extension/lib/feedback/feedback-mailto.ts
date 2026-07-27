import { getFeedbackMailtoTo } from "./feedback-mailto-config";
import type { TFeedbackKind } from "./feedback-message";

export const FEEDBACK_MESSAGE_MAX_CHARS = 8000;
export const FEEDBACK_USER_AGENT_MAX_CHARS = 512;

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

/** Validate feedback fields before opening mailto (size guards). */
export function validateFeedbackMailtoPayload(
  payload: Pick<IFeedbackEmailPayload, "message" | "userAgent">,
): { ok: true; message: string; userAgent: string } | { ok: false; error: string } {
  const message = payload.message.trim();
  if (message.length === 0) {
    return { ok: false, error: "Enter a message before opening your email app." };
  }
  if (message.length > FEEDBACK_MESSAGE_MAX_CHARS) {
    return {
      ok: false,
      error: `Message is too long (max ${FEEDBACK_MESSAGE_MAX_CHARS} characters)`,
    };
  }
  const userAgent = payload.userAgent.trim();
  if (userAgent.length === 0) {
    return { ok: false, error: "Missing browser info" };
  }
  if (userAgent.length > FEEDBACK_USER_AGENT_MAX_CHARS) {
    return { ok: false, error: "Browser info is too long" };
  }
  return { ok: true, message, userAgent };
}

export function buildFeedbackMailtoUrl(
  payload: IFeedbackEmailPayload,
  to = getFeedbackMailtoTo(),
): string {
  // encodeURIComponent uses %20 for spaces; URLSearchParams uses + (form-urlencoded),
  // which many mail clients (e.g. Mail for Windows) show literally in subject/body.
  const subject = encodeURIComponent(buildFeedbackEmailSubject(payload));
  const body = encodeURIComponent(buildFeedbackEmailBody(payload));
  return `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}
