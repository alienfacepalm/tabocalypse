import { describe, expect, it } from "vitest";
import {
  pickSearchPlaceholderLeadForHumorRank,
  searchPlaceholderHumorRank,
  searchPlaceholderLeadsForHumorRank,
} from "./search-placeholder-leads";

describe("searchPlaceholderHumorRank", () => {
  it("maps disabled humor / off intensity to rank 0", () => {
    expect(searchPlaceholderHumorRank(false, "spicy")).toBe(0);
    expect(searchPlaceholderHumorRank(true, "off")).toBe(0);
  });

  it("maps mild / spicy / unhinged when humor is on", () => {
    expect(searchPlaceholderHumorRank(true, "mild")).toBe(1);
    expect(searchPlaceholderHumorRank(true, "spicy")).toBe(2);
    expect(searchPlaceholderHumorRank(true, "unhinged")).toBe(3);
  });
});

describe("pickSearchPlaceholderLeadForHumorRank", () => {
  it("expands pool size monotonically with rank", () => {
    expect(searchPlaceholderLeadsForHumorRank(0).length).toBeLessThanOrEqual(
      searchPlaceholderLeadsForHumorRank(1).length,
    );
    expect(searchPlaceholderLeadsForHumorRank(1).length).toBeLessThanOrEqual(
      searchPlaceholderLeadsForHumorRank(2).length,
    );
    expect(searchPlaceholderLeadsForHumorRank(2).length).toBeLessThanOrEqual(
      searchPlaceholderLeadsForHumorRank(3).length,
    );
    expect(searchPlaceholderLeadsForHumorRank(3).length).toBeGreaterThan(0);
  });

  it("rank 0 draws only from the neutral tier", () => {
    const allowed = new Set(searchPlaceholderLeadsForHumorRank(0));
    for (let i = 0; i < 80; i++) {
      expect(allowed.has(pickSearchPlaceholderLeadForHumorRank(0))).toBe(true);
    }
  });

  it("rank 3 pool adds unhinged-exclusive lines over rank 2", () => {
    const unhingedOnly = "What useless trivia validates your fragile ego today";
    expect(searchPlaceholderLeadsForHumorRank(2).includes(unhingedOnly)).toBe(false);
    expect(searchPlaceholderLeadsForHumorRank(3).includes(unhingedOnly)).toBe(true);
  });

  it("rank 3 picks only lines from its cumulative pool", () => {
    const allowed = new Set(searchPlaceholderLeadsForHumorRank(3));
    for (let i = 0; i < 80; i++) {
      expect(allowed.has(pickSearchPlaceholderLeadForHumorRank(3))).toBe(true);
    }
  });
});
