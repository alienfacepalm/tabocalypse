import { describe, expect, it } from "vitest";
import {
  PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND,
  PRIV_FETCH_BACKGROUND_NO_RESPONSE,
  PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE,
} from "./privileged-fetch-error-identifiers";
import { resolvePrivilegedFetchUserMessage } from "./privileged-fetch-user-message";

describe("resolvePrivilegedFetchUserMessage", () => {
  it("hides allowlist errors and shows reload guidance", () => {
    const resolved = resolvePrivilegedFetchUserMessage(PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND);
    expect(resolved.userMessage).toContain("reload");
    expect(resolved.showReloadHint).toBe(true);
    expect(resolved.showTechnicalDetail).toBe(false);
    expect(resolved.technicalDetail).toBeNull();
  });

  it("hides background-unavailable errors and shows reload guidance", () => {
    const resolved = resolvePrivilegedFetchUserMessage(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE);
    expect(resolved.userMessage).toContain("background worker");
    expect(resolved.showReloadHint).toBe(true);
    expect(resolved.showTechnicalDetail).toBe(false);
  });

  it("keeps user-actionable provider messages visible", () => {
    const message = "Invalid API key. Check Settings > BYO AI.";
    const resolved = resolvePrivilegedFetchUserMessage(message);
    expect(resolved.userMessage).toBe(message);
    expect(resolved.showReloadHint).toBe(false);
    expect(resolved.showTechnicalDetail).toBe(false);
  });

  it("hides opaque internal errors but can expose technical detail separately", () => {
    const resolved = resolvePrivilegedFetchUserMessage(PRIV_FETCH_BACKGROUND_NO_RESPONSE);
    expect(resolved.userMessage).toContain("background worker");
    expect(resolved.showReloadHint).toBe(true);
  });
});
