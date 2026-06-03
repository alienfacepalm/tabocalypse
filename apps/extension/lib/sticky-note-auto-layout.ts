import { buildHudAutoLayoutItems } from "./hud-auto-layout";
import {
  clampHudScalar,
  getHudLayoutMetrics,
  resolveHudPanelSizePx,
  type IHudCanvasRectPx,
  type IHudPanelPosition,
  type THudPanelId,
} from "./hud-layout";
import type { INotePanel, IStickyNotePosition, TWidgetKey } from "./settings";

const STICKY_NOTE_SIZE_LIMITS = {
  minW: 180,
  maxW: 640,
  minH: 140,
  maxH: 720,
} as const;

function clampStickyNoteSizeForReflow(
  widthPx: number,
  heightPx: number,
  options?: { canvasW?: number; canvasH?: number; xPx?: number; yPx?: number },
): { widthPx: number; heightPx: number } {
  const L = STICKY_NOTE_SIZE_LIMITS;
  let w = Math.round(clampHudScalar(widthPx, L.minW, L.maxW));
  let h = Math.round(clampHudScalar(heightPx, L.minH, L.maxH));
  const canvasW = options?.canvasW;
  const canvasH = options?.canvasH;
  const xPx = options?.xPx;
  const yPx = options?.yPx;
  if (canvasW != null && xPx != null) {
    w = Math.min(w, Math.max(L.minW, canvasW - xPx));
  }
  if (canvasH != null && yPx != null) {
    h = Math.min(h, Math.max(L.minH, canvasH - yPx));
  }
  return { widthPx: w, heightPx: h };
}

const REFLOW_MARGIN_PX = 16;
const REFLOW_GAP_PX = 12;
const REFLOW_SCAN_STEP_PX = 24;

export function stickyNotePositionEqual(a: IStickyNotePosition, b: IStickyNotePosition): boolean {
  return a.xPx === b.xPx && a.yPx === b.yPx && a.widthPx === b.widthPx && a.heightPx === b.heightPx;
}

function canvasRectsOverlap(a: IHudCanvasRectPx, b: IHudCanvasRectPx, gapPx: number): boolean {
  const pad = gapPx / 2;
  const aRight = a.leftPx + a.widthPx + pad;
  const bRight = b.leftPx + b.widthPx + pad;
  const aBottom = a.topPx + a.heightPx + pad;
  const bBottom = b.topPx + b.heightPx + pad;
  return (
    a.leftPx - pad < bRight &&
    aRight > b.leftPx - pad &&
    a.topPx - pad < bBottom &&
    aBottom > b.topPx - pad
  );
}

function stickyNoteCanvasRect(position: IStickyNotePosition): IHudCanvasRectPx {
  return {
    leftPx: position.xPx,
    topPx: position.yPx,
    widthPx: position.widthPx,
    heightPx: position.heightPx,
  };
}

function hudPanelCanvasRectPx(
  panelId: THudPanelId,
  position: IHudPanelPosition,
  canvasW: number,
  canvasH: number,
): IHudCanvasRectPx {
  const metrics = getHudLayoutMetrics(canvasW, canvasH);
  const { widthPx, heightPx } = resolveHudPanelSizePx(panelId, position, metrics);
  return {
    leftPx: Math.round((position.xPct / 100) * canvasW),
    topPx: Math.round((position.yPct / 100) * canvasH),
    widthPx,
    heightPx,
  };
}

/** Visible HUD panel boxes in canvas pixels (for sticky reflow obstacle avoidance). */
export function buildHudPanelObstacleRects(
  input: {
    widgets: Record<TWidgetKey, boolean>;
    hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
    pluginDeckVisible: boolean;
    notesListPanelVisible?: boolean;
  },
  canvasW: number,
  canvasH: number,
): IHudCanvasRectPx[] {
  const items = buildHudAutoLayoutItems(input);
  return items.map((item) => hudPanelCanvasRectPx(item.panelId, item.position, canvasW, canvasH));
}

