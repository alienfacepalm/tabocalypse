import { describe, expect, it } from "vitest";
import {
  coerceThemeMode,
  coerceThemePalette,
  resolveThemeCssVars,
  THEME_MODE_LABELS,
  THEME_PALETTE_LABELS,
  THEME_MODES,
  THEME_PALETTES,
  themeGradientStops,
} from "./theme";

describe("THEME_*_LABELS", () => {
  it("defines a non-empty label for every mode", () => {
    for (const mode of THEME_MODES) {
      expect(THEME_MODE_LABELS[mode]?.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines a non-empty label for every palette", () => {
    for (const palette of THEME_PALETTES) {
      expect(THEME_PALETTE_LABELS[palette]?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("resolveThemeCssVars", () => {
  it("merges dark neutrals with glitch accents", () => {
    const v = resolveThemeCssVars("dark", "glitch");
    expect(v["--color-bg"]).toBe("#050505");
    expect(v["--color-accent"]).toBe("#39ff14");
    expect(v["--color-accent2"]).toBe("#ff00ff");
  });

  it("uses light neutrals when mode is light", () => {
    const v = resolveThemeCssVars("light", "ocean");
    expect(v["--color-bg"]).toBe("#e8e8e4");
    expect(v["--color-accent"]).toBe("#22d3ee");
  });
});

describe("themeGradientStops", () => {
  it("returns darker stops for dark mode", () => {
    expect(themeGradientStops("dark").mid).toContain("#");
    expect(themeGradientStops("light").mid).not.toBe(themeGradientStops("dark").mid);
  });
});

describe("coerceThemeMode", () => {
  it("accepts dark and light only", () => {
    expect(coerceThemeMode("light", "dark")).toBe("light");
    expect(coerceThemeMode("dark", "light")).toBe("dark");
    expect(coerceThemeMode("bogus", "light")).toBe("light");
  });
});

describe("coerceThemePalette", () => {
  it("falls back on invalid values", () => {
    expect(coerceThemePalette("ocean", "glitch")).toBe("ocean");
    expect(coerceThemePalette("nope", "ember")).toBe("ember");
  });
});
