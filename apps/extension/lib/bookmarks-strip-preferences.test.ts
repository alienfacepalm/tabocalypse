import { describe, expect, it } from "vitest";
import {
  applyBookmarksStripPreferences,
  clearBookmarksStripOrder,
  coerceBookmarksStripHidden,
  coerceBookmarksStripIdList,
  hideBookmarksStripBookmark,
  moveBookmarksStripOrderEntry,
  reorderBookmarksStripVisibleIds,
  unhideBookmarksStripBookmark,
} from "./bookmarks-strip-preferences";

describe("coerceBookmarksStripIdList", () => {
  it("dedupes and trims ids", () => {
    expect(coerceBookmarksStripIdList([" a ", "b", "a", "", 3])).toEqual(["a", "b"]);
  });
});

describe("coerceBookmarksStripHidden", () => {
  it("coerces bookmark entries and migrates legacy id lists", () => {
    expect(
      coerceBookmarksStripHidden(
        [{ id: "1", title: "One", url: "https://example.com" }],
        ["legacy"],
      ),
    ).toEqual([{ id: "1", title: "One", url: "https://example.com" }]);
    expect(coerceBookmarksStripHidden(undefined, ["legacy"])).toEqual([{ id: "legacy" }]);
  });
});

describe("applyBookmarksStripPreferences", () => {
  const items = [
    { id: "1", title: "One" },
    { id: "2", title: "Two" },
    { id: "3", title: "Three" },
  ];

  it("filters hidden bookmarks", () => {
    expect(applyBookmarksStripPreferences(items, [{ id: "2" }], [])).toEqual([
      { id: "1", title: "One" },
      { id: "3", title: "Three" },
    ]);
  });

  it("applies custom order before unlisted items", () => {
    expect(applyBookmarksStripPreferences(items, [], ["3", "1"])).toEqual([
      { id: "3", title: "Three" },
      { id: "1", title: "One" },
      { id: "2", title: "Two" },
    ]);
  });
});

describe("hideBookmarksStripBookmark", () => {
  it("stores bookmark metadata and removes it from order", () => {
    expect(
      hideBookmarksStripBookmark([], ["a", "b"], {
        id: "a",
        title: "Alpha",
        url: "https://alpha.test",
      }),
    ).toEqual({
      hidden: [{ id: "a", title: "Alpha", url: "https://alpha.test" }],
      orderIds: ["b"],
    });
  });
});

describe("unhideBookmarksStripBookmark", () => {
  it("removes bookmark from hidden list", () => {
    expect(
      unhideBookmarksStripBookmark(
        [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
        ],
        "a",
      ),
    ).toEqual([{ id: "b", title: "B" }]);
  });
});

describe("reorderBookmarksStripVisibleIds", () => {
  it("moves a bookmark earlier in the visible list", () => {
    expect(reorderBookmarksStripVisibleIds(["a", "b", "c"], [], "b", "up")).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("no-ops at the top edge", () => {
    expect(reorderBookmarksStripVisibleIds(["a", "b"], ["a", "b"], "a", "up")).toEqual(["a", "b"]);
  });
});

describe("moveBookmarksStripOrderEntry", () => {
  it("reorders stored order ids", () => {
    expect(moveBookmarksStripOrderEntry(["a", "b", "c"], "c", "up")).toEqual(["a", "c", "b"]);
  });
});

describe("clearBookmarksStripOrder", () => {
  it("returns an empty list", () => {
    expect(clearBookmarksStripOrder()).toEqual([]);
  });
});
