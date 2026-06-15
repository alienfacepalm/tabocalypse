import { useEffect, useMemo, useState } from "react";
import {
  pickGlitchFalseVariant,
  resolveSystemStatusTelemetry,
  type ISystemStatusContext,
} from "../lib/system-status-line";

const TELEMETRY_REFRESH_MS = 3 * 60_000;
const CHAOS_SCRAMBLE_MS = 5_500;
const CHAOS_SCRAMBLE_HOLD_MS = 3_200;
const CHAOS_SCRAMBLE_FLICKER_MS = 70;

export function SystemStatusTagline({ ctx }: { ctx: ISystemStatusContext }) {
  const [telemetry, setTelemetry] = useState(() => resolveSystemStatusTelemetry(ctx));
  const [falseLabel, setFalseLabel] = useState("FALSE");
  const [scrambleTick, setScrambleTick] = useState(0);

  const chaosActive = ctx.preset === "chaos";

  const ctxKey = useMemo(
    () =>
      [
        ctx.preset,
        ctx.humorEnabled,
        ctx.humorIntensity,
        ctx.enabledWidgetCount,
        ctx.noteCount,
        ctx.openTodoCount,
        ctx.lightTheme,
      ].join("|"),
    [ctx],
  );

  useEffect(() => {
    if (!chaosActive) {
      setTelemetry("");
      return;
    }
    const refresh = (): void => {
      setTelemetry(resolveSystemStatusTelemetry(ctx));
    };
    refresh();
    const t = window.setInterval(refresh, TELEMETRY_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [chaosActive, ctx, ctxKey]);

  useEffect(() => {
    if (!chaosActive) {
      setFalseLabel("FALSE");
      return;
    }

    let holdTimer: number | undefined;
    let flickerTimer: number | undefined;

    const runScramble = (): void => {
      setScrambleTick((n) => n + 1);
      let flickerCount = 0;
      flickerTimer = window.setInterval(() => {
        setFalseLabel(pickGlitchFalseVariant(Date.now() + flickerCount));
        flickerCount += 1;
        if (flickerCount > 22) {
          window.clearInterval(flickerTimer);
          flickerTimer = undefined;
        }
      }, CHAOS_SCRAMBLE_FLICKER_MS);
      holdTimer = window.setTimeout(() => {
        if (flickerTimer !== undefined) {
          window.clearInterval(flickerTimer);
          flickerTimer = undefined;
        }
        setFalseLabel("FALSE");
      }, CHAOS_SCRAMBLE_HOLD_MS);
    };

    runScramble();
    const interval = window.setInterval(runScramble, CHAOS_SCRAMBLE_MS);
    return () => {
      window.clearInterval(interval);
      if (flickerTimer !== undefined) window.clearInterval(flickerTimer);
      if (holdTimer !== undefined) window.clearTimeout(holdTimer);
      setFalseLabel("FALSE");
    };
  }, [chaosActive]);

  if (ctx.preset === "focus") {
    return null;
  }

  if (ctx.preset === "balanced") {
    return (
      <p className="tagline tagline-balanced" aria-hidden>
        SYSTEM_STABLE: <span className="tagline-false-balanced">FALSE</span>
      </p>
    );
  }

  return (
    <p className="tagline tagline-chaos" aria-hidden data-scramble={scrambleTick}>
      SYSTEM_STABLE:{" "}
      <span className="tagline-false-chaos" data-text={falseLabel}>
        {falseLabel}
      </span>
      {telemetry ? <span className="tagline-telemetry"> · {telemetry}</span> : null}
    </p>
  );
}
