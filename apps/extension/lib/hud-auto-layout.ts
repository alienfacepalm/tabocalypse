import type { INotePanel, TWidgetKey } from "./settings";
import {
  HUD_PANEL_SIZE_LIMITS,
  type IHudAutoLayoutItem,
  type IHudCanvasRectPx,
  type IHudLayoutMetrics,
  type IHudPanelPosition,
  type THudLayoutDensity,
  type THudPanelId,
  clampHudPanelSize,
  HUD_LAYOUT_FOLD_OVERLAP_PX,
  HUD_LAYOUT_REFERENCE_CANVAS,
  HUD_PANEL_DEFAULT_SIZE_PX,
  hudCanvasFoldBottomPx,
  hudPositionFromCanvasRect,
  resolveHudPanelSizePx,
} from "./hud-layout";

export type { IHudAutoLayoutItem, THudLayoutDensity } from "./hud-layout";

/** Horizontal and vertical gap between panels in roomy (spread) layout. */
export const HUD_LAND_GAP_PX = 20;

/** Inset from canvas edges in auto layout. */
export const HUD_LAND_MARGIN_PX = 16;

/** Lower values are placed first (higher on screen / earlier in scan). */
export const HUD_AUTO_LAYOUT_PANEL_PRIORITY: Record<THudPanelId, number> = {
  weather: 0,
  notes: 1,
  todo: 2,
  clock: 3,
  tabGuilt: 4,
  topSites: 10,
  bookmarksStrip: 11,
  pluginDeck: 12,
  crypto: 20,
  speedTest: 21,
};

const WIDGET_TO_HUD_PANEL: Partial<Record<TWidgetKey, THudPanelId>> = {
  todo: "todo",
  clock: "clock",
  tabGuilt: "tabGuilt",
  weather: "weather",
  crypto: "crypto",
  speedTest: "speedTest",
  topSites: "topSites",
  bookmarksStrip: "bookmarksStrip",
  notes: "notes",
};

/** How much HUD canvas is available — drives stack vs spread, not resize deltas alone. */
export type THudLandMode = "tight" | "roomy";

export function resolveHudLayoutDensity(
  canvasW: number,
  canvasH: number,
  prevW: number | undefined,
  prevH: number | undefined,
): THudLayoutDensity {
  const area = canvasW * canvasH;
  const refArea = HUD_LAYOUT_REFERENCE_CANVAS.widthPx * HUD_LAYOUT_REFERENCE_CANVAS.heightPx;
  if (prevW != null && prevH != null && prevW > 0 && prevH > 0) {
    const prevArea = prevW * prevH;
    if (area < prevArea * 0.92) return "compact";
    if (area > prevArea * 1.08) return "comfortable";
    return "balanced";
  }
  if (area < refArea * 0.78) return "compact";
  if (area > refArea * 1.22) return "comfortable";
  return "balanced";
}

/** Classify viewport from absolute size (available land), not from previous resize. */
export function resolveHudLandMode(canvasW: number, canvasH: number): THudLandMode {
  const area = canvasW * canvasH;
  const refArea = HUD_LAYOUT_REFERENCE_CANVAS.widthPx * HUD_LAYOUT_REFERENCE_CANVAS.heightPx;
  if (canvasW < 720 || canvasH < 420) return "tight";
  if (area < refArea * 0.55) return "tight";
  return "roomy";
}

export function resolveHudSpreadColumnCount(canvasW: number, panelCount: number): number {
  const n = Math.max(1, panelCount);
  if (canvasW < 640) return 1;
  if (canvasW < 960) return Math.min(2, n);
  if (canvasW < 1320) return Math.min(3, n);
  return Math.min(4, n);
}

export function buildHudAutoLayoutItems(input: {
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  notePanels: readonly INotePanel[];
  pluginDeckVisible: boolean;
}): IHudAutoLayoutItem[] {
  const items: IHudAutoLayoutItem[] = [];
  for (const [widgetKey, panelId] of Object.entries(WIDGET_TO_HUD_PANEL) as [
    TWidgetKey,
    THudPanelId,
  ][]) {
    if (!input.widgets[widgetKey]) continue;
    items.push({
      key: panelId,
      panelId,
      position: input.hudPanelPositions[panelId],
      priority: HUD_AUTO_LAYOUT_PANEL_PRIORITY[panelId],
    });
  }
  if (input.pluginDeckVisible) {
    items.push({
      key: "pluginDeck",
      panelId: "pluginDeck",
      position: input.hudPanelPositions.pluginDeck,
      priority: HUD_AUTO_LAYOUT_PANEL_PRIORITY.pluginDeck,
    });
  }
  if (input.widgets.notes) {
    for (const np of input.notePanels) {
      items.push({
        key: `note:${np.noteId}`,
        panelId: "notes",
        position: np.position,
        priority: HUD_AUTO_LAYOUT_PANEL_PRIORITY.notes + 1,
      });
    }
  }
  return items.sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));
}

