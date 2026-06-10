import { describe, expect, it } from "vitest";
import type { INewsArticleRef, INewsTopicRoundup } from "./balanced-news-types";
import { resolveTopicPreviewArticle } from "./resolve-topic-preview-article";

const reportingArticle: INewsArticleRef = {
  title: "Reporting lead",
  url: "https://example.com/report",
  source: "Wire",
  bias: "center",
  perspective: "center",
  publishedAt: 1_700_000_000_000,
  isOpinion: false,
  fqnCategory: "politics",
  imageUrl: null,
  description: null,
};

const leftArticle: INewsArticleRef = {
  ...reportingArticle,
  title: "Left take",
  url: "https://example.com/left",
  perspective: "left",
  bias: "left",
  isOpinion: true,
  publishedAt: 1_700_000_000_100,
};

function topic(
  partial: Partial<INewsTopicRoundup> & Pick<INewsTopicRoundup, "kind">,
): INewsTopicRoundup {
  return {
    id: "topic-1",
    title: "Topic title",
    publishedAt: reportingArticle.publishedAt,
    articles: [reportingArticle],
    left: null,
    center: null,
    right: null,
    reporting: reportingArticle,
    balanceScore: 1,
    ...partial,
  };
}

describe("resolveTopicPreviewArticle", () => {
  it("returns the reporting slot for reporting topics", () => {
    expect(resolveTopicPreviewArticle(topic({ kind: "reporting" }))?.url).toBe(
      reportingArticle.url,
    );
  });

  it("returns the newest slotted opinion article for opinion topics", () => {
    expect(
      resolveTopicPreviewArticle(
        topic({
          kind: "opinion",
          reporting: null,
          articles: [leftArticle],
          left: leftArticle,
        }),
      )?.url,
    ).toBe(leftArticle.url);
  });
});
