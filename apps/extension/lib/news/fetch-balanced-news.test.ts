import { describe, expect, it } from "vitest";
import { buildFqnArticlesUrl, buildFqnFetchHeaders } from "./balanced-news-fqn-url";
import { normalizeFqnArticleRow } from "./normalize-fqn-article-row";

describe("buildFqnArticlesUrl", () => {
  it("builds articles URL with country, category, and scaled limit", () => {
    const url = buildFqnArticlesUrl({ country: "US", category: "politics", limit: 5 });
    expect(url).toContain("https://freequicknews.com/api/v1/articles?");
    expect(url).toContain("country=US");
    expect(url).toContain("category=politics");
    expect(url).toContain("limit=20");
  });
});

describe("normalizeFqnArticleRow", () => {
  it("parses imageUrl from FreeQuickNews article rows", () => {
    const article = normalizeFqnArticleRow({
      title: "Example headline",
      url: "https://example.com/story",
      sourceName: "Example News",
      imageUrl: "https://cdn.example.com/hero.jpg",
    });
    expect(article?.imageUrl).toBe("https://cdn.example.com/hero.jpg");
  });

  it("returns null imageUrl when the API omits or nulls the field", () => {
    expect(
      normalizeFqnArticleRow({
        title: "No image",
        url: "https://example.com/no-image",
        imageUrl: null,
      })?.imageUrl,
    ).toBeNull();
  });

  it("parses description from FreeQuickNews article rows", () => {
    const article = normalizeFqnArticleRow({
      title: "Example headline",
      url: "https://example.com/story",
      summary: "A short lede about the story.",
    });
    expect(article?.description).toBe("A short lede about the story.");
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
