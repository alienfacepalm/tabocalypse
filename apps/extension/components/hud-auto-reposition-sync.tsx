import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  buildHudAutoLayoutItems,
  computeAutoHudPanelLayout,
  resolveHudLayoutDensity,
} from "../lib/hud-auto-layout";
import type { IHudPanelPosition, THudPanelId } from "../lib/hud-layout";
import { getHudLayoutMetrics, measureHudCanvasSize } from "../lib/hud-layout";
import type { INotePanel, TWidgetKey } from "../lib/settings";
import { useHudPlacementOptional } from "./hud-placement-context";

const RESIZE_DEBOUNCE_MS = 200;
const SIZE_EPSILON_PX = 2;

export interface IHudAutoRepositionResult {
  hudPanelPositions: Partial<Record<THudPanelId, IHudPanelPosition>>;
  notePanels: INotePanel[];
}

/** Repositions visible HUD panels when the canvas size changes and auto-reposition is enabled. */
export function HudAutoRepositionSync({
  canvasRef,
  enabled,
  widgets,
  hudPanelPositions,
  notePanels,
  pluginDeckVisible,
  onLayout,
}: {
  canvasRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  notePanels: readonly INotePanel[];
  pluginDeckVisible: boolean;
  onLayout: (result: IHudAutoRepositionResult) => void;
}): null {
  const hudPlacement = useHudPlacementOptional();
  const prevCanvasSizeRef = useRef<{ widthPx: number; heightPx: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLayoutRef = useRef(onLayout);
  onLayoutRef.current = onLayout;
  const layoutInputRef = useRef({
    widgets,
    hudPanelPositions,
    notePanels,
    pluginDeckVisible,
  });
  layoutInputRef.current = { widgets, hudPanelPositions, notePanels, pluginDeckVisible };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) {
      prevCanvasSizeRef.current = null;
      return;
    }

    const runLayout = (
      canvasEl: HTMLElement,
      widthPx: number,
      heightPx: number,
      prevW: number,
      prevH: number,
    ): void => {
      if (hudPlacement?.dropHighlight) return;
      const input = layoutInputRef.current;
      const metrics = getHudLayoutMetrics(widthPx, heightPx);
      const density = resolveHudLayoutDensity(widthPx, heightPx, prevW, prevH);
      const items = buildHudAutoLayoutItems(input);
      const placed = computeAutoHudPanelLayout(items, metrics, density);
      const hudUpdates: Partial<Record<THudPanelId, IHudPanelPosition>> = {};
      const noteUpdates: INotePanel[] = input.notePanels.map((np) => ({ ...np }));
      let noteChanged = false;
      for (const [key, pos] of placed) {
        if (key.startsWith("note:")) {
          const noteId = key.slice(5);
          const idx = noteUpdates.findIndex((p) => p.noteId === noteId);
          if (idx >= 0 && !hudPositionsEqual(noteUpdates[idx].position, pos)) {
            noteUpdates[idx] = { ...noteUpdates[idx], position: pos };
            noteChanged = true;
          }
        } else {
          const panelId = key as THudPanelId;
          const prev = input.hudPanelPositions[panelId];
          if (!hudPositionsEqual(prev, pos)) {
            hudUpdates[panelId] = pos;
          }
        }
      }
      if (Object.keys(hudUpdates).length === 0 && !noteChanged) return;
      onLayoutRef.current({
        hudPanelPositions: hudUpdates,
        notePanels: noteChanged ? noteUpdates : [...input.notePanels],
      });
      canvasEl.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const schedule = (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const { widthPx, heightPx } = measureHudCanvasSize(canvas);
        const prev = prevCanvasSizeRef.current;
        if (prev) {
          const dw = Math.abs(prev.widthPx - widthPx);
          const dh = Math.abs(prev.heightPx - heightPx);
          if (dw < SIZE_EPSILON_PX && dh < SIZE_EPSILON_PX) return;
          runLayout(canvas, widthPx, heightPx, prev.widthPx, prev.heightPx);
        }
        prevCanvasSizeRef.current = { widthPx, heightPx };
      }, RESIZE_DEBOUNCE_MS);
    };

    const { widthPx, heightPx } = measureHudCanvasSize(canvas);
    prevCanvasSizeRef.current = { widthPx, heightPx };

    const ro = new ResizeObserver(schedule);
    ro.observe(canvas);
    window.addEventListener("resize", schedule);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      vv?.removeEventListener("resize", schedule);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      prevCanvasSizeRef.current = null;
    };
  }, [canvasRef, enabled, hudPlacement?.dropHighlight]);

  return null;
}

function hudPositionsEqual(a: IHudPanelPosition, b: IHudPanelPosition): boolean {
  return (
    a.xPct === b.xPct && a.yPct === b.yPct && a.widthPx === b.widthPx && a.heightPx === b.heightPx
  );
}
