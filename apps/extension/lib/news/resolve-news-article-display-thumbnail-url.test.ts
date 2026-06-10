import { describe, expect, it } from "vitest";
import type { INewsArticleRef } from "./balanced-news-types";
import { resolveNewsArticleDisplayThumbnailUrl } from "./resolve-news-article-display-thumbnail-url";

const baseArticle: INewsArticleRef = {
  title: "Example",
  url: "https://www.nytimes.com/2026/example.html",
  source: "NYT",
  bias: "left-center",
  perspective: "left",
  publishedAt: null,
  isOpinion: false,
  fqnCategory: "politics",
  imageUrl: null,
  description: null,
};

describe("resolveNewsArticleDisplayThumbnailUrl", () => {
  it("prefers API imageUrl when present", () => {
    const article = { ...baseArticle, imageUrl: "https://cdn.example.com/a.jpg" };
    expect(resolveNewsArticleDisplayThumbnailUrl(article)).toBe("https://cdn.example.com/a.jpg");
  });

  it("falls back to a source favicon thumbnail", () => {
    const url = resolveNewsArticleDisplayThumbnailUrl(baseArticle);
    expect(url).toContain("google.com/s2/favicons");
    expect(url).toContain(encodeURIComponent(baseArticle.url));
  });
});
