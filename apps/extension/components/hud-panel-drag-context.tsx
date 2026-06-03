import type { ReactElement } from "react";
import React, { createContext, useContext } from "react";
import { HudTip } from "./hud-tip";

export interface IHudPanelDragContextValue {
  locked: boolean;
  lockedDragAttemptBump: number;
}

export const HudPanelDragContext = createContext<IHudPanelDragContextValue | null>(null);

/** Elements that should not start a HUD panel drag (matches sticky-note exclusions). */
export function isHudPanelDragExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  return (
    target.closest("button, textarea, input, select, a, iframe, [data-hud-no-drag], label.btn") !=
    null
  );
}

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
      : "hud-scrollbar overflow-x-hidden overflow-y-auto";

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
  const { locked, lockedDragAttemptBump } = ctx;
  return (
    <HudTip
      tip={
        locked
          ? "Unlock layout in the header to move this panel"
          : "Drag an open area of this panel to move it on the canvas"
      }
      bump={locked ? lockedDragAttemptBump : undefined}
    >
      <TitleHeading locked={locked}>{children}</TitleHeading>
    </HudTip>
  );
}

/**
 * Inline title row (e.g. weather): heading only; drag the panel from any open area.
 */
export function HudPanelTitleInline({ children }: { children: React.ReactNode }) {
  const ctx = useHudPanelDrag();
  if (!ctx) {
    return <h3 className="m-0">{children}</h3>;
  }
  const { locked, lockedDragAttemptBump } = ctx;
  return (
    <HudTip
      tip={
        locked
          ? "Unlock layout in the header to move this panel"
          : "Drag an open area of this panel to move it on the canvas"
      }
      bump={locked ? lockedDragAttemptBump : undefined}
    >
      <TitleHeading locked={locked} className="m-0">
        {children}
      </TitleHeading>
    </HudTip>
  );
}

function TitleHeading({
  children,
  locked,
  className,
}: {
  children: React.ReactNode;
  locked: boolean;
  className?: string;
}): ReactElement {
  return (
    <h3 className={[className, locked ? "select-none opacity-60" : ""].filter(Boolean).join(" ")}>
      {children}
    </h3>
  );
}
