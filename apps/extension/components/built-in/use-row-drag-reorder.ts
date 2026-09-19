import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { moveListItem } from "../../lib/move-list-item";

const ROW_SELECTOR = "[data-reorder-row-id]";

export interface IRowDragReorderGripProps {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  "data-reorder-grip-id": string;
}

/**
 * Drag-to-reorder for a short vertical list of similar-height rows.
 *
 * Rows carry `data-reorder-row-id`; a grip element spreads `gripProps(id)`. The grip must be a
 * `<button>` so HUD panel dragging ignores it. While dragging, `orderedIds` is a live preview;
 * `onCommit` fires once on drop (or per Arrow key press) and only when the order changed.
 */
export function useRowDragReorder({
  ids,
  listRef,
  onCommit,
}: {
  ids: readonly string[];
  listRef: React.RefObject<HTMLElement | null>;
  onCommit: (orderedIds: string[]) => void;
}): {
  orderedIds: readonly string[];
  draggingId: string | null;
  gripProps: (id: string) => IRowDragReorderGripProps;
} {
  const [preview, setPreview] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const previewRef = useRef<string[] | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const stopDragRef = useRef<(() => void) | null>(null);
  const refocusGripIdRef = useRef<string | null>(null);

  const setPreviewOrder = useCallback((next: string[] | null) => {
    previewRef.current = next;
    setPreview(next);
  }, []);

  const indexFromPointer = useCallback(
    (clientY: number): number | null => {
      const rows = listRef.current?.querySelectorAll<HTMLElement>(ROW_SELECTOR);
      if (!rows || rows.length === 0) return null;
      const top = rows[0]!.getBoundingClientRect().top;
      const bottom = rows[rows.length - 1]!.getBoundingClientRect().bottom;
      const rowHeight = (bottom - top) / rows.length;
      if (rowHeight <= 0) return null;
      return Math.min(Math.max(Math.floor((clientY - top) / rowHeight), 0), rows.length - 1);
    },
    [listRef],
  );

  const startDrag = useCallback(
    (id: string) => {
      stopDragRef.current?.();
      setDraggingId(id);
      setPreviewOrder([...idsRef.current]);

      const onMove = (e: PointerEvent): void => {
        const order = previewRef.current;
        const to = indexFromPointer(e.clientY);
        if (!order || to === null) return;
        const from = order.indexOf(id);
        if (from < 0 || from === to) return;
        setPreviewOrder(moveListItem(order, from, to));
      };
      const finish = (commit: boolean): void => {
        stopDragRef.current?.();
        const order = previewRef.current;
        setDraggingId(null);
        setPreviewOrder(null);
        if (commit && order && order.some((rowId, i) => rowId !== idsRef.current[i])) {
          onCommitRef.current(order);
        }
      };
      const onUp = (): void => finish(true);
      const onCancel = (): void => finish(false);
      const onKey = (e: KeyboardEvent): void => {
        if (e.key === "Escape") finish(false);
      };

      // Window listeners, not pointer capture: React moves row nodes while reordering, and a
      // moved node loses its capture mid-drag.
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKey);
      stopDragRef.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKey);
        stopDragRef.current = null;
      };
    },
    [indexFromPointer, setPreviewOrder],
  );

  useEffect(() => () => stopDragRef.current?.(), []);

  const orderedIds = preview ?? ids;
  const orderKey = orderedIds.join("\n");

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Keep the dragged row in view so a long list scrolls as the row travels.
    if (draggingId) {
      for (const row of list.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
        if (row.dataset.reorderRowId === draggingId) row.scrollIntoView({ block: "nearest" });
      }
    }
    // A keyboard move re-inserts the row, which drops focus from its grip.
    const refocusId = refocusGripIdRef.current;
    if (refocusId) {
      refocusGripIdRef.current = null;
      for (const grip of list.querySelectorAll<HTMLElement>("[data-reorder-grip-id]")) {
        if (grip.dataset.reorderGripId === refocusId) grip.focus();
      }
    }
  }, [orderKey, draggingId, listRef]);

  const gripProps = useCallback(
    (id: string): IRowDragReorderGripProps => ({
      "data-reorder-grip-id": id,
      onPointerDown: (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        startDrag(id);
      },
      onKeyDown: (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const current = [...idsRef.current];
        const from = current.indexOf(id);
        const next = moveListItem(current, from, from + (e.key === "ArrowUp" ? -1 : 1));
        if (next.every((rowId, i) => rowId === current[i])) return;
        refocusGripIdRef.current = id;
        onCommitRef.current(next);
      },
    }),
    [startDrag],
  );

  return { orderedIds, draggingId, gripProps };
}
