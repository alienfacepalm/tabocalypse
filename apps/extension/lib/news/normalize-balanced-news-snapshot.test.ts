import { describe, expect, it } from "vitest";
import type { INewsArticleRef, INewsTopicRoundup } from "./balanced-news-types";
import {
  normalizeNewsFeedSnapshot,
  normalizeNewsTopicRoundup,
} from "./normalize-balanced-news-snapshot";

const reportingArticle: INewsArticleRef = {
  title: "Senate passes climate bill",
  url: "https://example.com/report",
  source: "Wire",
  bias: "center",
  perspective: "center",
  publishedAt: 1_700_000_000_000,
  isOpinion: false,
  fqnCategory: "politics",
};

function topicWithoutArticles(
  partial: Partial<INewsTopicRoundup> & Pick<INewsTopicRoundup, "id" | "title" | "kind">,
): INewsTopicRoundup {
  return {
    publishedAt: reportingArticle.publishedAt,
    left: null,
    center: null,
    right: null,
    reporting: reportingArticle,
    balanceScore: 1,
    ...partial,
    articles: undefined as unknown as INewsArticleRef[],
  };
}

describe("normalizeNewsTopicRoundup", () => {
  it("backfills articles from reporting slot when missing on cached topics", () => {
    const legacy = topicWithoutArticles({
      id: "topic-legacy",
      title: "Climate bill",
      kind: "reporting",
    });

    const normalized = normalizeNewsTopicRoundup(legacy);
    expect(normalized.articles).toHaveLength(1);
    expect(normalized.articles[0]?.url).toBe(reportingArticle.url);
  });
});

describe("normalizeNewsFeedSnapshot", () => {
  it("normalizes every topic in a cached snapshot", () => {
    const snapshot = normalizeNewsFeedSnapshot({
      topics: [
        topicWithoutArticles({
          id: "topic-legacy",
          title: "Climate bill",
          kind: "reporting",
        }),
      ],
      fetchedAt: 1,
      country: "US",
      category: "politics",
      stale: false,
    });

    expect(snapshot.topics[0]?.articles).toHaveLength(1);
  });
});
