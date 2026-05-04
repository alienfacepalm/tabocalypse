/** Appearance: base mode (dark / light) plus accent family. Drives `document.documentElement` CSS variables. */

export const THEME_MODES = ["dark", "light"] as const;
export type TThemeMode = (typeof THEME_MODES)[number];

export const THEME_PALETTES = ["glitch", "ocean", "ember", "slate"] as const;
export type TThemePalette = (typeof THEME_PALETTES)[number];

/** Settings storage values — user-facing labels for the Appearance UI. */
export const THEME_MODE_LABELS: Record<TThemeMode, string> = {
  dark: "Dark",
  light: "Light",
};

export const THEME_PALETTE_LABELS: Record<TThemePalette, string> = {
  glitch: "Acid & magenta",
  ocean: "Cyan & indigo",
  ember: "Amber & rose",
  slate: "Cool gray",
};

const PALETTE_ACCENTS: Record<TThemePalette, { accent: string; accent2: string; accent3: string }> =
  {
    glitch: { accent: "#39ff14", accent2: "#ff00ff", accent3: "#efffe3" },
    ocean: { accent: "#22d3ee", accent2: "#6366f1", accent3: "#e0f2fe" },
    ember: { accent: "#fb923c", accent2: "#f43f5e", accent3: "#ffedd5" },
    slate: { accent: "#94a3b8", accent2: "#64748b", accent3: "#e2e8f0" },
  };

const DARK_NEUTRAL: Record<string, string> = {
  "--color-bg": "#050505",
  "--color-text": "#dae6d0",
  "--color-muted": "#baccb0",
  "--color-border": "#27272a",
  "--color-surface": "rgb(0 0 0 / 0.45)",
  "--color-surface2": "rgb(0 0 0 / 0.60)",
  "--color-surface-weak": "rgb(0 0 0 / 0.30)",
  "--color-surface-strong": "rgb(0 0 0 / 0.80)",
  "--color-modal": "rgb(5 5 5 / 0.86)",
  "--color-input-bg": "rgb(0 0 0 / 0.40)",
  "--color-btn-bg": "#000000",
  "--color-on-accent": "#0a0a0a",
  "--color-backdrop": "rgb(0 0 0 / 0.65)",
  "--color-shadow-hard": "#000000",
  "--color-codebg": "#000000",
  "--color-danger": "#fca5a5",
};

const LIGHT_NEUTRAL: Record<string, string> = {
  "--color-bg": "#e8e8e4",
  "--color-text": "#1a1f18",
  "--color-muted": "#57534e",
  "--color-border": "#a8a8a3",
  "--color-surface": "rgb(255 255 255 / 0.72)",
  "--color-surface2": "rgb(255 255 255 / 0.55)",
  "--color-surface-weak": "rgb(255 255 255 / 0.42)",
  "--color-surface-strong": "rgb(245 245 242 / 0.92)",
  "--color-modal": "rgb(252 252 250 / 0.96)",
  "--color-input-bg": "rgb(255 255 255 / 0.78)",
  "--color-btn-bg": "#ebebe6",
  "--color-on-accent": "#0a0a0a",
  "--color-backdrop": "rgb(24 24 22 / 0.42)",
  "--color-shadow-hard": "#1c1c18",
  "--color-codebg": "#e4e4df",
  "--color-danger": "#b91c1c",
};

export function resolveThemeCssVars(
  mode: TThemeMode,
  palette: TThemePalette,
): Record<string, string> {
  const base = mode === "light" ? LIGHT_NEUTRAL : DARK_NEUTRAL;
  const { accent, accent2, accent3 } = PALETTE_ACCENTS[palette];
  return {
    ...base,
    "--color-accent": accent,
    "--color-accent2": accent2,
    "--color-accent3": accent3,
  };
}

export function applyDocumentTheme(mode: TThemeMode, palette: TThemePalette): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.palette = palette;
  const vars = resolveThemeCssVars(mode, palette);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function themeGradientStops(mode: TThemeMode): { mid: string; end: string } {
  return mode === "light" ? { mid: "#d4d8e2", end: "#b8bcc8" } : { mid: "#1a1025", end: "#0f0f12" };
}

export function coerceThemeMode(value: unknown, fallback: TThemeMode): TThemeMode {
  if (value === "light" || value === "dark") return value;
  return fallback;
}

export function coerceThemePalette(value: unknown, fallback: TThemePalette): TThemePalette {
  if (value === "glitch" || value === "ocean" || value === "ember" || value === "slate") {
    return value;
  }
  return fallback;
}
