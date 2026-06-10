import { describe, expect, it } from "vitest";
import type { INewsArticleRef } from "./balanced-news-types";
import { clusterNewsTopics } from "./cluster-news-topics";

const now = Date.parse("2026-06-09T12:00:00Z");

function article(
  partial: Partial<INewsArticleRef> & Pick<INewsArticleRef, "title" | "url">,
): INewsArticleRef {
  return {
    source: "Example News",
    bias: "center",
    perspective: "center",
    publishedAt: now - 60 * 60 * 1000,
    isOpinion: false,
    fqnCategory: null,
    imageUrl: null,
    description: null,
    ...partial,
  };
}

describe("clusterNewsTopics", () => {
  it("clusters similar headlines and fills L/C/R slots for opinion topics", () => {
    const articles: INewsArticleRef[] = [
      article({
        title: "Senate climate bill passes after late negotiations",
        url: "https://left.example/a",
        source: "Left Daily",
        bias: "left",
        perspective: "left",
        isOpinion: true,
      }),
      article({
        title: "Senate climate bill passes in bipartisan vote",
        url: "https://center.example/b",
        source: "Center Wire",
        bias: "center",
        perspective: "center",
        isOpinion: true,
      }),
      article({
        title: "Senate climate bill passes with GOP support",
        url: "https://right.example/c",
        source: "Right Tribune",
        bias: "right",
        perspective: "right",
        isOpinion: true,
      }),
      article({
        title: "Tech stocks rally on earnings beat",
        url: "https://center.example/d",
        source: "Market Desk",
        bias: "center",
        perspective: "center",
        isOpinion: false,
      }),
    ];

    const topics = clusterNewsTopics(articles, 5, now);
    expect(topics.length).toBeGreaterThanOrEqual(2);

    const climate = topics.find((t) => t.kind === "opinion" && t.balanceScore >= 2);
    expect(climate).toBeDefined();
    expect(climate!.left?.url).toContain("left.example");
    expect(climate!.center?.url).toContain("center.example");
    expect(climate!.right?.url).toContain("right.example");

    const reporting = topics.find((t) => t.kind === "reporting");
    expect(reporting?.reporting?.title).toContain("Tech stocks");
    expect(reporting?.articles).toHaveLength(1);
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
  });
});
