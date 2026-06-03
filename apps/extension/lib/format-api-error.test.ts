import { describe, expect, it } from "vitest";
import {
  extractApiErrorMessage,
  formatHttpApiError,
  formatNetworkError,
  isRateOrQuotaLimitError,
  RATE_OR_QUOTA_LIMIT_MESSAGE,
} from "./format-api-error";

describe("extractApiErrorMessage", () => {
  it("reads OpenAI-style error.message", () => {
    expect(extractApiErrorMessage(JSON.stringify({ error: { message: "Invalid API key" } }))).toBe(
      "Invalid API key",
    );
  });

  it("reads Gemini-style array payloads", () => {
    expect(
      extractApiErrorMessage(
        JSON.stringify([{ error: { code: 429, message: "You exceeded your current quota" } }]),
      ),
    ).toBe("You exceeded your current quota");
  });
});

describe("formatHttpApiError", () => {
  it("maps 429 to a quota message without raw JSON", () => {
    const msg = formatHttpApiError(
      429,
      JSON.stringify([{ error: { message: "You exceeded your current quota, please check" } }]),
    );
    expect(msg).toBe(RATE_OR_QUOTA_LIMIT_MESSAGE);
    expect(msg).toContain("quota");
    expect(msg).not.toContain("[{");
    expect(isRateOrQuotaLimitError(msg)).toBe(true);
    expect(isRateOrQuotaLimitError("other")).toBe(false);
  });

  it("maps 401 without leaking JSON wrappers", () => {
    const msg = formatHttpApiError(401, "Unauthorized");
    expect(msg).toContain("Authentication failed");
    expect(msg).not.toContain("[{");
  });
});

describe("formatNetworkError", () => {
  it("rewrites failed to fetch", () => {
    expect(formatNetworkError("Failed to fetch")).toContain("Network error");
  });
});
