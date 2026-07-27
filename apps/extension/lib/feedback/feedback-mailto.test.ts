import { describe, expect, it } from "vitest";
import {
  buildFeedbackEmailBody,
  buildFeedbackEmailSubject,
  buildFeedbackMailtoUrl,
  FEEDBACK_MESSAGE_MAX_CHARS,
  FEEDBACK_USER_AGENT_MAX_CHARS,
  validateFeedbackMailtoPayload,
} from "./feedback-mailto";

describe("feedback-mailto", () => {
  const payload = {
    kind: "featureRequest" as const,
    message: "Please add a widget for tea.",
    replyEmail: "user@example.com",
    extensionVersion: "0.1.97",
    userAgent: "Mozilla/5.0 Test",
  };

  it("builds a subject with version and kind", () => {
    expect(buildFeedbackEmailSubject(payload)).toBe("[Tabocalypse 0.1.97] Feature request");
  });

  it("includes reply email and message in the body", () => {
    const body = buildFeedbackEmailBody(payload);
    expect(body).toContain("Reply-to: user@example.com");
    expect(body).toContain("Please add a widget for tea.");
  });

  it("builds a mailto URL with percent-encoded spaces", () => {
    const url = buildFeedbackMailtoUrl(payload, "jagon@alienfacepalm");
    expect(url.startsWith("mailto:jagon%40alienfacepalm?")).toBe(true);
    expect(url).not.toContain("+");
    expect(url).toContain("Feature%20request");
    expect(url).toContain("Type%3A%20Feature%20request");
  });

  it("percent-encodes spaces in feedback mailto subject and body", () => {
    const url = buildFeedbackMailtoUrl(
      {
        kind: "feedback",
        message: "Hello world",
        extensionVersion: "0.1.96",
        userAgent: "Mozilla/5.0 Test",
      },
      "jagon@alienfacepalm",
    );
    expect(url).toContain("subject=%5BTabocalypse%200.1.96%5D%20Feedback");
    expect(url).toContain("Type%3A%20Feedback");
    expect(url).toContain("Extension%20version%3A%200.1.96");
    expect(url).not.toContain("+");
  });
});

describe("validateFeedbackMailtoPayload", () => {
  it("rejects empty messages", () => {
    expect(validateFeedbackMailtoPayload({ message: "   ", userAgent: "ua" })).toEqual({
      ok: false,
      error: "Enter a message before opening your email app.",
    });
  });

  it("rejects oversized messages", () => {
    const result = validateFeedbackMailtoPayload({
      message: "x".repeat(FEEDBACK_MESSAGE_MAX_CHARS + 1),
      userAgent: "ua",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("too long");
  });

  it("rejects oversized browser info", () => {
    expect(
      validateFeedbackMailtoPayload({
        message: "hello",
        userAgent: "x".repeat(FEEDBACK_USER_AGENT_MAX_CHARS + 1),
      }),
    ).toEqual({ ok: false, error: "Browser info is too long" });
  });

  it("rejects missing browser info", () => {
    expect(validateFeedbackMailtoPayload({ message: "hello", userAgent: "  " })).toEqual({
      ok: false,
      error: "Missing browser info",
    });
  });

  it("accepts trimmed valid payloads", () => {
    expect(validateFeedbackMailtoPayload({ message: "  hi  ", userAgent: "  ua  " })).toEqual({
      ok: true,
      message: "hi",
      userAgent: "ua",
    });
  });
});
