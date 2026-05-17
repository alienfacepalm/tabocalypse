import { useEffect } from "react";
import type { RefObject } from "react";
import { getHudLayoutMetrics, measureHudCanvasSize } from "../lib/hud-layout";
import { useHudPlacement } from "./hud-placement-context";

/** Keeps shared layout metrics in sync with HUD canvas size (browser width/height changes). */
export function HudLayoutMetricsSync({
  canvasRef,
  enabled,
}: {
  canvasRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}): null {
  const { setLayoutMetrics } = useHudPlacement();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) {
      setLayoutMetrics(null);
      return;
    }

    const update = (): void => {
      const { widthPx, heightPx } = measureHudCanvasSize(canvas);
      setLayoutMetrics(getHudLayoutMetrics(widthPx, heightPx));
    };

    update();
    const ro = new ResizeObserver(() => {
      update();
    });
    ro.observe(canvas);
    window.addEventListener("resize", update);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      setLayoutMetrics(null);
    };
  }, [canvasRef, enabled, setLayoutMetrics]);

  return null;
}
