export interface IVirtualWindow {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

/** Compute the visible index range for a fixed-height virtual list. */
export function computeVirtualWindow(input: {
  scrollTop: number;
  viewportHeight: number;
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}): IVirtualWindow {
  const itemHeight = Math.max(1, input.itemHeight);
  const itemCount = Math.max(0, Math.floor(input.itemCount));
  const overscan = Math.max(0, Math.floor(input.overscan ?? 4));
  const viewportHeight = Math.max(0, input.viewportHeight);
  const scrollTop = Math.max(0, input.scrollTop);
  const totalHeight = itemCount * itemHeight;
  if (itemCount === 0 || viewportHeight <= 0) {
    return { startIndex: 0, endIndex: 0, offsetY: 0, totalHeight };
  }
  const first = Math.floor(scrollTop / itemHeight);
  const visible = Math.ceil(viewportHeight / itemHeight) + 1;
  const startIndex = Math.max(0, first - overscan);
  const endIndex = Math.min(itemCount, first + visible + overscan);
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    totalHeight,
  };
}

/** How many rows fit in a viewport (at least 1 when there is any height). */
export function rowsThatFitViewport(viewportHeightPx: number, rowHeightPx: number): number {
  const h = Math.max(0, viewportHeightPx);
  const row = Math.max(1, rowHeightPx);
  if (h <= 0) return 1;
  return Math.max(1, Math.floor(h / row));
}
