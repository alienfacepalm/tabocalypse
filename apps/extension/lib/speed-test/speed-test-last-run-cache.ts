import browser from "webextension-polyfill";

export const SPEED_TEST_LAST_RUN_STORAGE_KEY = "tabocalypseSpeedTestLastRunV1";

export interface ISpeedTestLastRun {
  downloadMbps: number;
  uploadMbps: number;
  completedAt: number;
}

export function parseSpeedTestLastRun(value: unknown): ISpeedTestLastRun | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<ISpeedTestLastRun>;
  if (
    typeof row.downloadMbps !== "number" ||
    !Number.isFinite(row.downloadMbps) ||
    typeof row.uploadMbps !== "number" ||
    !Number.isFinite(row.uploadMbps) ||
    typeof row.completedAt !== "number" ||
    !Number.isFinite(row.completedAt)
  ) {
    return null;
  }
  return {
    downloadMbps: row.downloadMbps,
    uploadMbps: row.uploadMbps,
    completedAt: row.completedAt,
  };
}

export async function readSpeedTestLastRun(): Promise<ISpeedTestLastRun | null> {
  const raw = await browser.storage.local.get(SPEED_TEST_LAST_RUN_STORAGE_KEY);
  return parseSpeedTestLastRun(raw[SPEED_TEST_LAST_RUN_STORAGE_KEY]);
}

export async function writeSpeedTestLastRun(
  result: Pick<ISpeedTestLastRun, "downloadMbps" | "uploadMbps">,
  completedAt: number = Date.now(),
): Promise<ISpeedTestLastRun> {
  const entry: ISpeedTestLastRun = {
    downloadMbps: result.downloadMbps,
    uploadMbps: result.uploadMbps,
    completedAt,
  };
  await browser.storage.local.set({ [SPEED_TEST_LAST_RUN_STORAGE_KEY]: entry });
  return entry;
}
