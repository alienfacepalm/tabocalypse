import { describe, expect, it } from "vitest";
import {
  newsPerspectiveTooltip,
  topicBalanceTooltip,
  topicPerspectiveIconTooltip,
} from "./balanced-news-labels";
import type { INewsTopicRoundup } from "./balanced-news-types";

const article = {
  title: "Headline",
  url: "https://example.com/a",
  source: "Example News",
  bias: "left-center" as const,
  perspective: "left" as const,
  publishedAt: null,
  isOpinion: true,
  fqnCategory: null,
  imageUrl: null,
  description: null,
};

function opinionTopic(
  overrides: Partial<Pick<INewsTopicRoundup, "left" | "center" | "right" | "balanceScore">> = {},
): Pick<INewsTopicRoundup, "kind" | "left" | "center" | "right" | "balanceScore"> {
  return {
    kind: "opinion",
    left: null,
    center: null,
    right: null,
    balanceScore: 0,
    ...overrides,
  };
}

describe("newsPerspectiveTooltip", () => {
  it("explains why an outlet maps into a perspective column", () => {
    expect(
      newsPerspectiveTooltip("left", {
        bias: "left-center",
        source: "Example News",
        isOpinion: true,
        role: "article",
      }),
    ).toContain("Left-center ratings are grouped into the Left column");
  });
});

describe("topicBalanceTooltip", () => {
  it("describes reporting topics", () => {
    expect(
      topicBalanceTooltip({
        kind: "reporting",
        left: null,
        center: null,
        right: null,
        balanceScore: 1,
      }),
    ).toContain("without Left/Center/Right opinion columns");
  });

  it("mentions FreeQuickNews publisher ratings for opinion topics", () => {
    expect(
      topicBalanceTooltip(
        opinionTopic({ left: article, center: article, right: article, balanceScore: 3 }),
      ),
    ).toContain("FreeQuickNews publisher rating");
  });
});

describe("topicPerspectiveIconTooltip", () => {
  it("explains a filled slot using the slotted article", () => {
    expect(topicPerspectiveIconTooltip("left", article)).toContain("Example News");
  });

  it("explains an empty slot", () => {
    expect(topicPerspectiveIconTooltip("center", null)).toContain("No center opinion take");
  });
});
