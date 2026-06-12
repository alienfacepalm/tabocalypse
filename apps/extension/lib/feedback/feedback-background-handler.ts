import {
  TABOCALYPSE_FEEDBACK_SEND,
  type TTabocalypseFeedbackSendRequest,
  type TTabocalypseFeedbackSendResponse,
} from "./feedback-message";
import { sendFeedbackViaSmtp, type IFeedbackEmailPayload } from "./send-feedback-via-smtp";

function isFeedbackKind(value: unknown): value is IFeedbackEmailPayload["kind"] {
  return value === "feedback" || value === "featureRequest";
}

export async function handleTabocalypseFeedbackSendRequest(
  message: unknown,
): Promise<TTabocalypseFeedbackSendResponse> {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return { ok: false, error: "Invalid feedback request" };
  }
  const m = message as Partial<TTabocalypseFeedbackSendRequest>;
  if (m.type !== TABOCALYPSE_FEEDBACK_SEND) {
    return { ok: false, error: "Invalid feedback request" };
  }
  if (!isFeedbackKind(m.kind)) {
    return { ok: false, error: "Choose feedback or a feature request" };
  }
  if (typeof m.message !== "string" || m.message.trim().length === 0) {
    return { ok: false, error: "Enter a message before sending" };
  }
  if (m.message.trim().length > 8000) {
    return { ok: false, error: "Message is too long (max 8000 characters)" };
  }
  if (typeof m.extensionVersion !== "string" || m.extensionVersion.trim().length === 0) {
    return { ok: false, error: "Missing extension version" };
  }
  if (typeof m.userAgent !== "string" || m.userAgent.trim().length === 0) {
    return { ok: false, error: "Missing browser info" };
  }
  const replyEmail =
    typeof m.replyEmail === "string" && m.replyEmail.trim().length > 0
      ? m.replyEmail.trim()
      : undefined;
  if (replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail)) {
    return { ok: false, error: "Enter a valid reply email or leave it blank" };
  }

  try {
    await sendFeedbackViaSmtp({
      kind: m.kind,
      message: m.message.trim(),
      replyEmail,
      extensionVersion: m.extensionVersion.trim(),
      userAgent: m.userAgent.trim(),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
