import { describe, expect, it } from "vitest";
import { computeVirtualWindow, rowsThatFitViewport } from "./hud-virtual-window";

describe("computeVirtualWindow", () => {
  it("returns an empty window for zero items", () => {
    expect(
      computeVirtualWindow({
        scrollTop: 0,
        viewportHeight: 200,
        itemCount: 0,
        itemHeight: 40,
      }),
    ).toEqual({ startIndex: 0, endIndex: 0, offsetY: 0, totalHeight: 0 });
  });

  it("windows mid-list with overscan", () => {
    const win = computeVirtualWindow({
      scrollTop: 400,
      viewportHeight: 200,
      itemCount: 100,
      itemHeight: 40,
      overscan: 2,
    });
    expect(win.startIndex).toBe(8);
    expect(win.endIndex).toBe(18);
    expect(win.offsetY).toBe(320);
    expect(win.totalHeight).toBe(4000);
  });
});

describe("rowsThatFitViewport", () => {
  it("floors height into row slots", () => {
    expect(rowsThatFitViewport(0, 40)).toBe(1);
    expect(rowsThatFitViewport(39, 40)).toBe(1);
    expect(rowsThatFitViewport(80, 40)).toBe(2);
    expect(rowsThatFitViewport(400, 40)).toBe(10);
  });
});