interface IHudPlacedPanelRect {
  key: string;
  panelId: THudPanelId;
  priority: number;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

interface IResolvedPanel {
  item: IHudAutoLayoutItem;
  widthPx: number;
  heightPx: number;
}

function hudPanelBoxesOverlap(a: IHudPlacedPanelRect, b: IHudPlacedPanelRect): boolean {
  const aRight = a.leftPx + a.widthPx;
  const bRight = b.leftPx + b.widthPx;
  const aBottom = a.topPx + a.heightPx;
  const bBottom = b.topPx + b.heightPx;
  return a.leftPx < bRight && aRight > b.leftPx && a.topPx < bBottom && aBottom > b.topPx;
}

function shrinkPlacementHeightsToSpan(
  placements: IHudPlacedPanelRect[],
  targetSpanPx: number,
): void {
  if (placements.length === 0) return;
  const minTop = Math.min(...placements.map((p) => p.topPx));
  const maxBottom = Math.max(...placements.map((p) => p.topPx + p.heightPx));
  const currentSpan = maxBottom - minTop;
  if (currentSpan <= targetSpanPx) return;

  const needRemove = currentSpan - targetSpanPx;
  const slackByPanel = placements.map((p) => ({
    p,
    slack: p.heightPx - HUD_PANEL_SIZE_LIMITS[p.panelId].minH,
  }));
  const totalSlack = slackByPanel.reduce((sum, e) => sum + Math.max(0, e.slack), 0);
  if (totalSlack <= 0) return;

  const remove = Math.min(needRemove, totalSlack);
  for (const { p, slack } of slackByPanel) {
    if (slack <= 0) continue;
    const delta = (slack / totalSlack) * remove;
    const minH = HUD_PANEL_SIZE_LIMITS[p.panelId].minH;
    p.heightPx = Math.max(minH, Math.round(p.heightPx - delta));
  }
}

function clampPlacementsAboveFold(placements: IHudPlacedPanelRect[], foldBottomPx: number): void {
  for (const p of placements) {
    const bottom = p.topPx + p.heightPx;
    if (bottom > foldBottomPx) {
      p.topPx = Math.max(0, foldBottomPx - p.heightPx);
    }
  }
}

function overlayPackOverflowToFold(placements: IHudPlacedPanelRect[], foldBottomPx: number): void {
  const overflow = placements.filter((p) => p.topPx + p.heightPx > foldBottomPx + 0.5);
  if (overflow.length === 0) return;

  const needsPack = new Set<IHudPlacedPanelRect>(overflow);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const p of placements) {
      if (needsPack.has(p)) continue;
      for (const o of needsPack) {
        if (hudPanelBoxesOverlap(p, o)) {
          needsPack.add(p);
          expanded = true;
        }
      }
    }
  }

  const packList = [...needsPack].sort((a, b) => a.priority - b.priority);
  let cursorBottom = foldBottomPx;
  for (const p of packList) {
    p.topPx = Math.max(0, cursorBottom - p.heightPx);
    cursorBottom = p.topPx - HUD_LAYOUT_FOLD_OVERLAP_PX;
  }
}

export function fitHudPlacementsToFold(
  placements: IHudPlacedPanelRect[],
  foldHeightPx: number,
): void {
  if (placements.length === 0) return;
  const foldBottomPx = hudCanvasFoldBottomPx(foldHeightPx);
  const minTop = Math.min(...placements.map((p) => p.topPx));
  const targetSpan = foldBottomPx - minTop;

  clampPlacementsAboveFold(placements, foldBottomPx);
  shrinkPlacementHeightsToSpan(placements, targetSpan);
  clampPlacementsAboveFold(placements, foldBottomPx);
  overlayPackOverflowToFold(placements, foldBottomPx);
}

function scaleResolvedHeightsToFold(
  resolved: IResolvedPanel[],
  foldHeightPx: number,
  gapPx: number,
): void {
  const foldBottomPx = hudCanvasFoldBottomPx(foldHeightPx);
  const gaps = Math.max(0, resolved.length - 1) * gapPx;
  const total = resolved.reduce((sum, r) => sum + r.heightPx, 0) + gaps;
  if (total <= foldBottomPx) return;

  const body = resolved.reduce((sum, r) => sum + r.heightPx, 0);
  const scale = (foldBottomPx - gaps) / body;
  for (const r of resolved) {
    const minH = HUD_PANEL_SIZE_LIMITS[r.item.panelId].minH;
    r.heightPx = Math.max(minH, Math.round(r.heightPx * scale));
  }
}

