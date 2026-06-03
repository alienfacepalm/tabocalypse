import { MoveDiagonal2 } from "lucide-react";
import type { PointerEvent } from "react";
import { HudTip } from "./hud-tip";

export function HudCornerResize({
  tip,
  ariaLabel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  tip: string;
  ariaLabel: string;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLButtonElement>) => void;
}): React.JSX.Element {
  return (
    <div className="corner-resize-host pointer-events-none z-20">
      <HudTip tip={tip} wrapClassName="pointer-events-auto">
        <button
          type="button"
          className="corner-resize-grip touch-manipulation"
          aria-label={ariaLabel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <MoveDiagonal2 size={14} strokeWidth={2.25} aria-hidden />
        </button>
      </HudTip>
    </div>
  );
}
