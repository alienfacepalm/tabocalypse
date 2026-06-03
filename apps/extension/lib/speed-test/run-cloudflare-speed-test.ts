/**
 * Duration-based download + upload throughput using Cloudflare's public speed-test endpoints.
 * User-initiated only; see Widgets → Speed test.
 */

const CF_SPEED_DOWN = "https://speed.cloudflare.com/__down";
const CF_SPEED_UP = "https://speed.cloudflare.com/__up";

/** Warm connection before measured download samples. */
export const SPEED_TEST_DOWNLOAD_WARMUP_MS = 1_500;
/** Measured download window after warmup. */
export const SPEED_TEST_DOWNLOAD_MEASURE_MS = 10_000;
/** Small throwaway upload before measured upload samples. */
export const SPEED_TEST_UPLOAD_WARMUP_BYTES = 256_000;
/** Measured upload window after warmup POST. */
export const SPEED_TEST_UPLOAD_MEASURE_MS = 5_000;
/** Rolling sample interval during measured phases. */
export const SPEED_TEST_SAMPLE_INTERVAL_MS = 250;
/** Drop this much of measured download samples at the start (TCP ramp inside the window). */
export const SPEED_TEST_DISCARD_MEASURE_MS = 1_000;
/** Upload samples are per chunk; discard the first N chunk samples after warmup POST. */
export const SPEED_TEST_UPLOAD_DISCARD_SAMPLES = 2;

const DOWNLOAD_CHUNK_BYTES = 5_000_000;
const UPLOAD_CHUNK_BYTES = 1_000_000;

export type TCloudflareSpeedPhase = "warmup-download" | "download" | "warmup-upload" | "upload";

export interface ICloudflareSpeedTestResult {
  downloadMbps: number;
  uploadMbps: number;
}

export interface ISpeedTestProgress {
  phase: TCloudflareSpeedPhase;
  /** Elapsed time in the current phase (ms). */
  elapsedInPhaseMs: number;
  /** Target duration for the current phase (ms). */
  phaseTargetMs: number;
  downloadMbpsLive: number | null;
  uploadMbpsLive: number | null;
}

/** Convert bytes per second to megabits per second (decimal Mbps). */
export function bytesPerSecondToMbps(bytesPerSecond: number): number {
  return (bytesPerSecond * 8) / 1_000_000;
}

