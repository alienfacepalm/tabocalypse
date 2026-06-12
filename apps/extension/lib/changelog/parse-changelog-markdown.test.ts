import { describe, expect, it } from "vitest";
import { parseChangelogMarkdown } from "./parse-changelog-markdown";

describe("parseChangelogMarkdown", () => {
  it("parses headings, subheadings, and list items", () => {
    const blocks = parseChangelogMarkdown(`# Changelog

## [Unreleased]

### Added

- **Weather** widget: ten-day forecast panel.
`);
    expect(blocks.some((b) => b.type === "heading" && b.text === "[Unreleased]")).toBe(true);
    expect(blocks.some((b) => b.type === "subheading" && b.text === "Added")).toBe(true);
    expect(blocks.some((b) => b.type === "listItem" && b.text.includes("ten-day forecast"))).toBe(
      true,
    );
  });
});
