import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { IHudGridDropHighlight, IHudLayoutMetrics } from "../lib/hud-layout";

interface IHudPlacementContextValue {
  layoutMetrics: IHudLayoutMetrics | null;
  setLayoutMetrics: (metrics: IHudLayoutMetrics | null) => void;
  dropHighlight: IHudGridDropHighlight | null;
  setDropHighlight: (highlight: IHudGridDropHighlight | null) => void;
}

const HudPlacementContext = createContext<IHudPlacementContextValue | null>(null);

export function HudPlacementProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [layoutMetrics, setLayoutMetricsState] = useState<IHudLayoutMetrics | null>(null);
  const [dropHighlight, setDropHighlightState] = useState<IHudGridDropHighlight | null>(null);

  const setLayoutMetrics = useCallback((metrics: IHudLayoutMetrics | null) => {
    setLayoutMetricsState(metrics);
  }, []);

  const setDropHighlight = useCallback((highlight: IHudGridDropHighlight | null) => {
    setDropHighlightState(highlight);
  }, []);

  const value = useMemo(
    () => ({
      layoutMetrics,
      setLayoutMetrics,
      dropHighlight,
      setDropHighlight,
    }),
    [dropHighlight, layoutMetrics, setDropHighlight, setLayoutMetrics],
  );

  return <HudPlacementContext.Provider value={value}>{children}</HudPlacementContext.Provider>;
}

export function useHudPlacement(): IHudPlacementContextValue {
  const ctx = useContext(HudPlacementContext);
  if (!ctx) {
    throw new Error("useHudPlacement must be used within HudPlacementProvider");
  }
  return ctx;
}

/** No-op when outside provider (tests or isolated stories). */
export function useHudPlacementOptional(): IHudPlacementContextValue | null {
  return useContext(HudPlacementContext);
}