/** Middle value; averages the two center samples when length is even. */
export function medianMbps(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Drop the first N ms worth of samples (by count), then take the median. */
export function medianAfterDiscard(
  samples: readonly number[],
  sampleIntervalMs: number,
  discardMs: number,
): number {
  const discardCount = Math.floor(discardMs / sampleIntervalMs);
  const trimmed = samples.slice(discardCount);
  return medianMbps(trimmed.length > 0 ? trimmed : samples);
}

function assertNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

async function consumeDownloadStream(
  response: Response,
  signal: AbortSignal | undefined,
  onBytes: (byteCount: number) => boolean,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Download test failed (no response body)");
  }
  try {
    while (true) {
      assertNotAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        const shouldContinue = onBytes(value.byteLength);
        if (!shouldContinue) {
          await reader.cancel();
          break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function fetchDownloadChunk(
  bytes: number,
  signal: AbortSignal | undefined,
): Promise<Response> {
  const url = `${CF_SPEED_DOWN}?bytes=${String(bytes)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(`Download test failed (HTTP ${String(res.status)})`);
  }
  return res;
}

async function postUploadChunk(bytes: number, signal: AbortSignal | undefined): Promise<void> {
  const body = new Uint8Array(bytes);
  const res = await fetch(CF_SPEED_UP, { method: "POST", body, signal });
  if (!res.ok) {
    throw new Error(`Upload test failed (HTTP ${String(res.status)})`);
  }
  await res.arrayBuffer();
}

interface ISampleTracker {
  samples: number[];
  lastSampleAt: number;
  bytesSinceLastSample: number;
  liveMbps: number | null;
  flushSample(now: number): void;
  trackBytes(byteCount: number, now: number): void;
}

function createSampleTracker(sampleIntervalMs: number): ISampleTracker {
  const tracker: ISampleTracker = {
    samples: [],
    lastSampleAt: 0,
    bytesSinceLastSample: 0,
    liveMbps: null,
    flushSample(now: number) {
      const deltaMs = now - this.lastSampleAt;
      if (deltaMs <= 0 || this.bytesSinceLastSample <= 0) return;
      const bps = this.bytesSinceLastSample / (deltaMs / 1000);
      const mbps = bytesPerSecondToMbps(bps);
      this.samples.push(mbps);
      this.liveMbps = mbps;
      this.lastSampleAt = now;
      this.bytesSinceLastSample = 0;
    },
    trackBytes(byteCount: number, now: number) {
      this.bytesSinceLastSample += byteCount;
      if (this.lastSampleAt <= 0) {
        this.lastSampleAt = now;
        return;
      }
      if (now - this.lastSampleAt >= sampleIntervalMs) {
        this.flushSample(now);
      }
    },
  };
  return tracker;
}

async function runDownloadPhase(options: {
  signal?: AbortSignal;
  onProgress?: (progress: ISpeedTestProgress) => void;
}): Promise<number> {
  const signal = options.signal;
  const onProgress = options.onProgress;
  const totalMs = SPEED_TEST_DOWNLOAD_WARMUP_MS + SPEED_TEST_DOWNLOAD_MEASURE_MS;
  const started = performance.now();
  const tracker = createSampleTracker(SPEED_TEST_SAMPLE_INTERVAL_MS);
  let lastProgressEmit = 0;

  const emitProgress = (phase: TCloudflareSpeedPhase, force = false) => {
    const now = performance.now();
    if (!force && now - lastProgressEmit < 100) return;
    lastProgressEmit = now;
    const elapsed = now - started;
    const phaseTargetMs =
      phase === "warmup-download" ? SPEED_TEST_DOWNLOAD_WARMUP_MS : SPEED_TEST_DOWNLOAD_MEASURE_MS;
    const elapsedInPhaseMs =
      phase === "warmup-download"
        ? Math.min(elapsed, SPEED_TEST_DOWNLOAD_WARMUP_MS)
        : Math.max(0, elapsed - SPEED_TEST_DOWNLOAD_WARMUP_MS);
    onProgress?.({
      phase,
      elapsedInPhaseMs,
      phaseTargetMs,
      downloadMbpsLive: tracker.liveMbps,
      uploadMbpsLive: null,
    });
  };

  while (performance.now() - started < totalMs) {
    assertNotAborted(signal);
    const res = await fetchDownloadChunk(DOWNLOAD_CHUNK_BYTES, signal);
    await consumeDownloadStream(res, signal, (byteCount) => {
      const now = performance.now();
      const elapsed = now - started;
      const phase: TCloudflareSpeedPhase =
        elapsed < SPEED_TEST_DOWNLOAD_WARMUP_MS ? "warmup-download" : "download";
      emitProgress(phase);
      if (elapsed >= SPEED_TEST_DOWNLOAD_WARMUP_MS) {
        tracker.trackBytes(byteCount, now);
      }
      return elapsed < totalMs;
    });
  }

  emitProgress("download", true);
  tracker.flushSample(performance.now());
  return medianAfterDiscard(
    tracker.samples,
    SPEED_TEST_SAMPLE_INTERVAL_MS,
    SPEED_TEST_DISCARD_MEASURE_MS,
  );
}

async function runUploadPhase(
  downloadMbps: number,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: ISpeedTestProgress) => void;
  },
): Promise<number> {
  const signal = options.signal;
  const onProgress = options.onProgress;
  const samples: number[] = [];
  let uploadLive: number | null = null;

  const warmupStarted = performance.now();
  onProgress?.({
    phase: "warmup-upload",
    elapsedInPhaseMs: 0,
    phaseTargetMs: 1_000,
    downloadMbpsLive: downloadMbps,
    uploadMbpsLive: null,
  });
  await postUploadChunk(SPEED_TEST_UPLOAD_WARMUP_BYTES, signal);
  onProgress?.({
    phase: "warmup-upload",
    elapsedInPhaseMs: performance.now() - warmupStarted,
    phaseTargetMs: performance.now() - warmupStarted,
    downloadMbpsLive: downloadMbps,
    uploadMbpsLive: null,
  });

  const measureStarted = performance.now();
  while (performance.now() - measureStarted < SPEED_TEST_UPLOAD_MEASURE_MS) {
    assertNotAborted(signal);
    const chunkStarted = performance.now();
    await postUploadChunk(UPLOAD_CHUNK_BYTES, signal);
    const chunkEnded = performance.now();
    const chunkMs = chunkEnded - chunkStarted;
    if (chunkMs > 0) {
      uploadLive = bytesPerSecondToMbps(UPLOAD_CHUNK_BYTES / (chunkMs / 1000));
      samples.push(uploadLive);
    }
    onProgress?.({
      phase: "upload",
      elapsedInPhaseMs: chunkEnded - measureStarted,
      phaseTargetMs: SPEED_TEST_UPLOAD_MEASURE_MS,
      downloadMbpsLive: downloadMbps,
      uploadMbpsLive: uploadLive,
    });
  }

  const trimmed = samples.slice(SPEED_TEST_UPLOAD_DISCARD_SAMPLES);
  return medianMbps(trimmed.length > 0 ? trimmed : samples);
}

export async function runCloudflareSpeedTest(options?: {
  signal?: AbortSignal;
  onProgress?: (progress: ISpeedTestProgress) => void;
}): Promise<ICloudflareSpeedTestResult> {
  const opts = options ?? {};
  const downloadMbps = await runDownloadPhase(opts);
  const uploadMbps = await runUploadPhase(downloadMbps, opts);
  return { downloadMbps, uploadMbps };
}
