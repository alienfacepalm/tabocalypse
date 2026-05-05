import type { ReactElement } from "react";
import React, { createContext, useContext } from "react";
import { HudTip } from "./hud-tip";

export interface IHudPanelDragContextValue {
  locked: boolean;
  onTitlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onTitlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onTitlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
}

export const HudPanelDragContext = createContext<IHudPanelDragContextValue | null>(null);

export function useHudPanelDrag(): IHudPanelDragContextValue | null {
  return useContext(HudPanelDragContext);
}

/** Scrollable body under a HUD panel title (flex child with min-height 0). */
export function HudPanelBody({
  children,
  className,
  sizeToContent,
  bodyOverflow,
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, do not stretch to fill leftover HUD slot height — size to children and only scroll
   * when taller than the cap (used for draggable note panels without a saved pixel height).
   */
  sizeToContent?: boolean;
  /** When false, hides body scrollbars; callers wrap overflow content for targeted scrolling. */
  bodyOverflow?: boolean;
}) {
  const scrollCls =
    bodyOverflow === false
      ? "overflow-x-hidden overflow-y-hidden"
      : "overflow-x-hidden overflow-y-auto";

  return (
    <div
      className={[
        sizeToContent
          ? `flex max-h-[min(70vh,calc(100vh-12rem))] flex-col flex-none ${scrollCls} min-h-0`
          : `min-h-0 flex-1 ${scrollCls}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/**
 * Panel title for draggable HUD cards (full-width `.card h3` row).
 * Outside {@link HudPanelDragContext}, renders a plain heading with the same card styles.
 */
export function HudPanelTitle({ children }: { children: React.ReactNode }) {
  const ctx = useHudPanelDrag();
  if (!ctx) {
    return <h3>{children}</h3>;
  }
  const { locked, onTitlePointerDown, onTitlePointerMove, onTitlePointerUp } = ctx;
  return (
    <HudTip
      tip={
        locked
          ? "Unlock layout in the header to move this panel"
          : "Drag the title bar to move this panel on the canvas"
      }
    >
      <TitleHeading
        locked={locked}
        onTitlePointerDown={onTitlePointerDown}
        onTitlePointerMove={onTitlePointerMove}
        onTitlePointerUp={onTitlePointerUp}
      >
        {children}
      </TitleHeading>
    </HudTip>
  );
}

/**
 * Inline title (e.g. weather): drag handle on the word only, not adjacent toolbar controls.
 */
export function HudPanelTitleInline({ children }: { children: React.ReactNode }) {
  const ctx = useHudPanelDrag();
  if (!ctx) {
    return <h3 className="m-0">{children}</h3>;
  }
  const { locked, onTitlePointerDown, onTitlePointerMove, onTitlePointerUp } = ctx;
  return (
    <HudTip
      tip={
        locked
          ? "Unlock layout in the header to move this panel"
          : "Drag the title bar to move this panel on the canvas"
      }
    >
      <TitleHeading
        locked={locked}
        className="m-0"
        onTitlePointerDown={onTitlePointerDown}
        onTitlePointerMove={onTitlePointerMove}
        onTitlePointerUp={onTitlePointerUp}
      >
        {children}
      </TitleHeading>
    </HudTip>
  );
}

function TitleHeading({
  children,
  locked,
  className,
  onTitlePointerDown,
  onTitlePointerMove,
  onTitlePointerUp,
}: {
  children: React.ReactNode;
  locked: boolean;
  className?: string;
  onTitlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onTitlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onTitlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
}): ReactElement {
  const cursor = locked
    ? "cursor-not-allowed select-none touch-manipulation opacity-60"
    : "cursor-grab select-none touch-manipulation active:cursor-grabbing";
  return (
    <h3
      className={[className, cursor].filter(Boolean).join(" ")}
      aria-label={locked ? "Panel layout locked" : "Drag title bar to move panel"}
      onPointerDown={onTitlePointerDown}
      onPointerMove={onTitlePointerMove}
      onPointerUp={onTitlePointerUp}
      onPointerCancel={onTitlePointerUp}
    >
      {children}
    </h3>
  );
}
