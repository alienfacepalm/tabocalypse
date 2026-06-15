import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTimezoneFromCoords } from "./resolve-timezone-from-coords";

vi.mock("./privileged-extension-fetch", () => ({
  privilegedExtensionFetchJson: vi.fn(),
}));

import { privilegedExtensionFetchJson } from "./privileged-extension-fetch";

describe("resolveTimezoneFromCoords", () => {
  afterEach(() => {
    vi.mocked(privilegedExtensionFetchJson).mockReset();
  });

  it("returns the Open-Meteo timezone string", async () => {
    vi.mocked(privilegedExtensionFetchJson).mockResolvedValue({
      timezone: "America/Los_Angeles",
    });

    await expect(resolveTimezoneFromCoords(34.05, -118.24)).resolves.toBe("America/Los_Angeles");
    expect(privilegedExtensionFetchJson).toHaveBeenCalledOnce();
  });

  it("returns null when timezone is missing", async () => {
    vi.mocked(privilegedExtensionFetchJson).mockResolvedValue({});
    await expect(resolveTimezoneFromCoords(0, 0)).resolves.toBeNull();
  });
});
