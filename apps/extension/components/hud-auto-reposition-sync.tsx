import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { computeHudPanelAutoLayoutUpdates } from "../lib/hud-auto-layout";
import type { IHudPanelPosition, THudPanelId } from "../lib/hud-layout";
import { measureHudCanvasSize } from "../lib/hud-layout";
import type { TWidgetKey } from "../lib/settings";
import { useHudPlacementOptional } from "./hud-placement-context";

const RESIZE_DEBOUNCE_MS = 200;
const SIZE_EPSILON_PX = 2;

export interface IHudAutoRepositionResult {
  hudPanelPositions: Partial<Record<THudPanelId, IHudPanelPosition>>;
}

/** Repositions visible HUD panels when the canvas size changes and auto-reposition is enabled. */
export function HudAutoRepositionSync({
  canvasRef,
  enabled,
  widgets,
  hudPanelPositions,
  pluginDeckVisible,
  notesListPanelVisible,
  onLayout,
}: {
  canvasRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  pluginDeckVisible: boolean;
  notesListPanelVisible: boolean;
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
    pluginDeckVisible,
    notesListPanelVisible,
  });
  layoutInputRef.current = { widgets, hudPanelPositions, pluginDeckVisible, notesListPanelVisible };

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
      const hudUpdates = computeHudPanelAutoLayoutUpdates(input, widthPx, heightPx, {
        prevCanvasW: prevW,
        prevCanvasH: prevH,
        onlyIfChanged: true,
      });
      if (Object.keys(hudUpdates).length === 0) return;
      onLayoutRef.current({ hudPanelPositions: hudUpdates });
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
