import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { storage: { local: {}, sync: {} }, runtime: {} },
}));

import { defaultSettings, type ISettings } from "./settings";
import { mergeHydratedSettingsWithBaseline } from "./merge-hydrated-settings";

function sample(overrides: Partial<ISettings> = {}): ISettings {
  return { ...defaultSettings(), ...overrides };
}

describe("mergeHydratedSettingsWithBaseline", () => {
  it("takes non-note prefs from disk when not preserving baseline", () => {
    const baseline = sample({ themePalette: "ocean", uiShape: "pill" });
    const disk = sample({ themePalette: "ember", uiShape: "soft" });
    const merged = mergeHydratedSettingsWithBaseline(baseline, disk, {
      preserveMyLinesDraft: false,
      preserveBaselinePrefs: false,
    });
    expect(merged.themePalette).toBe("ember");
    expect(merged.uiShape).toBe("soft");
  });

  it("keeps baseline prefs when preserveBaselinePrefs is true", () => {
    const baseline = sample({ themePalette: "ocean", uiShape: "pill", myLines: ["draft"] });
    const disk = sample({ themePalette: "ember", uiShape: "soft", myLines: ["disk"] });
    const merged = mergeHydratedSettingsWithBaseline(baseline, disk, {
      preserveMyLinesDraft: true,
      preserveBaselinePrefs: true,
    });
    expect(merged.themePalette).toBe("ocean");
    expect(merged.uiShape).toBe("pill");
    expect(merged.myLines).toEqual(["draft"]);
  });

  it("updates myLines from disk when not preserving the draft", () => {
    const baseline = sample({ myLines: ["draft"] });
    const disk = sample({ myLines: ["disk"] });
    const merged = mergeHydratedSettingsWithBaseline(baseline, disk, {
      preserveMyLinesDraft: false,
      preserveBaselinePrefs: true,
    });
    expect(merged.myLines).toEqual(["disk"]);
  });
});
