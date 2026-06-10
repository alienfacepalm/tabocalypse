import { describe, expect, it } from "vitest";
import type { INewsArticleRef } from "./balanced-news-types";
import { formatArticleSynopsis } from "./format-article-synopsis";

const baseArticle: INewsArticleRef = {
  title: "Example headline",
  url: "https://example.com/story",
  source: "Example News",
  bias: "center",
  perspective: "center",
  publishedAt: null,
  isOpinion: false,
  fqnCategory: null,
  imageUrl: null,
  description: null,
};

describe("formatArticleSynopsis", () => {
  it("uses the first paragraph of description text", () => {
    const synopsis = formatArticleSynopsis({
      ...baseArticle,
      description: "First paragraph about the story.\n\nSecond paragraph ignored.",
    });
    expect(synopsis).toBe("First paragraph about the story.");
  });

  it("truncates long descriptions with an ellipsis", () => {
    const synopsis = formatArticleSynopsis(
      {
        ...baseArticle,
        description: "A".repeat(300),
      },
      80,
    );
    expect(synopsis.endsWith("…")).toBe(true);
    expect(synopsis.length).toBeLessThanOrEqual(81);
  });

  it("falls back to source copy when description is missing", () => {
    expect(formatArticleSynopsis(baseArticle)).toContain("Example News");
  });
});
