import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HudPanelDragContext,
  isHudPanelDragExcluded,
  type IHudPanelDragContextValue,
} from "./hud-panel-drag-context";
import { useHudPlacementOptional } from "./hud-placement-context";
import { HudCornerResize } from "./hud-corner-resize";
import {
  HUD_DRAG_Z_LIFT,
  HUD_PANEL_WIDTH_CLASSES,
  type IHudPanelPosition,
  type THudPanelId,
  clampHudPanelPositionToFold,
  clampHudPanelSize,
  computeHudDragCanvasRectPx,
  getHudGridDropHighlight,
  getHudLayoutMetrics,
  hudCanvasMaxPanelTopPx,
  measureHudCanvasSize,
  snapPanelOriginToLayoutGrid,
} from "../lib/hud-layout";

export function DraggableHudPanel({
  panelId,
  canvasRef,
  position,
  chaotic,
  locked,
  zIndexBase,
  onCommit,
  children,
}: {
  panelId: THudPanelId;
  canvasRef: React.RefObject<HTMLElement | null>;
  position: IHudPanelPosition;
  chaotic: boolean;
  locked: boolean;
  /** Resting stack order; lift on drag/resize adds `HUD_DRAG_Z_LIFT`. Default 10. */
  zIndexBase?: number;
  onCommit: (next: IHudPanelPosition) => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [livePct, setLivePct] = useState<IHudPanelPosition | null>(null);
  const [liveSize, setLiveSize] = useState<{ w: number; h: number } | null>(null);
  const [zLift, setZLift] = useState(false);
  const [lockedDragAttemptBump, setLockedDragAttemptBump] = useState(0);
  const lockedDragAttemptAtRef = useRef<number>(0);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originLeftCanvasPx: number;
    originTopCanvasPx: number;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startW: number;
    startH: number;
    originLeftCanvasPx: number;
    originTopCanvasPx: number;
  } | null>(null);

  const hudPlacement = useHudPlacementOptional();

  const resolveLayoutMetrics = useCallback(
    (canvas: HTMLElement) => {
      if (hudPlacement?.layoutMetrics) {
        return hudPlacement.layoutMetrics;
      }
      const { widthPx, heightPx } = measureHudCanvasSize(canvas);
      return getHudLayoutMetrics(widthPx, heightPx);
    },
    [hudPlacement?.layoutMetrics],
  );

  const display = livePct ?? position;
  const widthClass = HUD_PANEL_WIDTH_CLASSES[panelId];

  const effectiveW = liveSize?.w ?? position.widthPx;
  const effectiveH = liveSize?.h ?? position.heightPx;
  const useDefaultWidth = effectiveW == null;

  const computeFromPointer = useCallback(
    (clientX: number, clientY: number, snap: boolean): IHudPanelPosition | null => {
      const canvas = canvasRef.current;
      const panel = rootRef.current;
      const start = dragRef.current;
      if (!canvas || !panel || !start) return null;
      const panelRect = panel.getBoundingClientRect();
      const dx = clientX - start.startClientX;
      const dy = clientY - start.startClientY;
      let nextLeft = start.originLeftCanvasPx + dx;
      let nextTop = start.originTopCanvasPx + dy;
      const metrics = resolveLayoutMetrics(canvas);
      const maxLeft = Math.max(0, metrics.canvasW - panelRect.width);
      const maxTop = hudCanvasMaxPanelTopPx(metrics.canvasH, panelRect.height);
      if (snap && !chaotic) {
        const snapped = snapPanelOriginToLayoutGrid(nextLeft, nextTop, metrics);
        nextLeft = snapped.leftPx;
        nextTop = snapped.topPx;
      }
      nextLeft = Math.min(maxLeft, Math.max(0, nextLeft));
      nextTop = Math.min(maxTop, Math.max(0, nextTop));
      return {
        xPct: (nextLeft / metrics.canvasW) * 100,
        yPct: (nextTop / metrics.canvasH) * 100,
      };
    },
    [canvasRef, chaotic, resolveLayoutMetrics],
  );

  const clearDropHighlight = useCallback(() => {
    hudPlacement?.setDropHighlight(null);
  }, [hudPlacement]);

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const next = computeFromPointer(clientX, clientY, true);
      dragRef.current = null;
      setLivePct(null);
      setZLift(false);
      clearDropHighlight();
      if (next) {
        const canvas = canvasRef.current;
        const panel = rootRef.current;
        const h = panel?.getBoundingClientRect().height ?? position.heightPx ?? 200;
        const committed =
          canvas != null
            ? clampHudPanelPositionToFold(canvas, { ...position, ...next }, h)
            : { ...position, ...next };
        onCommit(committed);
      }
    },
    [canvasRef, clearDropHighlight, computeFromPointer, onCommit, position],
  );

  useEffect(() => {
    const onWinPointerUp = (e: PointerEvent) => {
      if (dragRef.current === null || e.pointerId !== dragRef.current.pointerId) return;
      endDrag(e.clientX, e.clientY);
    };
    window.addEventListener("pointerup", onWinPointerUp);
    window.addEventListener("pointercancel", onWinPointerUp);
    return () => {
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("pointercancel", onWinPointerUp);
    };
  }, [endDrag]);

  useEffect(() => {
    if (!locked) return;
    if (dragRef.current === null) return;
    dragRef.current = null;
    setLivePct(null);
    setZLift(false);
    clearDropHighlight();
  }, [clearDropHighlight, locked]);

  const endResize = useCallback(
    (clientX: number, clientY: number) => {
      const start = resizeRef.current;
      if (start === null) return;
      resizeRef.current = null;
      const dx = clientX - start.startClientX;
      const dy = clientY - start.startClientY;
      const rawW = start.startW + dx;
      const rawH = start.startH + dy;
      const clamped = clampHudPanelSize(panelId, rawW, rawH, window.innerWidth, window.innerHeight);
      setLiveSize(null);
      clearDropHighlight();
      const canvas = canvasRef.current;
      const next = {
        ...position,
        widthPx: clamped.widthPx,
        heightPx: clamped.heightPx,
      };
      onCommit(canvas != null ? clampHudPanelPositionToFold(canvas, next, clamped.heightPx) : next);
    },
    [canvasRef, clearDropHighlight, onCommit, panelId, position],
  );

  useEffect(() => {
    const onWinPointerUp = (e: PointerEvent) => {
      if (resizeRef.current === null || e.pointerId !== resizeRef.current.pointerId) return;
      endResize(e.clientX, e.clientY);
    };
    window.addEventListener("pointerup", onWinPointerUp);
    window.addEventListener("pointercancel", onWinPointerUp);
    return () => {
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("pointercancel", onWinPointerUp);
    };
  }, [endResize]);

  useEffect(() => {
    if (!locked) return;
    if (resizeRef.current === null) return;
    resizeRef.current = null;
    setLiveSize(null);
    clearDropHighlight();
  }, [clearDropHighlight, locked]);

  const publishDropHighlight = useCallback(
    (
      canvas: HTMLElement,
      leftPx: number,
      topPx: number,
      panelWidthPx: number,
      panelHeightPx: number,
    ) => {
      if (chaotic || locked || !hudPlacement) return;
      const metrics = resolveLayoutMetrics(canvas);
      hudPlacement.setDropHighlight(
        getHudGridDropHighlight(leftPx, topPx, panelWidthPx, panelHeightPx, metrics),
      );
    },
    [chaotic, hudPlacement, locked, resolveLayoutMetrics],
  );

  const onPanelPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if (isHudPanelDragExcluded(e.target)) return;
      if (locked) {
        const now = Date.now();
        if (now - lockedDragAttemptAtRef.current > 1200) {
          lockedDragAttemptAtRef.current = now;
          setLockedDragAttemptBump((v) => v + 1);
        }
        return;
      }
      const canvas = canvasRef.current;
      const panel = rootRef.current;
      if (!canvas || !panel) return;
      e.stopPropagation();
      const canvasRect = canvas.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originLeftCanvasPx: panelRect.left - canvasRect.left,
        originTopCanvasPx: panelRect.top - canvasRect.top,
      };
      setZLift(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [canvasRef, locked],
  );

  const onPanelPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const start = dragRef.current;
      if (start === null || e.pointerId !== start.pointerId) return;
      const snapLive = !chaotic;
      const next = computeFromPointer(e.clientX, e.clientY, snapLive);
      if (next) setLivePct(next);
      const canvas = canvasRef.current;
      const panel = rootRef.current;
      if (!canvas || !panel || chaotic) return;
      const panelRect = panel.getBoundingClientRect();
      const metrics = resolveLayoutMetrics(canvas);
      const rect = computeHudDragCanvasRectPx(
        start.originLeftCanvasPx,
        start.originTopCanvasPx,
        e.clientX - start.startClientX,
        e.clientY - start.startClientY,
        panelRect.width,
        panelRect.height,
        metrics,
        true,
      );
      publishDropHighlight(canvas, rect.leftPx, rect.topPx, panelRect.width, panelRect.height);
    },
    [canvasRef, chaotic, computeFromPointer, publishDropHighlight, resolveLayoutMetrics],
  );

  const onPanelPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (dragRef.current === null || e.pointerId !== dragRef.current.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      endDrag(e.clientX, e.clientY);
    },
    [endDrag],
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (locked || e.button !== 0) return;
      const panel = rootRef.current;
      if (!panel) return;
      e.stopPropagation();
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const originLeftCanvasPx = panelRect.left - canvasRect.left;
      const originTopCanvasPx = panelRect.top - canvasRect.top;
      const { width, height } = panelRect;
      resizeRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startW: width,
        startH: height,
        originLeftCanvasPx,
        originTopCanvasPx,
      };
      setZLift(true);
      setLiveSize({ w: width, h: height });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canvasRef, locked],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const start = resizeRef.current;
      if (start === null || e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.startClientX;
      const dy = e.clientY - start.startClientY;
      const rawW = start.startW + dx;
      const rawH = start.startH + dy;
      const clamped = clampHudPanelSize(panelId, rawW, rawH, window.innerWidth, window.innerHeight);
      setLiveSize({ w: clamped.widthPx, h: clamped.heightPx });
    },
    [panelId],
  );

  const onResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (resizeRef.current === null || e.pointerId !== resizeRef.current.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      endResize(e.clientX, e.clientY);
      setZLift(false);
      clearDropHighlight();
    },
    [clearDropHighlight, endResize],
  );

  const dragContext = useMemo<IHudPanelDragContextValue>(
    () => ({
      locked,
      lockedDragAttemptBump,
    }),
    [locked, lockedDragAttemptBump],
  );

  return (
    <div
      ref={rootRef}
      data-hud-panel-id={panelId}
      className={[
        "hud-draggable-panel pointer-events-auto absolute flex max-w-full min-h-0 flex-col overflow-hidden",
        locked ? "hud-panel-locked" : "",
        useDefaultWidth ? widthClass : "",
        effectiveH == null ? "max-h-[min(92vh,calc(100vh-5.25rem-var(--hud-footer-reserve)))]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${display.xPct}%`,
        top: `${display.yPct}%`,
        zIndex: (zIndexBase ?? 10) + (zLift ? HUD_DRAG_Z_LIFT : 0),
        ...(effectiveW != null ? { width: effectiveW } : {}),
        ...(effectiveH != null ? { height: effectiveH } : {}),
      }}
    >
      <HudPanelDragContext.Provider value={dragContext}>
        <div
          className={[
            "hud-panel-size-host relative flex min-h-0 flex-1 flex-col touch-manipulation",
            zLift ? "hud-panel-dragging" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPanelPointerMove}
          onPointerUp={onPanelPointerUp}
          onPointerCancel={onPanelPointerUp}
        >
          <div className="hud-panel-card-frame">
            {children}
            {!locked ? (
              <HudCornerResize
                tip="Drag the corner to resize this panel; body scrolls when space is tight."
                ariaLabel="Resize panel"
                onPointerDown={onResizePointerDown}
                onPointerMove={onResizePointerMove}
                onPointerUp={onResizePointerUp}
              />
            ) : null}
          </div>
        </div>
      </HudPanelDragContext.Provider>
    </div>
  );
}
