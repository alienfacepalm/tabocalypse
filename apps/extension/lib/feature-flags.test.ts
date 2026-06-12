import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURE_DESCRIPTIONS,
  EXPERIMENTAL_FEATURE_FLAG_KEYS,
  EXPERIMENTAL_FEATURE_LABELS,
  isExperimentalFeatureEnabled,
  mergeExperimentalFeatures,
} from "./feature-flags";

describe("mergeExperimentalFeatures", () => {
  it("defaults every flag to false when storage is empty", () => {
    expect(mergeExperimentalFeatures(undefined)).toEqual(DEFAULT_EXPERIMENTAL_FEATURES);
    expect(mergeExperimentalFeatures({})).toEqual(DEFAULT_EXPERIMENTAL_FEATURES);
  });

  it("merges known keys and ignores unknown keys", () => {
    const merged = mergeExperimentalFeatures({
      weatherHudGamification: true,
      futureFlag: true,
    });
    expect(merged.weatherHudGamification).toBe(true);
    expect(Object.keys(merged).sort()).toEqual([...EXPERIMENTAL_FEATURE_FLAG_KEYS].sort());
  });

  it("coerces non-boolean values to defaults", () => {
    const merged = mergeExperimentalFeatures({ weatherHudGamification: "yes" });
    expect(merged.weatherHudGamification).toBe(false);
  });
});

describe("isExperimentalFeatureEnabled", () => {
  it("is false when features are undefined or flag is off", () => {
    expect(isExperimentalFeatureEnabled(undefined, "weatherHudGamification")).toBe(false);
    expect(
      isExperimentalFeatureEnabled(DEFAULT_EXPERIMENTAL_FEATURES, "weatherHudGamification"),
    ).toBe(false);
  });

  it("is true only when the flag is explicitly enabled", () => {
    expect(
      isExperimentalFeatureEnabled(
        { ...DEFAULT_EXPERIMENTAL_FEATURES, weatherHudGamification: true },
        "weatherHudGamification",
      ),
    ).toBe(true);
  });
});

describe("experimental feature registry", () => {
  it("defines a label and description for every flag key", () => {
    for (const key of EXPERIMENTAL_FEATURE_FLAG_KEYS) {
      expect(EXPERIMENTAL_FEATURE_LABELS[key]?.trim().length).toBeGreaterThan(0);
      expect(EXPERIMENTAL_FEATURE_DESCRIPTIONS[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});
