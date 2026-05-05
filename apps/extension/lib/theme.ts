/** Appearance: base mode (dark / light) plus accent family. Drives `document.documentElement` CSS variables. */

export const THEME_MODES = ["dark", "light"] as const;
export type TThemeMode = (typeof THEME_MODES)[number];

/** Named palettes only (excludes `custom`). */
export const THEME_PRESET_PALETTES = [
  "glitch",
  "ocean",
  "ember",
  "slate",
  "forest",
  "plasma",
  "sunset",
  "voltage",
  "blood",
  "mint",
] as const;
export type TThemePresetPalette = (typeof THEME_PRESET_PALETTES)[number];

export const THEME_PALETTES = [...THEME_PRESET_PALETTES, "custom"] as const;
export type TThemePalette = (typeof THEME_PALETTES)[number];

export const DEFAULT_THEME_CUSTOM_ACCENT = "#39ff14";
export const DEFAULT_THEME_CUSTOM_ACCENT2 = "#ff00ff";

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
  forest: "Lime & forest",
  plasma: "Violet & pink",
  sunset: "Orange & violet",
  voltage: "Blue & gold",
  blood: "Crimson & scarlet",
  mint: "Mint & aqua",
  custom: "Custom",
};

const PALETTE_ACCENTS: Record<
  TThemePresetPalette,
  { accent: string; accent2: string; accent3: string }
> = {
  glitch: { accent: "#39ff14", accent2: "#ff00ff", accent3: "#efffe3" },
  ocean: { accent: "#22d3ee", accent2: "#6366f1", accent3: "#e0f2fe" },
  ember: { accent: "#fb923c", accent2: "#f43f5e", accent3: "#ffedd5" },
  slate: { accent: "#94a3b8", accent2: "#64748b", accent3: "#e2e8f0" },
  forest: { accent: "#84cc16", accent2: "#15803d", accent3: "#ecfccb" },
  plasma: { accent: "#c084fc", accent2: "#ec4899", accent3: "#fae8ff" },
  sunset: { accent: "#fb923c", accent2: "#7c3aed", accent3: "#ffedd5" },
  voltage: { accent: "#3b82f6", accent2: "#eab308", accent3: "#dbeafe" },
  blood: { accent: "#f87171", accent2: "#b91c1c", accent3: "#fee2e2" },
  mint: { accent: "#2dd4bf", accent2: "#0ea5e9", accent3: "#ccfbf1" },
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

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HEX8 = /^#[0-9a-fA-F]{8}$/;
const HEX3 = /^#[0-9a-fA-F]{3}$/;

export function coerceThemeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const t = value.trim();
  if (HEX6.test(t)) return t.toLowerCase();
  /** Some browsers emit `#rrggbbaa` from `<input type="color">`; we store opaque RGB only. */
  if (HEX8.test(t)) return `#${t.slice(1, 7).toLowerCase()}`;
  if (HEX3.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    if (r === undefined || g === undefined || b === undefined) return fallback;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function parseRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = coerceThemeHex(hex, "");
  if (!HEX6.test(h)) return null;
  return {
    r: Number.parseInt(h.slice(1, 3), 16),
    g: Number.parseInt(h.slice(3, 5), 16),
    b: Number.parseInt(h.slice(5, 7), 16),
  };
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
): string {
  const u = Math.min(1, Math.max(0, t));
  const r = Math.round(a.r + (b.r - a.r) * u);
  const g = Math.round(a.g + (b.g - a.g) * u);
  const bl = Math.round(a.b + (b.b - a.b) * u);
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(bl)}`;
}

/** Light tint for highlights / tertiary accent when the user picks custom primaries. */
export function deriveCustomAccent3(accent: string, mode: TThemeMode): string {
  const a = parseRgb(accent);
  const toward = mode === "light" ? { r: 255, g: 255, b: 255 } : { r: 248, g: 250, b: 252 };
  if (!a) return "#e2e8f0";
  return mixRgb(a, toward, mode === "light" ? 0.88 : 0.82);
}

export interface IThemeCustomAccents {
  accent: string;
  accent2: string;
}

export function getResolvedAccentPair(
  palette: TThemePalette,
  custom: IThemeCustomAccents,
): { accent: string; accent2: string } {
  if (palette === "custom") {
    return {
      accent: coerceThemeHex(custom.accent, DEFAULT_THEME_CUSTOM_ACCENT),
      accent2: coerceThemeHex(custom.accent2, DEFAULT_THEME_CUSTOM_ACCENT2),
    };
  }
  const row = PALETTE_ACCENTS[palette];
  return { accent: row.accent, accent2: row.accent2 };
}

export function resolveThemeCssVars(
  mode: TThemeMode,
  palette: TThemePalette,
  customAccents: IThemeCustomAccents,
): Record<string, string> {
  const base = mode === "light" ? LIGHT_NEUTRAL : DARK_NEUTRAL;
  let accent: string;
  let accent2: string;
  let accent3: string;
  if (palette === "custom") {
    accent = coerceThemeHex(customAccents.accent, DEFAULT_THEME_CUSTOM_ACCENT);
    accent2 = coerceThemeHex(customAccents.accent2, DEFAULT_THEME_CUSTOM_ACCENT2);
    accent3 = deriveCustomAccent3(accent, mode);
  } else {
    ({ accent, accent2, accent3 } = PALETTE_ACCENTS[palette]);
  }
  return {
    ...base,
    "--color-accent": accent,
    "--color-accent2": accent2,
    "--color-accent3": accent3,
  };
}

export function applyDocumentTheme(
  mode: TThemeMode,
  palette: TThemePalette,
  customAccents: IThemeCustomAccents,
): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.palette = palette;
  const vars = resolveThemeCssVars(mode, palette, customAccents);
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
  if (typeof value !== "string") return fallback;
  if ((THEME_PALETTES as readonly string[]).includes(value)) return value as TThemePalette;
  return fallback;
}
