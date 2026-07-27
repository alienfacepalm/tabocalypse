import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeVirtualWindow } from "../lib/hud-virtual-window";

export interface IHudVirtualListProps<TItem> {
  items: readonly TItem[];
  itemHeight: number;
  /** Stable key for each item. */
  getItemKey: (item: TItem, index: number) => string | number;
  renderItem: (item: TItem, index: number) => React.ReactNode;
  className?: string;
  /** Called when scroll approaches the end (infinite load). */
  onNearEnd?: () => void;
  /** Distance from bottom (px) that triggers onNearEnd. */
  nearEndPx?: number;
  /** Role for the scroll container (default list). */
  role?: React.AriaRole;
  "aria-label"?: string;
}

/**
 * Fixed-row-height virtual list. Only mounts rows in the visible window (+ overscan).
 * Fills the parent height (`min-h-0 flex-1`); parent must be a flex column with bounded height.
 */
export function HudVirtualList<TItem>({
  items,
  itemHeight,
  getItemKey,
  renderItem,
  className,
  onNearEnd,
  nearEndPx = 120,
  role = "list",
  "aria-label": ariaLabel,
}: IHudVirtualListProps<TItem>): React.JSX.Element {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const nearEndArmedRef = useRef(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      setViewportHeight(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const window = useMemo(
    () =>
      computeVirtualWindow({
        scrollTop,
        viewportHeight,
        itemCount: items.length,
        itemHeight,
      }),
    [itemHeight, items.length, scrollTop, viewportHeight],
  );

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      setScrollTop(el.scrollTop);
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining <= nearEndPx) {
        if (nearEndArmedRef.current) {
          nearEndArmedRef.current = false;
          onNearEnd?.();
        }
      } else {
        nearEndArmedRef.current = true;
      }
    },
    [nearEndPx, onNearEnd],
  );

  // Re-arm when content grows or viewport changes; only fire when already near the end.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !onNearEnd) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= nearEndPx) {
      if (nearEndArmedRef.current) {
        nearEndArmedRef.current = false;
        onNearEnd();
      }
    } else {
      nearEndArmedRef.current = true;
    }
  }, [items.length, nearEndPx, onNearEnd, viewportHeight]);

  const slice = items.slice(window.startIndex, window.endIndex);

  return (
    <div
      ref={scrollerRef}
      className={["hud-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto", className]
        .filter(Boolean)
        .join(" ")}
      onScroll={onScroll}
      role={role}
      aria-label={ariaLabel}
    >
      <div className="relative w-full" style={{ height: window.totalHeight }}>
        <div
          className="absolute left-0 right-0 top-0"
          style={{ transform: `translateY(${window.offsetY}px)` }}
        >
          {slice.map((item, i) => {
            const index = window.startIndex + i;
            return (
              <div
                key={getItemKey(item, index)}
                role="listitem"
                className="box-border"
                style={{ height: itemHeight }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
