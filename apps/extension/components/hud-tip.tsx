import type {
  FocusEvent as ReactFocusEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Hit-test padding so pointer gaps between trigger and bubble do not false-dismiss. */
const HUD_TIP_HIT_PAD_PX = 8;

/** Poll while hover-open; pointer events can lie around disabled controls / portal bubbles. */
const HUD_TIP_POINTER_POLL_MS = 100;

function rectContainsClientPoint(
  r: DOMRect,
  clientX: number,
  clientY: number,
  padPx: number,
): boolean {
  return (
    clientX >= r.left - padPx &&
    clientX <= r.right + padPx &&
    clientY >= r.top - padPx &&
    clientY <= r.bottom + padPx
  );
}

/**
 * HUD-styled hover/focus-within hint (Space Mono). Supplemental for sighted users;
 * keep meaningful `aria-label` / visible text on the wrapped control.
 *
 * Renders the bubble in a portal so it is not clipped by HUD panels (`overflow-hidden`).
 */
export function HudTip({
  tip,
  children,
  bump,
  bumpDurationMs = 1600,
}: {
  tip: string;
  children: ReactElement;
  /**
   * Incrementing value that forces the tooltip open briefly.
   * Useful for “you tried something disabled” nudges (e.g. locked drag handles).
   */
  bump?: number;
  bumpDurationMs?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  const open = hovered || focusInside || forcedOpen;

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

  useEffect(() => {
    if (!bump) return;
    measure();
    setForcedOpen(true);
    const t = window.setTimeout(() => {
      setForcedOpen(false);
    }, bumpDurationMs);
    return () => {
      window.clearTimeout(t);
    };
  }, [bump, bumpDurationMs, measure]);

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

  /**
   * Track latest pointer position while hover-driven tooltip is open (capture phase so disabled
   * descendants still update coords).
   */
  useEffect(() => {
    if (!hovered) return;
    const onMove = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, true);
    return () => {
      window.removeEventListener("pointermove", onMove, true);
    };
  }, [hovered]);

  /**
   * Timer hit-test: `pointerleave` / hit-target checks miss disabled controls and portal tooltips.
   * Compare cursor to trigger + bubble rects until pointer leaves both (with padding).
   */
  useEffect(() => {
    if (!hovered) return;
    const tick = () => {
      const pt = lastPointerRef.current;
      const wrap = wrapRef.current;
      if (!pt || !wrap) return;
      const wr = wrap.getBoundingClientRect();
      const inWrap = rectContainsClientPoint(wr, pt.x, pt.y, HUD_TIP_HIT_PAD_PX);
      const bubble = bubbleRef.current;
      const br = bubble?.getBoundingClientRect();
      const inBubble =
        br != null ? rectContainsClientPoint(br, pt.x, pt.y, HUD_TIP_HIT_PAD_PX) : false;
      if (!inWrap && !inBubble) {
        setHovered(false);
      }
    };
    tick();
    const id = window.setInterval(tick, HUD_TIP_POINTER_POLL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [hovered]);

  const showFromPointer = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      measure();
      setHovered(true);
    },
    [measure],
  );

  /** Mouse clicks focus buttons too; `:focus-visible` is false then, so we avoid “stuck” tooltips. */
  const showFromFocus = useCallback(
    (e: ReactFocusEvent<HTMLDivElement>) => {
      const el = e.target;
      if (!(el instanceof Element)) return;
      try {
        if (!el.matches(":focus-visible")) return;
      } catch {
        return;
      }
      measure();
      setFocusInside(true);
    },
    [measure],
  );

  const bubble =
    open && bubbleStyle != null
      ? createPortal(
          <span
            ref={bubbleRef}
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
