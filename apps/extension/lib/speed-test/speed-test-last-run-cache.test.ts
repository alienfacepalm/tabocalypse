import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseSpeedTestLastRun,
  readSpeedTestLastRun,
  SPEED_TEST_LAST_RUN_STORAGE_KEY,
  writeSpeedTestLastRun,
} from "./speed-test-last-run-cache";

const { mockBrowser, localGet, localSet } = vi.hoisted(() => {
  const localGet = vi.fn();
  const localSet = vi.fn();
  const mockBrowser = {
    storage: {
      local: { get: localGet, set: localSet },
    },
  };
  return { mockBrowser, localGet, localSet };
});

vi.mock("webextension-polyfill", () => ({
  default: mockBrowser,
}));

describe("parseSpeedTestLastRun", () => {
  it("accepts a valid entry", () => {
    expect(
      parseSpeedTestLastRun({
        downloadMbps: 242.1,
        uploadMbps: 45.7,
        completedAt: 1_700_000_000_000,
      }),
    ).toEqual({
      downloadMbps: 242.1,
      uploadMbps: 45.7,
      completedAt: 1_700_000_000_000,
    });
  });

  it("rejects malformed values", () => {
    expect(parseSpeedTestLastRun(null)).toBeNull();
    expect(parseSpeedTestLastRun({ downloadMbps: "fast" })).toBeNull();
    expect(parseSpeedTestLastRun({ downloadMbps: 10, uploadMbps: 5 })).toBeNull();
  });
});

describe("speed test last run storage", () => {
  beforeEach(() => {
    localGet.mockReset();
    localSet.mockReset();
    localSet.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads cached last run from storage", async () => {
    const entry = { downloadMbps: 100, uploadMbps: 20, completedAt: 42 };
    localGet.mockResolvedValue({ [SPEED_TEST_LAST_RUN_STORAGE_KEY]: entry });

    await expect(readSpeedTestLastRun()).resolves.toEqual(entry);
    expect(localGet).toHaveBeenCalledWith(SPEED_TEST_LAST_RUN_STORAGE_KEY);
  });

  it("writes last run to storage", async () => {
    const entry = await writeSpeedTestLastRun({ downloadMbps: 88.2, uploadMbps: 12.4 }, 99_999);

    expect(entry).toEqual({
      downloadMbps: 88.2,
      uploadMbps: 12.4,
      completedAt: 99_999,
    });
    expect(localSet).toHaveBeenCalledWith({
      [SPEED_TEST_LAST_RUN_STORAGE_KEY]: entry,
    });
  });
});