function clampStickyIntoCanvas(
  position: IStickyNotePosition,
  canvasW: number,
  canvasH: number,
): IStickyNotePosition {
  const sized = clampStickyNoteSizeForReflow(position.widthPx, position.heightPx, {
    canvasW,
    canvasH,
    xPx: position.xPx,
    yPx: position.yPx,
  });
  const maxLeft = Math.max(0, canvasW - sized.widthPx);
  const maxTop = Math.max(0, canvasH - sized.heightPx);
  return {
    xPx: Math.min(maxLeft, Math.max(0, Math.round(position.xPx))),
    yPx: Math.min(maxTop, Math.max(0, Math.round(position.yPx))),
    ...sized,
  };
}

function fitsWithoutOverlap(
  position: IStickyNotePosition,
  obstacles: readonly IHudCanvasRectPx[],
): boolean {
  const rect = stickyNoteCanvasRect(position);
  return !obstacles.some((o) => canvasRectsOverlap(rect, o, REFLOW_GAP_PX));
}

/**
 * Keeps a sticky on-canvas and nudges it to the nearest non-overlapping spot when needed.
 */
export function fitStickyNotePositionForCanvas(
  position: IStickyNotePosition,
  canvasW: number,
  canvasH: number,
  obstacles: readonly IHudCanvasRectPx[],
): IStickyNotePosition {
  const clamped = clampStickyIntoCanvas(position, canvasW, canvasH);
  if (fitsWithoutOverlap(clamped, obstacles)) return clamped;

  const { widthPx, heightPx } = clamped;
  const maxLeft = Math.max(0, canvasW - widthPx);
  const maxTop = Math.max(0, canvasH - heightPx);
  if (maxLeft < REFLOW_MARGIN_PX || maxTop < REFLOW_MARGIN_PX) return clamped;

  type TCandidate = { xPx: number; yPx: number; distSq: number };
  const candidates: TCandidate[] = [];

  for (let yPx = REFLOW_MARGIN_PX; yPx <= maxTop; yPx += REFLOW_SCAN_STEP_PX) {
    for (let xPx = REFLOW_MARGIN_PX; xPx <= maxLeft; xPx += REFLOW_SCAN_STEP_PX) {
      const dx = xPx - clamped.xPx;
      const dy = yPx - clamped.yPx;
      candidates.push({ xPx, yPx, distSq: dx * dx + dy * dy });
    }
  }

  candidates.sort((a, b) => a.distSq - b.distSq);

  for (const { xPx, yPx } of candidates) {
    const candidate: IStickyNotePosition = { xPx, yPx, widthPx, heightPx };
    if (fitsWithoutOverlap(candidate, obstacles)) return candidate;
  }

  return clamped;
}

export interface IStickyNoteReflowPlanInput {
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  pluginDeckVisible: boolean;
  notesListPanelVisible?: boolean;
}

/**
 * Repositions unpinned stickies around HUD obstacles (pinned notes are unchanged).
 * Used on canvas resize auto-reflow and on explicit panel arrange (F10 / repack).
 */
export function computeStickyNoteResizeUpdates(
  notePanels: readonly INotePanel[],
  input: IStickyNoteReflowPlanInput,
  canvasW: number,
  canvasH: number,
  options?: { onlyIfChanged?: boolean },
): INotePanel[] | null {
  if (notePanels.length === 0) return null;

  const hudObstacles = buildHudPanelObstacleRects(input, canvasW, canvasH);
  const onlyIfChanged = options?.onlyIfChanged !== false;
  const dynamicObstacles: IHudCanvasRectPx[] = [...hudObstacles];
  let changed = false;

  const nextPanels = notePanels.map((panel) => {
    if (panel.pinned === true) return panel;

    const fitted = fitStickyNotePositionForCanvas(
      panel.position,
      canvasW,
      canvasH,
      dynamicObstacles,
    );
    dynamicObstacles.push(stickyNoteCanvasRect(fitted));

    if (onlyIfChanged && stickyNotePositionEqual(panel.position, fitted)) {
      return panel;
    }
    changed = true;
    return { ...panel, position: fitted };
  });

  if (!changed) return null;
  return nextPanels;
}
