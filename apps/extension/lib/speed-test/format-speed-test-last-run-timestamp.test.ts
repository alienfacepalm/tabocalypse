import { describe, expect, it } from "vitest";
import { formatSpeedTestLastRunTimestamp } from "./format-speed-test-last-run-timestamp";

describe("formatSpeedTestLastRunTimestamp", () => {
  const when = new Date(2026, 5, 9, 15, 15, 0);

  it("uses 24-hour time when the global clock format is 24h", () => {
    expect(formatSpeedTestLastRunTimestamp(when.getTime(), "en-US", "24h")).toBe(
      "Jun 9, 2026, 15:15",
    );
  });

  it("uses 12-hour time when the global clock format is 12h", () => {
    expect(formatSpeedTestLastRunTimestamp(when.getTime(), "en-US", "12h")).toBe(
      "Jun 9, 2026, 3:15 PM",
    );
  });
});
