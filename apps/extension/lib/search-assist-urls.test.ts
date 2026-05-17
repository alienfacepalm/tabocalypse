import { describe, expect, it } from "vitest";

import { buildSearchAssistUrl, buildWebSearchUrl } from "./search-assist-urls";

describe("buildWebSearchUrl", () => {
  it("builds DuckDuckGo search URL", () => {
    expect(buildWebSearchUrl("ddg", "hello world")).toBe("https://duckduckgo.com/?q=hello%20world");
  });

  it("builds Google search URL", () => {
    expect(buildWebSearchUrl("google", "café & co.")).toBe(
      "https://www.google.com/search?q=caf%C3%A9%20%26%20co.",
    );
  });

  it("builds Bing search URL", () => {
    expect(buildWebSearchUrl("bing", "100%")).toBe("https://www.bing.com/search?q=100%25");
  });
});

describe("buildSearchAssistUrl", () => {
  it("uses Duck.ai bang handoff on DuckDuckGo", () => {
    expect(buildSearchAssistUrl("ddg", "why is the sky blue")).toBe(
      "https://duckduckgo.com/?q=!ai%20why%20is%20the%20sky%20blue",
    );
  });

  it("uses Google Search AI mode (udm=50)", () => {
    expect(buildSearchAssistUrl("google", "quantum")).toBe(
      "https://www.google.com/search?q=quantum&udm=50",
    );
  });

  it("opens Bing Copilot Search", () => {
    expect(buildSearchAssistUrl("bing", "hello")).toBe(
      "https://www.bing.com/copilotsearch?q=hello",
    );
  });
});
