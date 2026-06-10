import { describe, expect, it } from "vitest";
import type { INewsArticleRef } from "./balanced-news-types";
import {
  articleMatchesBalancedNewsCategory,
  filterArticlesForBalancedNewsCategory,
} from "./balanced-news-category-filter";

function article(
  partial: Partial<INewsArticleRef> & Pick<INewsArticleRef, "title" | "url">,
): INewsArticleRef {
  return {
    source: "Example",
    bias: "unknown",
    perspective: null,
    publishedAt: null,
    isOpinion: false,
    fqnCategory: null,
    imageUrl: null,
    description: null,
    ...partial,
  };
}

describe("articleMatchesBalancedNewsCategory", () => {
  it("matches strict FQN categories", () => {
    const tech = article({
      title: "Kernel patch lands",
      url: "https://example.com/a",
      fqnCategory: "tech",
    });
    expect(articleMatchesBalancedNewsCategory(tech, "tech")).toBe(true);
    expect(articleMatchesBalancedNewsCategory(tech, "politics")).toBe(false);
  });

  it("routes AI headlines away from Tech when tagged in title", () => {
    const ai = article({
      title: "Anthropic ships a new LLM benchmark",
      url: "https://example.com/ai",
      fqnCategory: "tech",
    });
    expect(articleMatchesBalancedNewsCategory(ai, "ai")).toBe(true);
    expect(articleMatchesBalancedNewsCategory(ai, "tech")).toBe(false);
  });

  it("uses relaxed title hints when strict category is missing", () => {
    const politics = article({
      title: "Senate passes election reform bill",
      url: "https://example.com/p",
      fqnCategory: "tech",
    });
    expect(articleMatchesBalancedNewsCategory(politics, "politics", true)).toBe(true);
    expect(articleMatchesBalancedNewsCategory(politics, "politics", false)).toBe(false);
  });
});

describe("filterArticlesForBalancedNewsCategory", () => {
  it("dedupes and prefers strict matches before relaxed ones", () => {
    const articles = [
      article({
        title: "New laptop review",
        url: "https://example.com/tech",
        fqnCategory: "tech",
      }),
      article({
        title: "Senate passes election reform bill",
        url: "https://example.com/politics",
        fqnCategory: "tech",
      }),
      article({
        title: "Senate passes election reform bill duplicate",
        url: "https://example.com/politics",
        fqnCategory: "tech",
      }),
    ];

    const filtered = filterArticlesForBalancedNewsCategory(articles, "politics", 1);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toContain("Senate");
  });
});
