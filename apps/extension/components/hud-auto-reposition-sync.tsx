import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { buildHudAutoLayoutItems, computeHudPanelAutoLayoutUpdates } from "../lib/hud-auto-layout";
import type { IHudPanelPosition, THudPanelId } from "../lib/hud-layout";
import { DEFAULT_HUD_PANEL_POSITIONS, measureHudCanvasSize } from "../lib/hud-layout";
import { computeStickyNoteResizeUpdates } from "../lib/sticky-note-auto-layout";
import type { INotePanel, TWidgetKey } from "../lib/settings";
import { useHudPlacementOptional } from "./hud-placement-context";

const RESIZE_DEBOUNCE_MS = 200;
const SIZE_EPSILON_PX = 2;

function hudPanelSetSignature(input: {
  widgets: Record<TWidgetKey, boolean>;
  pluginDeckVisible: boolean;
  notesListPanelVisible: boolean;
}): string {
  return buildHudAutoLayoutItems({
    widgets: input.widgets,
    hudPanelPositions: DEFAULT_HUD_PANEL_POSITIONS,
    pluginDeckVisible: input.pluginDeckVisible,
    notesListPanelVisible: input.notesListPanelVisible,
  })
    .map((item) => item.key)
    .join("|");
}

export interface IHudAutoRepositionResult {
  hudPanelPositions?: Partial<Record<THudPanelId, IHudPanelPosition>>;
  notePanels?: INotePanel[];
}

interface IRunHudLayoutOptions {
  /** Matches manual Rearrange — repack columns to the fold instead of honoring saved sizes. */
  ignoreUserSizes?: boolean;
}

/** Repositions visible HUD panels when the canvas size changes and auto-reposition is enabled. */
export function HudAutoRepositionSync({
  canvasRef,
  hudAutoRepositionEnabled,
  layoutBootstrapToken,
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
  /** Bumped after settings hydrate so the first auto-repack can run with final panel state. */
  layoutBootstrapToken: number;
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

  const runLayoutRef = useRef<
    | ((
        canvasEl: HTMLElement,
        widthPx: number,
        heightPx: number,
        prevSize: { widthPx: number; heightPx: number } | null,
        options?: IRunHudLayoutOptions,
      ) => void)
    | null
  >(null);
  const scheduleBootstrapLayoutRef = useRef<((canvas: HTMLElement) => void) | null>(null);

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
      prevSize: { widthPx: number; heightPx: number } | null,
      options?: IRunHudLayoutOptions,
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
          onlyIfChanged: true,
          ignoreUserSizes: options?.ignoreUserSizes,
          prevCanvasW: prevSize?.widthPx,
          prevCanvasH: prevSize?.heightPx,
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
    runLayoutRef.current = runLayout;

    const scheduleBootstrapLayout = (canvasEl: HTMLElement): void => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!layoutInputRef.current.hudAutoRepositionEnabled) return;
          const { widthPx, heightPx } = measureHudCanvasSize(canvasEl);
          prevCanvasSizeRef.current = { widthPx, heightPx };
          runLayout(canvasEl, widthPx, heightPx, null, { ignoreUserSizes: true });
        });
      });
    };
    scheduleBootstrapLayoutRef.current = scheduleBootstrapLayout;

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
          runLayout(canvas, widthPx, heightPx, prev);
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
      runLayoutRef.current = null;
      scheduleBootstrapLayoutRef.current = null;
    };
  }, [canvasRef, hudPlacement?.dropHighlight]);

  const lastBootstrapTokenRef = useRef(0);
  useEffect(() => {
    if (!hudAutoRepositionEnabled || layoutBootstrapToken <= lastBootstrapTokenRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || hudPlacement?.dropHighlight) return;
    lastBootstrapTokenRef.current = layoutBootstrapToken;
    scheduleBootstrapLayoutRef.current?.(canvas);
  }, [canvasRef, hudAutoRepositionEnabled, hudPlacement?.dropHighlight, layoutBootstrapToken]);

  const prevPanelSetSignatureRef = useRef<string | null>(null);
  useEffect(() => {
    const signature = hudPanelSetSignature({
      widgets,
      pluginDeckVisible,
      notesListPanelVisible,
    });
    const prev = prevPanelSetSignatureRef.current;
    prevPanelSetSignatureRef.current = signature;
    if (prev == null || prev === signature || !hudAutoRepositionEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas || hudPlacement?.dropHighlight) return;
    const { widthPx, heightPx } = measureHudCanvasSize(canvas);
    runLayoutRef.current?.(canvas, widthPx, heightPx, null, { ignoreUserSizes: true });
  }, [
    canvasRef,
    hudAutoRepositionEnabled,
    hudPlacement?.dropHighlight,
    notesListPanelVisible,
    pluginDeckVisible,
    widgets,
  ]);

  return null;
}
