/** Experimental feature toggles (Settings > Experimental). All default off until opted in. */

export type TExperimentalFeatureFlag = "weatherHudGamification";

export const EXPERIMENTAL_FEATURE_FLAG_KEYS: readonly TExperimentalFeatureFlag[] = [
  "weatherHudGamification",
] as const;

export const DEFAULT_EXPERIMENTAL_FEATURES: Record<TExperimentalFeatureFlag, boolean> = {
  weatherHudGamification: false,
};

/** Plain-language labels for Settings checkboxes (not raw flag keys). */
export const EXPERIMENTAL_FEATURE_LABELS: Record<TExperimentalFeatureFlag, string> = {
  weatherHudGamification: "Weather HUD streak & points",
};

export const EXPERIMENTAL_FEATURE_DESCRIPTIONS: Record<TExperimentalFeatureFlag, string> = {
  weatherHudGamification:
    "Show a local daily streak and points in Weather → Forecast. Stored on this device only; no account.",
};

/** Merge stored experimental flags into defaults; ignores unknown keys. */
export function mergeExperimentalFeatures(
  partial: Partial<Record<string, unknown>> | undefined,
): Record<TExperimentalFeatureFlag, boolean> {
  const base = { ...DEFAULT_EXPERIMENTAL_FEATURES };
  if (!partial || typeof partial !== "object") return base;
  for (const key of EXPERIMENTAL_FEATURE_FLAG_KEYS) {
    const v = partial[key];
    if (typeof v === "boolean") base[key] = v;
  }
  return base;
}

export function isExperimentalFeatureEnabled(
  features: Record<TExperimentalFeatureFlag, boolean> | undefined,
  flag: TExperimentalFeatureFlag,
): boolean {
  return features?.[flag] === true;
}
