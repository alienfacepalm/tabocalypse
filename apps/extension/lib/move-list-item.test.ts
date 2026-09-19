import { describe, expect, it } from "vitest";
import { moveListItem, orderListByIds } from "./move-list-item";

describe("moveListItem", () => {
  it("moves items down and up without mutating the input", () => {
    const list = ["a", "b", "c", "d"] as const;
    expect(moveListItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveListItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  it("clamps the target and ignores bad sources", () => {
    expect(moveListItem(["a", "b", "c"], 0, 99)).toEqual(["b", "c", "a"]);
    expect(moveListItem(["a", "b", "c"], 2, -5)).toEqual(["c", "a", "b"]);
    expect(moveListItem(["a", "b"], 7, 0)).toEqual(["a", "b"]);
    expect(moveListItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("orderListByIds", () => {
  it("follows the id order and keeps unknown items last in their original order", () => {
    const list = [{ id: "x" }, { id: "a" }, { id: "y" }, { id: "b" }];
    expect(orderListByIds(list, ["b", "a"], (item) => item.id).map((item) => item.id)).toEqual([
      "b",
      "a",
      "x",
      "y",
    ]);
  });
});
