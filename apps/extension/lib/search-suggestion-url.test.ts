import { describe, expect, it } from "vitest";

import {
  buildSearchSuggestionsUrl,
  isSearchSuggestionResponseText,
  parseSearchSuggestionsPayload,
  tryParseSearchSuggestionsFromText,
} from "./search-suggestion-url";

describe("buildSearchSuggestionsUrl", () => {
  it("builds DuckDuckGo autocomplete URL", () => {
    expect(buildSearchSuggestionsUrl("ddg", "hello world")).toBe(
      "https://duckduckgo.com/ac/?q=hello%20world&type=list",
    );
  });

  it("builds Google suggestqueries URL", () => {
    expect(buildSearchSuggestionsUrl("google", "café")).toBe(
      "https://suggestqueries.google.com/complete/search?client=firefox&q=caf%C3%A9",
    );
  });

  it("builds Bing osjson URL", () => {
    expect(buildSearchSuggestionsUrl("bing", "100%")).toBe(
      "https://api.bing.com/osjson.aspx?query=100%25",
    );
  });
});

describe("parseSearchSuggestionsPayload", () => {
  it("extracts string suggestions from provider arrays", () => {
    expect(
      parseSearchSuggestionsPayload([
        "tab",
        ["tableau", "tabs", "tablet mode"],
        [],
        { "google:suggestsubtypes": [[512]] },
      ]),
    ).toEqual(["tableau", "tabs", "tablet mode"]);
  });

  it("parses JSON string payloads", () => {
    expect(parseSearchSuggestionsPayload('["tab",["tableau","tabs"]]')).toEqual([
      "tableau",
      "tabs",
    ]);
  });

  it("coerces array-like objects from extension messaging", () => {
    expect(
      parseSearchSuggestionsPayload({
        0: "tab",
        1: { 0: "tableau", 1: "tabs" },
      }),
    ).toEqual(["tableau", "tabs"]);
  });

  it("detects non-JSON suggestion bodies", () => {
    expect(isSearchSuggestionResponseText("<html></html>")).toBe(false);
    expect(isSearchSuggestionResponseText('["tab",["tabs"]]')).toBe(true);
    expect(tryParseSearchSuggestionsFromText("<html></html>")).toBeNull();
  });

  it("returns empty for malformed payloads", () => {
    expect(parseSearchSuggestionsPayload(null)).toEqual([]);
    expect(parseSearchSuggestionsPayload(["only query"])).toEqual([]);
    expect(parseSearchSuggestionsPayload(["q", "not an array"])).toEqual([]);
    expect(parseSearchSuggestionsPayload(["q", [1, "", "  ", "ok"]])).toEqual(["ok"]);
  });
});
