import { describe, expect, it } from "vitest";
import {
  formatExtensionChromeError,
  withExtensionPromiseTimeout,
} from "./extension-chrome-promisify";

describe("formatExtensionChromeError", () => {
  it("returns Error.message when present", () => {
    expect(formatExtensionChromeError(new Error("boom"))).toBe("boom");
  });
});

describe("withExtensionPromiseTimeout", () => {
  it("rejects when the wrapped promise exceeds the timeout", async () => {
    await expect(
      withExtensionPromiseTimeout(
        new Promise<string>(() => {
          /* never settles */
        }),
        20,
        "Timed out.",
      ),
    ).rejects.toThrow("Timed out.");
  });

  it("resolves when the wrapped promise settles first", async () => {
    await expect(
      withExtensionPromiseTimeout(Promise.resolve("ok"), 100, "Timed out."),
    ).resolves.toBe("ok");
  });
});
