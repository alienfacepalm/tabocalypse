import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { computeHudPanelAutoLayoutUpdates } from "../lib/hud-auto-layout";
import type { IHudPanelPosition, THudPanelId } from "../lib/hud-layout";
import { measureHudCanvasSize } from "../lib/hud-layout";
import { computeStickyNoteResizeUpdates } from "../lib/sticky-note-auto-layout";
import type { INotePanel, TWidgetKey } from "../lib/settings";
import { useHudPlacementOptional } from "./hud-placement-context";

const RESIZE_DEBOUNCE_MS = 200;
const SIZE_EPSILON_PX = 2;

export interface IHudAutoRepositionResult {
  hudPanelPositions?: Partial<Record<THudPanelId, IHudPanelPosition>>;
  notePanels?: INotePanel[];
}

/** Repositions visible HUD panels when the canvas size changes and auto-reposition is enabled. */
export function HudAutoRepositionSync({
  canvasRef,
  hudAutoRepositionEnabled,
  widgets,
  hudPanelPositions,
  notePanels,
  pluginDeckVisible,
  notesListPanelVisible,
  onLayout,
}: {
  canvasRef: RefObject<HTMLElement | null>;
  /** When false, HUD panels are not auto-repacked; unpinned stickies still reflow on resize. */
  hudAutoRepositionEnabled: boolean;
  widgets: Record<TWidgetKey, boolean>;
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  notePanels: readonly INotePanel[];
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
    notePanels,
    pluginDeckVisible,
    notesListPanelVisible,
    hudAutoRepositionEnabled,
  });
  layoutInputRef.current = {
    widgets,
    hudPanelPositions,
    notePanels,
    pluginDeckVisible,
    notesListPanelVisible,
    hudAutoRepositionEnabled,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
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
      const planInput = {
        widgets: input.widgets,
        hudPanelPositions: input.hudPanelPositions,
        pluginDeckVisible: input.pluginDeckVisible,
        notesListPanelVisible: input.notesListPanelVisible,
      };

      let effectiveHud = input.hudPanelPositions;
      let hudUpdates: Partial<Record<THudPanelId, IHudPanelPosition>> | undefined;
      if (input.hudAutoRepositionEnabled) {
        hudUpdates = computeHudPanelAutoLayoutUpdates(planInput, widthPx, heightPx, {
          prevCanvasW: prevW,
          prevCanvasH: prevH,
          onlyIfChanged: true,
        });
        if (Object.keys(hudUpdates).length > 0) {
          effectiveHud = { ...effectiveHud, ...hudUpdates };
        }
      }

      const stickyPlanInput = { ...planInput, hudPanelPositions: effectiveHud };
      const notePanelUpdates = computeStickyNoteResizeUpdates(
        input.notePanels,
        stickyPlanInput,
        widthPx,
        heightPx,
        { onlyIfChanged: true },
      );

      const hasHudUpdates = hudUpdates != null && Object.keys(hudUpdates).length > 0;
      if (!hasHudUpdates && notePanelUpdates == null) return;

      onLayoutRef.current({
        ...(hasHudUpdates ? { hudPanelPositions: hudUpdates } : {}),
        ...(notePanelUpdates != null ? { notePanels: notePanelUpdates } : {}),
      });
      if (hasHudUpdates) {
        canvasEl.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
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
  }, [canvasRef, hudPlacement?.dropHighlight]);

  return null;
}