function resolvePanelSizeForLand(
  item: IHudAutoLayoutItem,
  position: IHudPanelPosition,
  metrics: IHudLayoutMetrics,
  landMode: THudLandMode,
  columnInnerWidthPx?: number,
): { widthPx: number; heightPx: number } {
  const { widthPx: rawW, heightPx } = resolveHudPanelSizePx(item.panelId, position, metrics);
  let widthPx = rawW;
  const def = HUD_PANEL_DEFAULT_SIZE_PX[item.panelId];

  if (landMode === "roomy" && columnInnerWidthPx != null) {
    const maxW = Math.min(def.widthPx, Math.floor(columnInnerWidthPx));
    widthPx = Math.min(widthPx, maxW);
  } else if (landMode === "tight") {
    const maxW = metrics.canvasW - HUD_LAND_MARGIN_PX * 2;
    widthPx = Math.min(widthPx, def.widthPx, maxW);
  }

  return clampHudPanelSize(item.panelId, widthPx, heightPx, metrics.canvasW, metrics.canvasH);
}

/** Masonry columns with equal gaps — uses horizontal real estate on wide screens. */
function placeRoomySpreadLayout(
  resolved: IResolvedPanel[],
  metrics: IHudLayoutMetrics,
): IHudPlacedPanelRect[] {
  const placed: IHudPlacedPanelRect[] = [];
  const cols = resolveHudSpreadColumnCount(metrics.canvasW, resolved.length);
  const gap = HUD_LAND_GAP_PX;
  const margin = HUD_LAND_MARGIN_PX;
  const innerW = metrics.canvasW - margin * 2 - gap * (cols - 1);
  const colWidth = innerW / cols;
  const colTops = Array.from({ length: cols }, () => margin);

  for (const { item, widthPx: _w, heightPx: _h } of resolved) {
    let col = 0;
    for (let c = 1; c < cols; c += 1) {
      if (colTops[c]! < colTops[col]!) col = c;
    }

    const { widthPx, heightPx } = resolvePanelSizeForLand(
      item,
      item.position,
      metrics,
      "roomy",
      colWidth,
    );

    const leftPx = margin + col * (colWidth + gap);
    const topPx = colTops[col]!;
    placed.push({
      key: item.key,
      panelId: item.panelId,
      priority: item.priority,
      leftPx,
      topPx,
      widthPx,
      heightPx,
    });
    colTops[col] = topPx + heightPx + gap;
  }

  return placed;
}

/** Single column, minimal width — for narrow or short viewports. */
function placeTightStackLayout(
  resolved: IResolvedPanel[],
  metrics: IHudLayoutMetrics,
): IHudPlacedPanelRect[] {
  const placed: IHudPlacedPanelRect[] = [];
  const gap = HUD_LAND_GAP_PX;
  const margin = HUD_LAND_MARGIN_PX;
  let topPx = margin;

  for (const { item } of resolved) {
    const { widthPx, heightPx } = resolvePanelSizeForLand(item, item.position, metrics, "tight");
    placed.push({
      key: item.key,
      panelId: item.panelId,
      priority: item.priority,
      leftPx: margin,
      topPx,
      widthPx,
      heightPx,
    });
    topPx += heightPx + gap;
  }

  return placed;
}

/**
 * Repacks visible HUD panels for the current canvas (land).
 * Roomy: multi-column masonry with equal spacing; tight: one column, sized down.
 */
export function computeAutoHudPanelLayout(
  items: readonly IHudAutoLayoutItem[],
  metrics: IHudLayoutMetrics,
  _density: THudLayoutDensity,
): Map<string, IHudPanelPosition> {
  const out = new Map<string, IHudPanelPosition>();
  if (items.length === 0) return out;

  const landMode = resolveHudLandMode(metrics.canvasW, metrics.canvasH);
  const resolved: IResolvedPanel[] = items.map((item) => {
    const size = resolvePanelSizeForLand(item, item.position, metrics, landMode);
    return { item, ...size };
  });

  if (landMode === "tight") {
    scaleResolvedHeightsToFold(resolved, metrics.canvasH, HUD_LAND_GAP_PX);
  }

  const placedRects =
    landMode === "roomy"
      ? placeRoomySpreadLayout(resolved, metrics)
      : placeTightStackLayout(resolved, metrics);

  fitHudPlacementsToFold(placedRects, metrics.canvasH);

  for (const p of placedRects) {
    const rect: IHudCanvasRectPx = {
      leftPx: p.leftPx,
      topPx: p.topPx,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    };
    out.set(
      p.key,
      hudPositionFromCanvasRect(rect, { widthPx: p.widthPx, heightPx: p.heightPx }, metrics),
    );
  }

  return out;
}
