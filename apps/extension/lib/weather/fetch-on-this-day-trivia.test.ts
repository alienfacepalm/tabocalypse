import { describe, expect, it } from "vitest";
import { buildWikimediaOnThisDayUrl, pickOnThisDayFacts } from "./parse-on-this-day-trivia";

describe("buildWikimediaOnThisDayUrl", () => {
  it("zero-pads month and day for the Wikimedia on-this-day feed", () => {
    expect(buildWikimediaOnThisDayUrl(6, 14)).toBe(
      "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/06/14",
    );
    expect(buildWikimediaOnThisDayUrl(3, 5, "de")).toBe(
      "https://api.wikimedia.org/feed/v1/wikipedia/de/onthisday/all/03/05",
    );
  });
});

describe("pickOnThisDayFacts", () => {
  it("prefers selected items then events and strips HTML", () => {
    const facts = pickOnThisDayFacts(
      {
        selected: [{ year: 2001, text: "<b>Example</b> event" }],
        events: [{ year: 1776, text: "Another event" }],
      },
      2,
    );
    expect(facts).toEqual([
      { year: 2001, text: "Example event" },
      { year: 1776, text: "Another event" },
    ]);
  });
});
