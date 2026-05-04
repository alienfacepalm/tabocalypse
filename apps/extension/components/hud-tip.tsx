import type { ReactElement } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * HUD-styled hover/focus-within hint (Space Mono). Supplemental for sighted users;
 * keep meaningful `aria-label` / visible text on the wrapped control.
 *
 * Renders the bubble in a portal so it is not clipped by HUD panels (`overflow-hidden`).
 */
export function HudTip({ tip, children }: { tip: string; children: ReactElement }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  const open = hovered || focusInside;

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 4;
    const estimatedH = 72;
    const belowTop = r.bottom + margin;
    const viewportH = window.innerHeight;
    const placeAbove = belowTop + estimatedH > viewportH - 8 && r.top > estimatedH + margin;

    setBubbleStyle({
      left: r.left + r.width / 2,
      top: placeAbove ? r.top - margin : belowTop,
      transform: placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setBubbleStyle(null);
      return;
    }
    measure();
    const onChange = () => {
      measure();
    };
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [open, measure]);

  const showFromPointer = useCallback(() => {
    measure();
    setHovered(true);
  }, [measure]);

  const showFromFocus = useCallback(() => {
    measure();
    setFocusInside(true);
  }, [measure]);

  const bubble =
    open && bubbleStyle != null
      ? createPortal(
          <span
            aria-hidden
            style={{
              position: "fixed",
              left: bubbleStyle.left,
              top: bubbleStyle.top,
              transform: bubbleStyle.transform,
              zIndex: 10_000,
            }}
            className="pointer-events-none w-max max-w-[min(14rem,calc(100vw-2rem))] whitespace-normal border border-accent bg-btn-bg px-2 py-1 text-center font-display text-[0.65rem] font-bold uppercase leading-snug tracking-widest text-accent shadow-[3px_3px_0_0_var(--color-accent)]"
          >
            {tip}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={wrapRef}
        className="inline-flex max-w-full align-middle"
        onPointerEnter={showFromPointer}
        onPointerLeave={() => {
          setHovered(false);
        }}
        onFocus={showFromFocus}
        onBlur={() => {
          setFocusInside(false);
        }}
      >
        {children}
      </div>
      {bubble}
    </>
  );
}
