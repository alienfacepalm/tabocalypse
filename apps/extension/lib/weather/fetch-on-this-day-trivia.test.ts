import { describe, expect, it } from "vitest";
import { pickOnThisDayFacts } from "./parse-on-this-day-trivia";

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
