import { describe, expect, it } from "vitest";
import {
  byoAiHostOriginPattern,
  byoAiHostPermissionHostname,
  validateByoAiBaseUrlForPermission,
} from "./byo-ai-base-url";

describe("byoAiHostOriginPattern", () => {
  it("builds an origin wildcard for HTTPS and HTTP bases", () => {
    expect(byoAiHostOriginPattern("https://api.openai.com/v1")).toBe("https://api.openai.com/*");
    expect(byoAiHostOriginPattern("http://127.0.0.1:11434/v1")).toBe("http://127.0.0.1:11434/*");
  });

  it("rejects invalid schemes", () => {
    expect(byoAiHostOriginPattern("ftp://example.com/v1")).toBeNull();
    expect(byoAiHostOriginPattern("not-a-url")).toBeNull();
  });
});

describe("byoAiHostPermissionHostname", () => {
  it("returns the hostname for display", () => {
    expect(byoAiHostPermissionHostname("https://api.example.com/v1")).toBe("api.example.com");
  });
});

describe("validateByoAiBaseUrlForPermission", () => {
  it("allows HTTPS and localhost HTTP bases", () => {
    expect(validateByoAiBaseUrlForPermission("https://api.openai.com/v1")).toEqual({ ok: true });
    expect(validateByoAiBaseUrlForPermission("http://127.0.0.1:11434/v1")).toEqual({ ok: true });
    expect(validateByoAiBaseUrlForPermission("http://localhost:11434/v1")).toEqual({ ok: true });
  });

  it("rejects remote HTTP before host permission is requested", () => {
    expect(validateByoAiBaseUrlForPermission("http://api.example.com/v1")).toEqual({
      ok: false,
      error: "Use HTTPS for remote API base URLs (http:// is only allowed on localhost).",
    });
  });

  it("rejects invalid schemes and malformed URLs", () => {
    expect(validateByoAiBaseUrlForPermission("ftp://example.com/v1").ok).toBe(false);
    expect(validateByoAiBaseUrlForPermission("not-a-url").ok).toBe(false);
  });
});
