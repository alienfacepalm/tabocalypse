import { MoveDiagonal2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HudPanelDragContext, type IHudPanelDragContextValue } from "./hud-panel-drag-context";
import { HudTip } from "./hud-tip";
import {
  HUD_PANEL_WIDTH_CLASSES,
  HUD_SNAP_GRID_PX,
  type IHudPanelPosition,
  type THudPanelId,
  clampHudPanelSize,
  clampHudScalar,
  snapScalarToGrid,
} from "../lib/hud-layout";

export function DraggableHudPanel({
  panelId,
  canvasRef,
  position,
  chaotic,
  locked,
  onCommit,
  children,
}: {
  panelId: THudPanelId;
  canvasRef: React.RefObject<HTMLElement | null>;
  position: IHudPanelPosition;
  chaotic: boolean;
  locked: boolean;
  onCommit: (next: IHudPanelPosition) => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [livePct, setLivePct] = useState<IHudPanelPosition | null>(null);
  const [liveSize, setLiveSize] = useState<{ w: number; h: number } | null>(null);
  const [zLift, setZLift] = useState(false);
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
  } | null>(null);

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
      const canvasRect = canvas.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const dx = clientX - start.startClientX;
      const dy = clientY - start.startClientY;
      let nextLeft = start.originLeftCanvasPx + dx;
      let nextTop = start.originTopCanvasPx + dy;
      const maxLeft = Math.max(0, canvasRect.width - panelRect.width);
      const maxTop = Math.max(0, canvasRect.height - panelRect.height);
      if (snap && !chaotic) {
        nextLeft = snapScalarToGrid(nextLeft, HUD_SNAP_GRID_PX);
        nextTop = snapScalarToGrid(nextTop, HUD_SNAP_GRID_PX);
      }
      nextLeft = clampHudScalar(nextLeft, 0, maxLeft);
      nextTop = clampHudScalar(nextTop, 0, maxTop);
      return {
        xPct: (nextLeft / canvasRect.width) * 100,
        yPct: (nextTop / canvasRect.height) * 100,
      };
    },
    [canvasRef, chaotic],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const next = computeFromPointer(clientX, clientY, true);
      dragRef.current = null;
      setLivePct(null);
      setZLift(false);
      if (next) {
        onCommit({
          ...position,
          xPct: next.xPct,
          yPct: next.yPct,
        });
      }
    },
    [computeFromPointer, onCommit, position],
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
  }, [locked]);

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
      onCommit({
        ...position,
        widthPx: clamped.widthPx,
        heightPx: clamped.heightPx,
      });
    },
    [onCommit, panelId, position],
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
  }, [locked]);

  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (locked || e.button !== 0) return;
      const canvas = canvasRef.current;
      const panel = rootRef.current;
      if (!canvas || !panel) return;
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

  const onTitlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (dragRef.current === null || e.pointerId !== dragRef.current.pointerId) return;
      const next = computeFromPointer(e.clientX, e.clientY, false);
      if (next) setLivePct(next);
    },
    [computeFromPointer],
  );

  const onTitlePointerUp = useCallback(
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
      const { width, height } = panel.getBoundingClientRect();
      resizeRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startW: width,
        startH: height,
      };
      setZLift(true);
      setLiveSize({ w: width, h: height });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [locked],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (resizeRef.current === null || e.pointerId !== resizeRef.current.pointerId) return;
      const start = resizeRef.current;
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
    },
    [endResize],
  );

  const dragContext = useMemo<IHudPanelDragContextValue>(
    () => ({
      locked,
      onTitlePointerDown,
      onTitlePointerMove,
      onTitlePointerUp,
    }),
    [locked, onTitlePointerDown, onTitlePointerMove, onTitlePointerUp],
  );

  return (
    <div
      ref={rootRef}
      className={[
        "hud-draggable-panel pointer-events-auto absolute flex max-w-full min-h-0 flex-col overflow-hidden",
        useDefaultWidth ? widthClass : "",
        effectiveH == null ? "max-h-[min(75vh,calc(100vh-9rem))]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${display.xPct}%`,
        top: `${display.yPct}%`,
        zIndex: zLift ? 30 : 10,
        ...(effectiveW != null ? { width: effectiveW } : {}),
        ...(effectiveH != null ? { height: effectiveH } : {}),
      }}
    >
      <HudPanelDragContext.Provider value={dragContext}>
        <div
          className={[
            "hud-panel-size-host flex min-h-0 flex-1 flex-col overflow-hidden",
            // Keep body content clear of the corner resize affordance (absolute sibling).
            !locked ? "pb-9 pr-9" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </HudPanelDragContext.Provider>
      {!locked ? (
        <div className="absolute bottom-0 right-0 z-20">
          <HudTip tip="Drag the corner to resize this panel; body scrolls when space is tight.">
            <button
              type="button"
              className="btn ghost icon-only sm cursor-nwse-resize border-0 touch-manipulation opacity-80 hover:opacity-100"
              aria-label="Resize panel"
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              onPointerCancel={onResizePointerUp}
            >
              <MoveDiagonal2 size={18} strokeWidth={2} className="text-accent" aria-hidden />
            </button>
          </HudTip>
        </div>
      ) : null}
    </div>
  );
}
