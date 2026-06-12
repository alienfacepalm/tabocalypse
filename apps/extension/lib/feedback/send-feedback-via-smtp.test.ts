import { describe, expect, it } from "vitest";
import {
  buildElasticEmailRequestBody,
  buildFeedbackEmailBody,
  buildFeedbackEmailSubject,
  buildFeedbackMailtoUrl,
} from "./send-feedback-via-smtp";

describe("send-feedback-via-smtp", () => {
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

  it("builds Elastic Email JSON payload with secure token", () => {
    const body = buildElasticEmailRequestBody(
      { secureToken: "token-abc", from: "noreply@alienfacepalm", to: "jagon@alienfacepalm" },
      payload,
    );
    expect(body.apikey).toBe("token-abc");
    expect(body.to).toBe("jagon@alienfacepalm");
    expect(body.ReplyTo).toBe("user@example.com");
  });

  it("builds a mailto fallback URL with percent-encoded spaces", () => {
    const url = buildFeedbackMailtoUrl(payload);
    expect(url.startsWith("mailto:jagon%40alienfacepalm?")).toBe(true);
    expect(url).not.toContain("+");
    expect(url).toContain("Feature%20request");
    expect(url).toContain("Type%3A%20Feature%20request");
  });

  it("percent-encodes spaces in feedback mailto subject and body", () => {
    const url = buildFeedbackMailtoUrl({
      kind: "feedback",
      message: "Hello world",
      extensionVersion: "0.1.96",
      userAgent: "Mozilla/5.0 Test",
    });
    expect(url).toContain("subject=%5BTabocalypse%200.1.96%5D%20Feedback");
    expect(url).toContain("Type%3A%20Feedback");
    expect(url).toContain("Extension%20version%3A%200.1.96");
    expect(url).not.toContain("+");
  });
});

describe("feedback-background-handler", () => {
  it("rejects empty messages", async () => {
    const { handleTabocalypseFeedbackSendRequest } = await import("./feedback-background-handler");
    const result = await handleTabocalypseFeedbackSendRequest({
      type: "tabocalypse/feedbackSend",
      kind: "feedback",
      message: "   ",
      extensionVersion: "0.1.97",
      userAgent: "test",
    });
    expect(result).toEqual({ ok: false, error: "Enter a message before sending" });
  });
});
