import { useEffect, useMemo, useState } from "react";
import {
  pickGlitchFalseVariant,
  resolveSystemStatusTelemetry,
  type ISystemStatusContext,
} from "../lib/system-status-line";

const TELEMETRY_REFRESH_MS = 3 * 60_000;
const CHAOS_SCRAMBLE_MS = 8_000;
const CHAOS_SCRAMBLE_HOLD_MS = 2_800;
const CHAOS_SCRAMBLE_FLICKER_MS = 90;

export function SystemStatusTagline({ ctx }: { ctx: ISystemStatusContext }) {
  const [telemetry, setTelemetry] = useState(() => resolveSystemStatusTelemetry(ctx));
  const [falseLabel, setFalseLabel] = useState("FALSE");
  const [scrambleTick, setScrambleTick] = useState(0);

  const chaosActive = ctx.chaotic && !ctx.focusMode;

  const ctxKey = useMemo(
    () =>
      [
        ctx.focusMode,
        ctx.chaotic,
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
    if (ctx.focusMode) {
      setTelemetry("");
      return;
    }
    const refresh = (): void => {
      setTelemetry(resolveSystemStatusTelemetry(ctx));
    };
    refresh();
    const t = window.setInterval(refresh, TELEMETRY_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [ctx, ctxKey]);

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
        if (flickerCount > 14) {
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

  if (ctx.focusMode) {
    return (
      <p className="tagline tagline-focus" aria-hidden>
        SYSTEM_STABLE: FALSE
      </p>
    );
  }

  return (
    <p
      className={chaosActive ? "tagline tagline-chaos" : "tagline"}
      aria-hidden
      data-scramble={chaosActive ? scrambleTick : undefined}
    >
      SYSTEM_STABLE:{" "}
      <span
        className={chaosActive ? "tagline-false tagline-false-chaos" : "tagline-false"}
        data-text={falseLabel}
      >
        {falseLabel}
      </span>
      {telemetry ? <span className="tagline-telemetry"> · {telemetry}</span> : null}
    </p>
  );
}
