import { List, Pin, PinOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { measureHudCanvasSize } from "../lib/hud-layout";
import { clampStickyNoteSize, type IStickyNotePosition } from "../lib/settings";
import { HudCornerResize } from "./hud-corner-resize";
import { HudTip } from "./hud-tip";

const STICKY_Z_LIFT = 100;

function isStickyNoteDragExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  return target.closest("button, textarea, input, select, a, [data-sticky-no-drag]") != null;
}

function stickyLayoutChanged(a: IStickyNotePosition, b: IStickyNotePosition): boolean {
  return a.xPx !== b.xPx || a.yPx !== b.yPx || a.widthPx !== b.widthPx || a.heightPx !== b.heightPx;
}

export function DraggableStickyNote({
  canvasRef,
  position,
  pinned,
  zIndexBase,
  onCommit,
  onTogglePin,
  onToggleNotesList,
  notesListPanelVisible,
  onFocus,
  children,
}: {
  canvasRef: React.RefObject<HTMLElement | null>;
  position: IStickyNotePosition;
  pinned: boolean;
  zIndexBase: number;
  onCommit: (next: IStickyNotePosition) => void;
  onTogglePin: () => void;
  onToggleNotesList: () => void;
  notesListPanelVisible: boolean;
  onFocus?: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [liveLayout, setLiveLayout] = useState<IStickyNotePosition | null>(null);
  const [zLift, setZLift] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originLeftPx: number;
    originTopPx: number;
    widthPx: number;
    heightPx: number;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startW: number;
    startH: number;
    xPx: number;
    yPx: number;
  } | null>(null);

  const display = liveLayout ?? position;

  const computeDragLayout = useCallback(
    (clientX: number, clientY: number): IStickyNotePosition | null => {
      const canvas = canvasRef.current;
      const start = dragRef.current;
      if (!canvas || !start) return null;
      const { widthPx: canvasW, heightPx: canvasH } = measureHudCanvasSize(canvas);
      const dx = clientX - start.startClientX;
      const dy = clientY - start.startClientY;
      const maxLeft = Math.max(0, canvasW - start.widthPx);
      const maxTop = Math.max(0, canvasH - start.heightPx);
      const xPx = Math.min(maxLeft, Math.max(0, Math.round(start.originLeftPx + dx)));
      const yPx = Math.min(maxTop, Math.max(0, Math.round(start.originTopPx + dy)));
      return { xPx, yPx, widthPx: start.widthPx, heightPx: start.heightPx };
    },
    [canvasRef],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const next = computeDragLayout(clientX, clientY);
      dragRef.current = null;
      setLiveLayout(null);
      setZLift(false);
      if (next && stickyLayoutChanged(next, position)) {
        onCommit(next);
      }
    },
    [computeDragLayout, onCommit, position],
  );

  const endResize = useCallback(
    (clientX: number, clientY: number) => {
      const start = resizeRef.current;
      if (!start) return;
      const canvas = canvasRef.current;
      const canvasW = canvas ? measureHudCanvasSize(canvas).widthPx : undefined;
      const canvasH = canvas ? measureHudCanvasSize(canvas).heightPx : undefined;
      const dx = clientX - start.startClientX;
      const dy = clientY - start.startClientY;
      const sized = clampStickyNoteSize(start.startW + dx, start.startH + dy, {
        canvasW,
        canvasH,
        xPx: start.xPx,
        yPx: start.yPx,
      });
      resizeRef.current = null;
      setLiveLayout(null);
      setZLift(false);
      const next: IStickyNotePosition = {
        xPx: start.xPx,
        yPx: start.yPx,
        ...sized,
      };
      if (stickyLayoutChanged(next, position)) {
        onCommit(next);
      }
    },
    [canvasRef, onCommit, position],
  );

  useEffect(() => {
    const onWinPointerUp = (e: PointerEvent) => {
      if (dragRef.current !== null && e.pointerId === dragRef.current.pointerId) {
        endDrag(e.clientX, e.clientY);
      }
      if (resizeRef.current !== null && e.pointerId === resizeRef.current.pointerId) {
        endResize(e.clientX, e.clientY);
      }
    };
    window.addEventListener("pointerup", onWinPointerUp);
    window.addEventListener("pointercancel", onWinPointerUp);
    return () => {
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("pointercancel", onWinPointerUp);
    };
  }, [endDrag, endResize]);

  const onDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pinned) return;
      if (e.button !== 0) return;
      if (isStickyNoteDragExcluded(e.target)) return;
      const canvas = canvasRef.current;
      if (!canvas || !rootRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      onFocus?.();
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originLeftPx: display.xPx,
        originTopPx: display.yPx,
        widthPx: display.widthPx,
        heightPx: display.heightPx,
      };
      setZLift(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canvasRef, display.heightPx, display.widthPx, display.xPx, display.yPx, onFocus, pinned],
  );

  const onDragPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const start = dragRef.current;
      if (start === null || e.pointerId !== start.pointerId) return;
      const next = computeDragLayout(e.clientX, e.clientY);
      if (next) setLiveLayout(next);
    },
    [computeDragLayout],
  );

  const onDragPointerUp = useCallback(
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
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      onFocus?.();
      resizeRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startW: display.widthPx,
        startH: display.heightPx,
        xPx: display.xPx,
        yPx: display.yPx,
      };
      setZLift(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [display.heightPx, display.widthPx, display.xPx, display.yPx, onFocus],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const start = resizeRef.current;
      if (start === null || e.pointerId !== start.pointerId) return;
      const canvas = canvasRef.current;
      const canvasW = canvas ? measureHudCanvasSize(canvas).widthPx : undefined;
      const canvasH = canvas ? measureHudCanvasSize(canvas).heightPx : undefined;
      const dx = e.clientX - start.startClientX;
      const dy = e.clientY - start.startClientY;
      const sized = clampStickyNoteSize(start.startW + dx, start.startH + dy, {
        canvasW,
        canvasH,
        xPx: start.xPx,
        yPx: start.yPx,
      });
      setLiveLayout({ xPx: start.xPx, yPx: start.yPx, ...sized });
    },
    [canvasRef],
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
    },
    [endResize],
  );

  const resizeControl = (
    <HudCornerResize
      tip="Drag the corner to resize this sticky note"
      ariaLabel="Resize sticky note"
      onPointerDown={onResizePointerDown}
      onPointerMove={onResizePointerMove}
      onPointerUp={onResizePointerUp}
    />
  );

  return (
    <div
      ref={rootRef}
      className="sticky-note-host pointer-events-auto absolute"
      style={{
        left: display.xPx,
        top: display.yPx,
        width: display.widthPx,
        height: display.heightPx,
        zIndex: zIndexBase + (zLift ? STICKY_Z_LIFT : 0),
      }}
    >
      <div
        className={[
          "sticky-note flex h-full min-h-0 flex-col",
          zLift ? "sticky-note-dragging" : "",
          pinned ? "sticky-note-pinned" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <div className="sticky-note-tack-row shrink-0">
          <HudTip
            tip={
              pinned
                ? "Unpin to move this sticky note"
                : "Pin in place (locks position on resize; you can still resize)"
            }
          >
            <button
              type="button"
              className={["sticky-note-tack btn", pinned ? "primary" : "ghost", "icon-only", "sm"]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={pinned}
              aria-label={pinned ? "Unpin sticky note" : "Pin sticky note in place"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onTogglePin}
            >
              {pinned ? (
                <PinOff size={16} strokeWidth={2.25} aria-hidden />
              ) : (
                <Pin size={16} strokeWidth={2.25} className="rotate-45" aria-hidden />
              )}
            </button>
          </HudTip>
          <HudTip
            tip={notesListPanelVisible ? "Hide the notes list panel" : "Show the notes list panel"}
          >
            <button
              type="button"
              className={[
                "sticky-note-list btn",
                notesListPanelVisible ? "primary" : "ghost",
                "icon-only",
                "sm",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={notesListPanelVisible}
              aria-label={notesListPanelVisible ? "Hide notes list panel" : "Show notes list panel"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onToggleNotesList}
            >
              <List size={16} strokeWidth={2} aria-hidden />
            </button>
          </HudTip>
        </div>
        <div className="sticky-note-body min-h-0 flex-1">{children}</div>
        {resizeControl}
      </div>
    </div>
  );
}
