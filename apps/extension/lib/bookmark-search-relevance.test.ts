import { describe, expect, it } from "vitest";

import {
  bookmarkSearchRelevanceScore,
  rankBookmarksBySearchRelevance,
} from "./bookmark-search-relevance";

describe("bookmarkSearchRelevanceScore", () => {
  it("prefers an exact phrase in the title over partial token overlap", () => {
    const exact = {
      id: "1",
      title: "Mini-X – Crew Bike Co.",
      url: "https://crewbikeco.com/mini-x",
    };
    const partial = {
      id: "2",
      title: "react-minimal-pie-chart/stories/index.tsx at master · toomuchdesign/react-min…",
      url: "https://github.com/toomuchdesign/react-minimal-pie-chart",
    };

    expect(bookmarkSearchRelevanceScore(exact, "mini-x")).toBeGreaterThan(
      bookmarkSearchRelevanceScore(partial, "mini-x"),
    );
  });
});

describe("rankBookmarksBySearchRelevance", () => {
  it("puts the exact title match first for a hyphenated query", () => {
    const items = [
      {
        id: "a",
        title: "Dominion Voting lawsuit exposes Mike Lindell patriot act",
        url: "https://example.com/a",
      },
      {
        id: "b",
        title: "Pie Chart – Custom size · Storybook",
        url: "https://example.com/b",
      },
      {
        id: "c",
        title: "react-minimal-pie-chart/stories/index.tsx at master · toomuchdesign/react-min…",
        url: "https://github.com/toomuchdesign/react-minimal-pie-chart",
      },
      {
        id: "d",
        title: "Mini-X – Crew Bike Co.",
        url: "https://crewbikeco.com/mini-x",
      },
    ];

    const ranked = rankBookmarksBySearchRelevance(items, "mini-x");
    expect(ranked[0]?.id).toBe("d");
  });

  it("returns the same array reference order when query is empty", () => {
    const items = [
      { id: "1", title: "A", url: "https://a.test" },
      { id: "2", title: "B", url: "https://b.test" },
    ];
    expect(rankBookmarksBySearchRelevance(items, "")).toBe(items);
  });
});
