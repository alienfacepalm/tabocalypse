import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import { privilegedFetchTextInBackground } from "./privileged-extension-fetch-handler";
import { buildSearchSuggestionsUrl, parseSearchSuggestionsFromText } from "./search-suggestion-url";

describe("search suggestions (live network)", () => {
  it("loads DuckDuckGo suggestions through privileged background text fetch", async () => {
    const url = buildSearchSuggestionsUrl("ddg", "crimson desert");
    const result = await privilegedFetchTextInBackground(url, {
      Accept: "application/json, text/javascript, */*; q=0.1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const suggestions = parseSearchSuggestionsFromText(result.text);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.toLowerCase()).toContain("crimson desert");
  }, 20_000);

  it("loads Google suggestions through privileged background text fetch", async () => {
    const url = buildSearchSuggestionsUrl("google", "crimson desert");
    const result = await privilegedFetchTextInBackground(url, {
      Accept: "application/json, text/javascript, */*; q=0.1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const suggestions = parseSearchSuggestionsFromText(result.text);
    expect(suggestions.length).toBeGreaterThan(0);
  }, 20_000);

  it("loads Bing suggestions through privileged background text fetch", async () => {
    const url = buildSearchSuggestionsUrl("bing", "crimson desert");
    const result = await privilegedFetchTextInBackground(url, {
      Accept: "application/json, text/javascript, */*; q=0.1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const suggestions = parseSearchSuggestionsFromText(result.text);
    expect(suggestions.length).toBeGreaterThan(0);
  }, 20_000);
});
