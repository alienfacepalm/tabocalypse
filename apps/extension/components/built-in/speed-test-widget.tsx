/**
 * Built-in HUD panel: approximate down/up throughput via Cloudflare public endpoints.
 */
import { Gauge } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { runCloudflareSpeedTest } from "../../lib/speed-test/run-cloudflare-speed-test";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";

type TSpeedPhase = "idle" | "downloading" | "uploading" | "done" | "error";

export function SpeedTestWidget({ displayLocale }: { displayLocale: string }) {
  const [phase, setPhase] = useState<TSpeedPhase>("idle");
  const [downMbps, setDownMbps] = useState<number | null>(null);
  const [upMbps, setUpMbps] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mbpsFmt = useMemo(
    () =>
      new Intl.NumberFormat(displayLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [displayLocale],
  );

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const run = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setErr(null);
    setDownMbps(null);
    setUpMbps(null);
    setPhase("downloading");
    try {
      const result = await runCloudflareSpeedTest({
        signal: ac.signal,
        onPhase: (p) => setPhase(p === "download" ? "downloading" : "uploading"),
      });
      setDownMbps(result.downloadMbps);
      setUpMbps(result.uploadMbps);
      setPhase("done");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setPhase("idle");
        return;
      }
      setErr(e instanceof Error ? e.message : "Speed test failed");
      setPhase("error");
    }
  };

  return (
    <section className="card">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Gauge size={20} strokeWidth={2} className="shrink-0 text-accent" aria-hidden />
            <HudPanelTitleInline>Speed test</HudPanelTitleInline>
          </div>
        </div>
        <p className="muted mt-1 text-xs leading-tight">
          Approximate Mbps only: ~5 MB download then ~2 MB upload via Cloudflare when you press Go.
        </p>
      </div>
      <HudPanelBody>
        <div className="flex min-w-0 flex-row items-stretch gap-3">
          <button
            type="button"
            className="btn primary min-h-[5.5rem] min-w-[6rem] flex-[1] basis-0 py-6 text-base tracking-widest disabled:opacity-60"
            disabled={phase === "downloading" || phase === "uploading"}
            aria-label="Run network speed test: download sample then upload sample through Cloudflare"
            onClick={() => void run()}
          >
            {phase === "downloading" ? "Downloading…" : phase === "uploading" ? "Uploading…" : "Go"}
          </button>

          <div className="flex min-h-[5.5rem] min-w-0 flex-[1.15] basis-0 flex-col justify-center gap-2 font-mono text-sm">
            <div className="flex items-baseline justify-between gap-3 border border-border bg-surface-weak px-3 py-2 shadow-[3px_3px_0px_0px_var(--color-accent)]">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-muted">
                Down
              </span>
              <span className="tabular-nums text-accent">
                {phase === "done" && downMbps != null ? (
                  <>
                    {mbpsFmt.format(downMbps)} <span className="text-muted">Mbps</span>
                  </>
                ) : phase === "downloading" || phase === "uploading" ? (
                  <span className="text-muted">…</span>
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
                {phase === "done" && upMbps != null ? (
                  <>
                    {mbpsFmt.format(upMbps)} <span className="text-muted">Mbps</span>
                  </>
                ) : phase === "downloading" || phase === "uploading" ? (
                  <span className="text-muted">…</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {phase === "downloading" || phase === "uploading" ? (
          <p className="muted mt-3 text-xs font-mono uppercase leading-tight">
            Do not close this tab while the test runs.
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
