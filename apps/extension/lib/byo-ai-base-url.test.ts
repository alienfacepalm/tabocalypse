import { describe, expect, it } from "vitest";
import { byoAiHostOriginPattern, byoAiHostPermissionHostname } from "./byo-ai-base-url";

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
