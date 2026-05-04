import { GripVertical } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  HUD_PANEL_WIDTH_CLASSES,
  HUD_SNAP_GRID_PX,
  type IHudPanelPosition,
  type THudPanelId,
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
  const [zLift, setZLift] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originLeftCanvasPx: number;
    originTopCanvasPx: number;
  } | null>(null);

  const display = livePct ?? position;
  const widthClass = HUD_PANEL_WIDTH_CLASSES[panelId];

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
      if (next) onCommit(next);
    },
    [computeFromPointer, onCommit],
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

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
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
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current === null || e.pointerId !== dragRef.current.pointerId) return;
    const next = computeFromPointer(e.clientX, e.clientY, false);
    if (next) setLivePct(next);
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current === null || e.pointerId !== dragRef.current.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    endDrag(e.clientX, e.clientY);
  };

  return (
    <div
      ref={rootRef}
      className={`hud-draggable-panel pointer-events-auto absolute ${widthClass}`}
      style={{
        left: `${display.xPct}%`,
        top: `${display.yPct}%`,
        zIndex: zLift ? 30 : 10,
      }}
    >
      <button
        type="button"
        className={`btn ghost icon-only sm hud-drag-handle ${locked ? "opacity-40" : ""}`}
        aria-label={locked ? "Panel layout locked" : "Drag to move panel"}
        title={locked ? "Unlock layout in the header to rearrange" : "Drag to move"}
        disabled={locked}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <GripVertical size={18} strokeWidth={2} aria-hidden />
      </button>
      {children}
    </div>
  );
}
