import React, { useMemo } from "react";
import { hudCanvasInteractableHeightPx, resolveHudDropTargetPct } from "../lib/hud-layout";
import { useHudPlacement } from "./hud-placement-context";

export function HudCanvasGrid({ visible }: { visible: boolean }): React.JSX.Element | null {
  const { layoutMetrics, dropHighlight } = useHudPlacement();

  const dropTargetPct = useMemo(() => {
    if (!dropHighlight || !layoutMetrics) return null;
    return resolveHudDropTargetPct(dropHighlight, layoutMetrics);
  }, [dropHighlight, layoutMetrics]);

  if (!visible || !layoutMetrics) {
    return null;
  }

  const { cols, rows, cellW, cellH, canvasW, canvasH } = layoutMetrics;
  const gridHeightPx = hudCanvasInteractableHeightPx(canvasH);

  return (
    <div
      className="hud-grid-overlay pointer-events-none absolute inset-0 z-[2] min-h-full min-w-full"
      aria-hidden
    >
      <svg
        className="hud-grid-lines pointer-events-none absolute left-0 top-0 h-full w-full"
        width={canvasW}
        height={gridHeightPx}
        viewBox={`0 0 ${canvasW} ${gridHeightPx}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * cellW}
            y1={0}
            x2={i * cellW}
            y2={gridHeightPx}
            className="hud-grid-pattern-stroke"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="6 5"
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, j) => (
          <line
            key={`h-${j}`}
            x1={0}
            y1={j * cellH}
            x2={canvasW}
            y2={j * cellH}
            className="hud-grid-pattern-stroke"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="6 5"
          />
        ))}
      </svg>
      {dropTargetPct ? (
        <div
          className="hud-grid-drop-target pointer-events-none absolute"
          style={{
            left: `${dropTargetPct.leftPct}%`,
            top: `${dropTargetPct.topPct}%`,
            width: `${dropTargetPct.widthPct}%`,
            height: `${dropTargetPct.heightPct}%`,
          }}
        />
      ) : null}
    </div>
  );
}
