/**
 * Built-in HUD panel: approximate down/up throughput via Cloudflare public endpoints.
 */
import { Gauge } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  readSpeedTestLastRun,
  writeSpeedTestLastRun,
  type ISpeedTestLastRun,
} from "../../lib/speed-test/speed-test-last-run-cache";
import {
  runCloudflareSpeedTest,
  type ISpeedTestProgress,
  type TCloudflareSpeedPhase,
} from "../../lib/speed-test/run-cloudflare-speed-test";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";

type TSpeedPhase = "idle" | "running" | "done" | "error";

function phaseLabel(phase: TCloudflareSpeedPhase | null): string {
  switch (phase) {
    case "warmup-download":
      return "Warming up download…";
    case "download":
      return "Downloading…";
    case "warmup-upload":
      return "Warming up upload…";
    case "upload":
      return "Uploading…";
    default:
      return "Running…";
  }
}

function phaseProgressPct(progress: ISpeedTestProgress | null): number {
  if (!progress || progress.phaseTargetMs <= 0) return 0;
  return Math.min(100, (progress.elapsedInPhaseMs / progress.phaseTargetMs) * 100);
}

export function SpeedTestWidget({ displayLocale }: { displayLocale: string }) {
  const [phase, setPhase] = useState<TSpeedPhase>("idle");
  const [downMbps, setDownMbps] = useState<number | null>(null);
  const [upMbps, setUpMbps] = useState<number | null>(null);
  const [downLive, setDownLive] = useState<number | null>(null);
  const [upLive, setUpLive] = useState<number | null>(null);
  const [runProgress, setRunProgress] = useState<ISpeedTestProgress | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<ISpeedTestLastRun | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mbpsFmt = useMemo(
    () =>
      new Intl.NumberFormat(displayLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [displayLocale],
  );

  const running = phase === "running";
  const progressPct = phaseProgressPct(runProgress);

  useEffect(() => {
    let cancelled = false;
    void readSpeedTestLastRun().then((entry) => {
      if (!cancelled) setLastRun(entry);
    });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setRunProgress(null);
    setDownLive(null);
    setUpLive(null);
  };

  const run = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setErr(null);
    setDownMbps(null);
    setUpMbps(null);
    setDownLive(null);
    setUpLive(null);
    setRunProgress(null);
    setPhase("running");
    try {
      const result = await runCloudflareSpeedTest({
        signal: ac.signal,
        onProgress: (p) => {
          setRunProgress(p);
          if (p.downloadMbpsLive != null) setDownLive(p.downloadMbpsLive);
          if (p.uploadMbpsLive != null) setUpLive(p.uploadMbpsLive);
        },
      });
      setDownMbps(result.downloadMbps);
      setUpMbps(result.uploadMbps);
      setDownLive(result.downloadMbps);
      setUpLive(result.uploadMbps);
      const cached = await writeSpeedTestLastRun({
        downloadMbps: result.downloadMbps,
        uploadMbps: result.uploadMbps,
      });
      setLastRun(cached);
      setPhase("done");
      setRunProgress(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        stop();
        return;
      }
      setErr(e instanceof Error ? e.message : "Speed test failed");
      setPhase("error");
      setRunProgress(null);
    }
  };

  const showDown = running || phase === "done" ? (downLive ?? downMbps) : downMbps;
  const showUp = running || phase === "done" ? (upLive ?? upMbps) : upMbps;

  return (
    <section className="card flex flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Gauge size={20} strokeWidth={2} className="shrink-0 text-accent" aria-hidden />
            <HudPanelTitleInline>Speed test</HudPanelTitleInline>
          </div>
          {lastRun ? (
            <div
              className="text-right font-mono text-xs leading-tight"
              aria-label={`Last run: download ${mbpsFmt.format(lastRun.downloadMbps)} megabits per second, upload ${mbpsFmt.format(lastRun.uploadMbps)} megabits per second`}
            >
              <div className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
                Last run
              </div>
              <div className="tabular-nums">
                <span className="text-accent">{mbpsFmt.format(lastRun.downloadMbps)}</span>
                <span className="text-muted"> ↓ · </span>
                <span className="text-[var(--color-accent2)]">
                  {mbpsFmt.format(lastRun.uploadMbps)}
                </span>
                <span className="text-muted"> ↑ Mbps</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <HudPanelBody>
        {running ? (
          <div className="mb-3">
            <div className="flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-wide text-muted">
              <span>{phaseLabel(runProgress?.phase ?? null)}</span>
              <span className="tabular-nums">{Math.round(progressPct)}%</span>
            </div>
            <div
              className="mt-2 h-2 border border-border bg-surface-weak shadow-[3px_3px_0px_0px_var(--color-accent)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPct)}
              aria-label={phaseLabel(runProgress?.phase ?? null)}
            >
              <div
                className="h-full bg-accent transition-[width] duration-150 ease-linear"
                style={{ width: `${String(progressPct)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-row items-stretch gap-3">
          {running ? (
            <button
              type="button"
              className="btn min-h-[5.5rem] min-w-[6rem] flex-[1] basis-0 py-6 text-base tracking-widest"
              aria-label="Stop network speed test"
              onClick={stop}
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="btn primary min-h-[5.5rem] min-w-[6rem] flex-[1] basis-0 py-6 text-base tracking-widest disabled:opacity-60"
              aria-label="Run network speed test: warmup, download samples, then upload samples through Cloudflare"
              onClick={() => void run()}
            >
              Go
            </button>
          )}

          <div className="flex min-h-[5.5rem] min-w-0 flex-[1.15] basis-0 flex-col justify-center gap-2 font-mono text-sm">
            <div className="flex items-baseline justify-between gap-3 border border-border bg-surface-weak px-3 py-2 shadow-[3px_3px_0px_0px_var(--color-accent)]">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-muted">
                Down
              </span>
              <span className="tabular-nums text-accent">
                {showDown != null ? (
                  <>
                    {mbpsFmt.format(showDown)} <span className="text-muted">Mbps</span>
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border border-border bg-surface-weak px-3 py-2 shadow-[3px_3px_0px_0px_var(--color-accent2)]">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-muted">
                Up
              </span>
              <span className="tabular-nums text-[var(--color-accent2)]">
                {showUp != null ? (
                  <>
                    {mbpsFmt.format(showUp)} <span className="text-muted">Mbps</span>
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {running ? (
          <p className="muted mt-3 text-xs font-mono uppercase leading-tight">
            Do not close this tab while the test runs.
          </p>
        ) : null}

        {phase === "done" ? (
          <p className="muted mt-3 text-xs leading-tight">
            Result uses median throughput after connection warmup (first second of each phase
            ignored).
          </p>
        ) : null}

        {phase === "error" && err ? (
          <p className="mt-3 text-xs text-[var(--color-danger)] leading-tight" role="alert">
            {err}
          </p>
        ) : null}
      </HudPanelBody>
    </section>
  );
}
