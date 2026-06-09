import { describe, expect, it } from "vitest";
import { detectOpinionArticle } from "./detect-opinion-article";

describe("detectOpinionArticle", () => {
  it("detects opinion from API category metadata", () => {
    expect(
      detectOpinionArticle({
        title: "Budget fight intensifies",
        url: "https://example.com/story",
        category: "opinion",
      }),
    ).toBe(true);
  });

  it("detects opinion from URL fragments", () => {
    expect(
      detectOpinionArticle({
        title: "Why reform matters now",
        url: "https://example.com/opinion/reform",
      }),
    ).toBe(true);
  });

  it("treats straight reporting as non-opinion without signals", () => {
    expect(
      detectOpinionArticle({
        title: "Markets close higher on jobs data",
        url: "https://example.com/business/markets",
        category: "business",
      }),
    ).toBe(false);
  });
});
