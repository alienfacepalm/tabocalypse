/**
 * One-shot download + upload throughput using Cloudflare's public speed-test endpoints.
 * User-initiated only; see Widgets → Speed test.
 */

const CF_SPEED_DOWN = "https://speed.cloudflare.com/__down";
const CF_SPEED_UP = "https://speed.cloudflare.com/__up";

export type TCloudflareSpeedPhase = "download" | "upload";

export interface ICloudflareSpeedTestResult {
  downloadMbps: number;
  uploadMbps: number;
}

/** Convert bytes per second to megabits per second (decimal Mbps). */
export function bytesPerSecondToMbps(bytesPerSecond: number): number {
  return (bytesPerSecond * 8) / 1_000_000;
}

export async function runCloudflareSpeedTest(options?: {
  downloadBytes?: number;
  uploadBytes?: number;
  signal?: AbortSignal;
  onPhase?: (phase: TCloudflareSpeedPhase) => void;
}): Promise<ICloudflareSpeedTestResult> {
  const downloadBytes = options?.downloadBytes ?? 5_000_000;
  const uploadBytes = options?.uploadBytes ?? 2_000_000;
  const signal = options?.signal;
  const onPhase = options?.onPhase;

  onPhase?.("download");
  const downUrl = `${CF_SPEED_DOWN}?bytes=${downloadBytes}`;
  const downStarted = performance.now();
  const downRes = await fetch(downUrl, { cache: "no-store", signal });
  if (!downRes.ok) {
    throw new Error(`Download test failed (HTTP ${String(downRes.status)})`);
  }
  const downBuf = await downRes.arrayBuffer();
  const downElapsedMs = performance.now() - downStarted;
  if (downElapsedMs <= 0) {
    throw new Error("Download test finished too quickly to measure");
  }
  const downSize = downBuf.byteLength;
  const downBps = downSize / (downElapsedMs / 1000);

  onPhase?.("upload");
  const uploadBody = new Uint8Array(uploadBytes);
  const upStarted = performance.now();
  const upRes = await fetch(CF_SPEED_UP, {
    method: "POST",
    body: uploadBody,
    signal,
  });
  if (!upRes.ok) {
    throw new Error(`Upload test failed (HTTP ${String(upRes.status)})`);
  }
  await upRes.arrayBuffer();
  const upElapsedMs = performance.now() - upStarted;
  if (upElapsedMs <= 0) {
    throw new Error("Upload test finished too quickly to measure");
  }
  const upBps = uploadBytes / (upElapsedMs / 1000);

  return {
    downloadMbps: bytesPerSecondToMbps(downBps),
    uploadMbps: bytesPerSecondToMbps(upBps),
  };
}
