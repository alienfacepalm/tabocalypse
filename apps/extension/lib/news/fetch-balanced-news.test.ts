import { describe, expect, it } from "vitest";
import { buildFqnArticlesUrl, buildFqnFetchHeaders } from "./balanced-news-fqn-url";

describe("buildFqnArticlesUrl", () => {
  it("builds articles URL with country, category, and scaled limit", () => {
    const url = buildFqnArticlesUrl({ country: "US", category: "politics", limit: 5 });
    expect(url).toContain("https://freequicknews.com/api/v1/articles?");
    expect(url).toContain("country=US");
    expect(url).toContain("category=politics");
    expect(url).toContain("limit=20");
  });
});

describe("buildFqnFetchHeaders", () => {
  it("omits header when API key is empty", () => {
    expect(buildFqnFetchHeaders("")).toBeUndefined();
    expect(buildFqnFetchHeaders("   ")).toBeUndefined();
  });

  it("sends X-API-Key when provided", () => {
    expect(buildFqnFetchHeaders("fqn_test")).toEqual({ "X-API-Key": "fqn_test" });
  });
});
