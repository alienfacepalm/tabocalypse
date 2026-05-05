import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import browser from "webextension-polyfill";
import { mergeHudPanelPositions, type IHudPanelPosition, type THudPanelId } from "./hud-layout";
import {
  coerceThemeHex,
  coerceThemeMode,
  coerceThemePalette,
  DEFAULT_THEME_CUSTOM_ACCENT,
  DEFAULT_THEME_CUSTOM_ACCENT2,
  themeGradientStops,
  type TThemeMode,
  type TThemePalette,
} from "./theme";
import { coerceClockHourFormat, type TClockHourFormat } from "./clock-hour-format";
import {
  coerceWeatherTemperatureUnit,
  type TWeatherTemperatureUnit,
} from "./weather/weather-units";

export type { IHudPanelPosition, THudPanelId } from "./hud-layout";

export type { TThemeMode, TThemePalette } from "./theme";
export { coerceClockHourFormat, type TClockHourFormat } from "./clock-hour-format";
export type { TWeatherTemperatureUnit } from "./weather/weather-units";
export type { IImportedPlugin, IPluginWidget } from "@tabocalypse/plugin-sdk";

export type THumorIntensity = "off" | "mild" | "spicy" | "unhinged";

export type TPresetKey = "focus" | "balanced" | "chaos";

/** Validates stored/imported preset; unknown values fall back (fresh installs → chaos). */
export function coercePreset(raw: unknown, fallback: TPresetKey): TPresetKey {
  if (raw === "focus" || raw === "balanced" || raw === "chaos") return raw;
  return fallback;
}

/** Built-in roast “voice” for the humor banner. Only one specialty voice at a time; `default` uses per-pack toggles. */
export type THumorBuiltinVoice = "default" | "gen_z" | "unsuck_classics";

/** Normalize legacy `humorGenZMode` and unknown values when merging stored or imported settings. */
export function coerceHumorBuiltinVoice(input: {
  humorBuiltinVoice?: unknown;
  humorGenZMode?: unknown;
}): THumorBuiltinVoice {
  const v = input.humorBuiltinVoice;
  if (v === "default" || v === "gen_z" || v === "unsuck_classics") return v;
  if (input.humorGenZMode === true) return "gen_z";
  return "default";
}

export type TWidgetKey =
  | "search"
  | "clock"
  | "notes"
  | "todo"
  | "weather"
  | "topSites"
  | "bookmarksStrip"
  | "tabGuilt"
  | "humorBanner";

export interface IImportedUserPack {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  messages: string[];
  importedAt: number;
}

export interface ITodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface INote {
  id: string;
  name: string;
  tags: string[];
  text: string;
  createdAt: number;
  updatedAt: number;
}

/** A pinned note opens as its own draggable panel with an independent HUD position. */
export interface INotePanel {
  noteId: string;
  position: IHudPanelPosition;
}

export function newNoteId(): string {
  const c = globalThis.crypto?.randomUUID;
  if (typeof c === "function") return c.call(globalThis.crypto);
  return `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function coerceNotes(raw: unknown): INote[] {
  if (!Array.isArray(raw)) return [];
  const out: INote[] = [];
  const now = Date.now();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : "";
    if (!id.length) continue;
    const name =
      typeof o.name === "string" && o.name.trim().length > 0 ? o.name.trim() : "Untitled";
    const text = typeof o.text === "string" ? o.text : "";
    const tags = Array.isArray(o.tags)
      ? (o.tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [];
    const createdAt =
      typeof o.createdAt === "number" && Number.isFinite(o.createdAt) ? o.createdAt : now;
    const updatedAt =
      typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt) ? o.updatedAt : createdAt;
    out.push({ id, name, tags, text, createdAt, updatedAt });
  }
  return out;
}

export function coerceNotePanels(raw: unknown, validNoteIds: ReadonlySet<string>): INotePanel[] {
  if (!Array.isArray(raw)) return [];
  const out: INotePanel[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const noteId =
      typeof o.noteId === "string" && o.noteId.trim().length > 0 ? o.noteId.trim() : "";
    if (!noteId.length || !validNoteIds.has(noteId)) continue;
    const p = o.position;
    if (typeof p !== "object" || p === null) continue;
    const pr = p as Record<string, unknown>;
    const xPct = typeof pr.xPct === "number" && Number.isFinite(pr.xPct) ? pr.xPct : 0;
    const yPct = typeof pr.yPct === "number" && Number.isFinite(pr.yPct) ? pr.yPct : 0;
    const pos: IHudPanelPosition = { xPct, yPct };
    if (typeof pr.widthPx === "number" && Number.isFinite(pr.widthPx) && pr.widthPx > 0) {
      pos.widthPx = pr.widthPx;
    }
    if (typeof pr.heightPx === "number" && Number.isFinite(pr.heightPx) && pr.heightPx > 0) {
      pos.heightPx = pr.heightPx;
    }
    out.push({ noteId, position: pos });
  }
  return out;
}

export function migrateLegacyNotesTextIntoNotes(text: string, now: number): INote[] {
  const trimmed = text.trim();
  if (!trimmed.length) return [];
  return [
    {
      id: newNoteId(),
      name: "Note",
      tags: [],
      text: trimmed,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/** One user-uploaded background image with framing stored locally (not synced). */
export interface IUserBackgroundImage {
  id: string;
  dataUrl: string;
  /** Horizontal focal point for `background-position` (0–100, default 50). */
  positionXPct: number;
  /** Vertical focal point for `background-position` (0–100, default 50). */
  positionYPct: number;
}

/** Saved focal point for a specific Bing spotlight image URL (local only). */
export interface IBingWallpaperFraming {
  positionXPct: number;
  positionYPct: number;
}

export type TBingWallpaperFramings = Record<string, IBingWallpaperFraming>;

export const BACKGROUND_ROTATE_MINUTES_MIN = 1;
export const BACKGROUND_ROTATE_MINUTES_MAX = 24 * 60;
export const DEFAULT_BACKGROUND_ROTATE_MINUTES = 15;

export function coerceBackgroundRotateMinutes(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(
    BACKGROUND_ROTATE_MINUTES_MAX,
    Math.max(BACKGROUND_ROTATE_MINUTES_MIN, Math.round(n)),
  );
}

export type TBackgroundGradientShape = "linear" | "radial";

export function coerceBackgroundGradientShape(
  raw: unknown,
  fallback: TBackgroundGradientShape,
): TBackgroundGradientShape {
  return raw === "radial" ? "radial" : raw === "linear" ? "linear" : fallback;
}

export function coerceBackgroundGradientAngleDeg(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return ((Math.round(fallback) % 360) + 360) % 360;
  }
  return ((Math.round(n) % 360) + 360) % 360;
}

export function coerceBackgroundGradientCenterPct(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function clampBackgroundPositionPct(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

/** Deterministic id so legacy URL-only storage migrates to the same ids across sessions. */
export function stableUserBackgroundIdFromDataUrl(dataUrl: string, index: number): string {
  let h = 2166136261;
  for (let i = 0; i < dataUrl.length; i++) {
    h ^= dataUrl.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ubg-${index}-${(h >>> 0).toString(36)}-${dataUrl.length.toString(36)}`;
}

function coerceUserBackgroundImagesFromStorage(raw: unknown): IUserBackgroundImage[] {
  if (!Array.isArray(raw)) return [];
  const out: IUserBackgroundImage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : "";
    const dataUrl = typeof o.dataUrl === "string" && o.dataUrl.startsWith("data:") ? o.dataUrl : "";
    if (!id || !dataUrl) continue;
    out.push({
      id,
      dataUrl,
      positionXPct: clampBackgroundPositionPct(o.positionXPct, 50),
      positionYPct: clampBackgroundPositionPct(o.positionYPct, 50),
    });
  }
  return out;
}

function coerceBingWallpaperFramings(raw: unknown): TBingWallpaperFramings {
  if (typeof raw !== "object" || raw === null) return {};
  const src = raw as Record<string, unknown>;
  const out: TBingWallpaperFramings = {};
  for (const [url, v] of Object.entries(src)) {
    if (!url.startsWith("https://")) continue;
    if (typeof v !== "object" || v === null) continue;
    const o = v as Record<string, unknown>;
    out[url] = {
      positionXPct: clampBackgroundPositionPct(o.positionXPct, 50),
      positionYPct: clampBackgroundPositionPct(o.positionYPct, 50),
    };
  }
  return out;
}

/**
 * Which upload is shown when rotation is off; when rotation is on, time slots pick the image.
 * `null` means “first in list”.
 */
export function resolveUserBackgroundImage(
  images: IUserBackgroundImage[],
  activeId: string | null,
  rotate: boolean,
  rotateIntervalMs: number,
  nowMs = Date.now(),
): IUserBackgroundImage | null {
  if (images.length === 0) return null;
  if (rotate) {
    const slot = Math.floor(nowMs / Math.max(60_000, rotateIntervalMs));
    return images[slot % images.length] ?? images[0] ?? null;
  }
  if (activeId) {
    const found = images.find((im) => im.id === activeId);
    if (found) return found;
  }
  return images[0] ?? null;
}

export interface ISettings {
  version: 1;
  preset: TPresetKey;
  themeMode: TThemeMode;
  themePalette: TThemePalette;
  /** Primary accent when `themePalette` is `custom`; preserved when using presets so Custom restores the last choice. */
  themeCustomAccent: string;
  /** Secondary accent when `themePalette` is `custom`; same persistence semantics as `themeCustomAccent`. */
  themeCustomAccent2: string;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  /** Specialty built-in voice, or default mix controlled by `humorBuiltinPackIds`. */
  humorBuiltinVoice: THumorBuiltinVoice;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: "ddg" | "google" | "bing";
  weatherLat: number;
  weatherLon: number;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  /** Clock widget only: 12-hour (with AM/PM) vs 24-hour time. */
  clockHourFormat: TClockHourFormat;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: "solid" | "gradient" | "image" | "bing";
  /** If true and the chosen background kind supports it, the background rotates over time. */
  backgroundRotate: boolean;
  /** Minutes between Bing spotlight changes while rotation is on (local). */
  backgroundRotateMinutesBing: number;
  /** Minutes between uploaded-photo changes while rotation is on (local). */
  backgroundRotateMinutesUser: number;
  backgroundSolid: string;
  /** Legacy middle stop; kept for import/sync compatibility (two-stop CSS uses `backgroundSolid` + `backgroundGradientEnd` only). */
  backgroundGradientMid: string;
  /** Second color for solid-gradient and radial-gradient backgrounds. */
  backgroundGradientEnd: string;
  /** Linear uses `backgroundGradientAngleDeg`; radial uses center percentages. */
  backgroundGradientShape: TBackgroundGradientShape;
  /** Clockwise CSS angle for `linear-gradient` when `backgroundGradientShape` is `linear` (0–359). */
  backgroundGradientAngleDeg: number;
  /** Horizontal center for `radial-gradient` when shape is `radial` (0–100). */
  backgroundGradientCenterXPct: number;
  /** Vertical center for `radial-gradient` when shape is `radial` (0–100). */
  backgroundGradientCenterYPct: number;
  userBackgroundDataUrl: string | null;
  userBackgroundDataUrls: string[];
  /** Structured uploads with per-image framing; mirrors legacy URL fields on save/load. */
  userBackgroundImages: IUserBackgroundImage[];
  /** Active upload when rotation is off; ignored while rotating. */
  userBackgroundActiveId: string | null;
  /** Per–Bing-URL focal points (extension keys are HTTPS image URLs). */
  bingWallpaperFramings: TBingWallpaperFramings;
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  debugPluginSource: boolean;
  /** @deprecated Prefer `notes`; kept for storage/load migration only. */
  notesText: string;
  notes: INote[];
  /** Pinned-note editor panels shown on the HUD canvas. */
  notePanels: INotePanel[];
  todos: ITodoItem[];
  /** When true, panels are not snapped to the HUD grid on drop. */
  hudLayoutChaotic: boolean;
  /** When true, panel drag handles are disabled until unlocked. */
  hudLayoutLocked: boolean;
  /** Percentage positions of draggable HUD panels within the canvas. */
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  /**
   * After first-run settings intro is finished, stays true so the welcome callout does not repeat.
   * Fresh installs default to false; upgraded profiles without stored value stay “seen”.
   */
  hasSeenSettingsIntro: boolean;
}

const SYNC_KEY = "tabocalypseSync";
const LOCAL_KEY = "tabocalypseLocal";
/** Same payload as `SYNC_KEY`, stored in `storage.local` so preferences survive sync quota/errors and new tabs read the latest save immediately. */
const SYNC_LOCAL_MIRROR_KEY = "tabocalypseSyncMirror";

/** Keys read together from `browser.storage.local` for settings (also used to filter `storage.onChanged`). */
export const TABOCALYPSE_SETTINGS_LOCAL_KEYS = [LOCAL_KEY, SYNC_LOCAL_MIRROR_KEY] as const;

/** Minimal shape of `browser.storage.StorageChange` for `onChanged` filtering. */
type TStorageChange = { oldValue?: unknown; newValue?: unknown };

export function isTabocalypseSettingsStorageChange(
  changes: Record<string, TStorageChange | undefined>,
  areaName: string,
): boolean {
  if (areaName === "local") {
    return TABOCALYPSE_SETTINGS_LOCAL_KEYS.some((k) => changes[k] !== undefined);
  }
  if (areaName === "sync") {
    return changes[SYNC_KEY] !== undefined;
  }
  return false;
}

function mergeSyncFromSources(
  cloud: Partial<ISyncSlice> | undefined,
  mirror: Partial<ISyncSlice> | undefined,
): Partial<ISyncSlice> | undefined {
  if (!cloud && !mirror) return undefined;
  return { ...cloud, ...mirror };
}

export interface ISyncSlice {
  version: 1;
  preset: ISettings["preset"];
  themeMode: TThemeMode;
  themePalette: TThemePalette;
  themeCustomAccent: string;
  themeCustomAccent2: string;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  humorBuiltinVoice: THumorBuiltinVoice;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: ISettings["searchEngine"];
  weatherLat: number;
  weatherLon: number;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  clockHourFormat: TClockHourFormat;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: ISettings["backgroundKind"];
  backgroundSolid: string;
  backgroundGradientMid: string;
  backgroundGradientEnd: string;
  backgroundGradientShape: TBackgroundGradientShape;
  backgroundGradientAngleDeg: number;
  backgroundGradientCenterXPct: number;
  backgroundGradientCenterYPct: number;
  debugPluginSource: boolean;
  hasSeenSettingsIntro: boolean;
}

export interface ILocalSlice {
  version: 1;
  userBackgroundDataUrl: string | null;
  userBackgroundDataUrls: string[];
  userBackgroundImages?: IUserBackgroundImage[];
  userBackgroundActiveId?: string | null;
  bingWallpaperFramings?: TBingWallpaperFramings;
  backgroundRotate: boolean;
  backgroundRotateMinutesBing?: number;
  backgroundRotateMinutesUser?: number;
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  notesText: string;
  notes?: INote[];
  notePanels?: INotePanel[];
  todos: ITodoItem[];
  hudLayoutChaotic?: boolean;
  hudLayoutLocked?: boolean;
  hudPanelPositions?: Partial<Record<THudPanelId, IHudPanelPosition>>;
}

/** HUD defaults align with three-column positions in `hud-layout`; optional-permission widgets stay off. */
export const DEFAULT_WIDGETS: Record<TWidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: true,
  todo: true,
  weather: true,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
};

/** Merge stored widget toggles into defaults; ignores unknown keys (e.g. removed widgets). */
export function mergeWidgets(
  partial: Partial<Record<string, unknown>> | undefined,
): Record<TWidgetKey, boolean> {
  const base = { ...DEFAULT_WIDGETS };
  if (!partial || typeof partial !== "object") return base;
  for (const key of Object.keys(base) as TWidgetKey[]) {
    const v = partial[key];
    if (typeof v === "boolean") base[key] = v;
  }
  return base;
}

/** User-visible names for the Widgets settings list (storage keys stay `TWidgetKey`). */
export const WIDGET_LABELS: Record<TWidgetKey, string> = {
  search: "Search",
  clock: "Clock",
  notes: "Notes",
  todo: "To-do",
  weather: "Weather",
  topSites: "Top sites",
  bookmarksStrip: "Bookmarks strip",
  tabGuilt: "Tab guilt",
  humorBanner: "Humor banner",
};

export function defaultSettings(): ISettings {
  return {
    version: 1,
    preset: "chaos",
    themeMode: "dark",
    themePalette: "glitch",
    themeCustomAccent: DEFAULT_THEME_CUSTOM_ACCENT,
    themeCustomAccent2: DEFAULT_THEME_CUSTOM_ACCENT2,
    humorEnabled: true,
    humorIntensity: "spicy",
    humorBuiltinVoice: "gen_z",
    humorBuiltinPackIds: [
      "office_absurd",
      "tab_shame",
      "error_messages",
      "dev_snark",
      "existential",
    ],
    spicyContentAcknowledged: false,
    widgets: { ...DEFAULT_WIDGETS },
    searchEngine: "ddg",
    weatherLat: 40.7128,
    weatherLon: -74.006,
    weatherTemperatureUnit: "celsius",
    clockHourFormat: "24h",
    weatherAutoGeo: false,
    useOpenWeather: false,
    backgroundKind: "gradient",
    backgroundRotate: true,
    backgroundRotateMinutesBing: DEFAULT_BACKGROUND_ROTATE_MINUTES,
    backgroundRotateMinutesUser: DEFAULT_BACKGROUND_ROTATE_MINUTES,
    backgroundSolid: "#0f0f12",
    backgroundGradientMid: themeGradientStops("dark").mid,
    backgroundGradientEnd: themeGradientStops("dark").end,
    backgroundGradientShape: "linear",
    backgroundGradientAngleDeg: 145,
    backgroundGradientCenterXPct: 50,
    backgroundGradientCenterYPct: 50,
    userBackgroundDataUrl: null,
    userBackgroundDataUrls: [],
    userBackgroundImages: [],
    userBackgroundActiveId: null,
    bingWallpaperFramings: {},
    openWeatherApiKey: "",
    openaiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    myLines: [],
    importedPacks: [],
    importedPlugins: [],
    debugPluginSource: false,
    notesText: "",
    notes: [],
    notePanels: [],
    todos: [],
    hudLayoutChaotic: true,
    hudLayoutLocked: false,
    hudPanelPositions: mergeHudPanelPositions(undefined),
    hasSeenSettingsIntro: false,
  };
}

function toSync(s: ISettings): ISyncSlice {
  return {
    version: 1,
    preset: s.preset,
    themeMode: s.themeMode,
    themePalette: s.themePalette,
    themeCustomAccent: s.themeCustomAccent,
    themeCustomAccent2: s.themeCustomAccent2,
    humorEnabled: s.humorEnabled,
    humorIntensity: s.humorIntensity,
    humorBuiltinVoice: s.humorBuiltinVoice,
    humorBuiltinPackIds: s.humorBuiltinPackIds,
    spicyContentAcknowledged: s.spicyContentAcknowledged,
    widgets: s.widgets,
    searchEngine: s.searchEngine,
    weatherLat: s.weatherLat,
    weatherLon: s.weatherLon,
    weatherTemperatureUnit: s.weatherTemperatureUnit,
    clockHourFormat: s.clockHourFormat,
    weatherAutoGeo: s.weatherAutoGeo,
    useOpenWeather: s.useOpenWeather,
    backgroundKind: s.backgroundKind,
    backgroundSolid: s.backgroundSolid,
    backgroundGradientMid: s.backgroundGradientMid,
    backgroundGradientEnd: s.backgroundGradientEnd,
    backgroundGradientShape: s.backgroundGradientShape,
    backgroundGradientAngleDeg: s.backgroundGradientAngleDeg,
    backgroundGradientCenterXPct: s.backgroundGradientCenterXPct,
    backgroundGradientCenterYPct: s.backgroundGradientCenterYPct,
    debugPluginSource: s.debugPluginSource,
    hasSeenSettingsIntro: s.hasSeenSettingsIntro,
  };
}

function toLocal(s: ISettings): ILocalSlice {
  return {
    version: 1,
    userBackgroundDataUrl: s.userBackgroundDataUrl,
    userBackgroundDataUrls: s.userBackgroundDataUrls,
    userBackgroundImages: s.userBackgroundImages,
    userBackgroundActiveId: s.userBackgroundActiveId,
    bingWallpaperFramings: s.bingWallpaperFramings,
    backgroundRotate: s.backgroundRotate,
    backgroundRotateMinutesBing: s.backgroundRotateMinutesBing,
    backgroundRotateMinutesUser: s.backgroundRotateMinutesUser,
    openWeatherApiKey: s.openWeatherApiKey,
    openaiApiKey: s.openaiApiKey,
    openaiBaseUrl: s.openaiBaseUrl,
    myLines: s.myLines,
    importedPacks: s.importedPacks,
    importedPlugins: s.importedPlugins,
    notesText: s.notesText,
    notes: s.notes,
    notePanels: s.notePanels,
    todos: s.todos,
    hudLayoutChaotic: s.hudLayoutChaotic,
    hudLayoutLocked: s.hudLayoutLocked,
    hudPanelPositions: s.hudPanelPositions,
  };
}

function buildUserBackgroundImagesFromLocal(
  local: Partial<ILocalSlice> | undefined,
): IUserBackgroundImage[] {
  const fromStorage = coerceUserBackgroundImagesFromStorage(local?.userBackgroundImages);
  if (fromStorage.length > 0) return fromStorage;
  const legacySingle = local?.userBackgroundDataUrl ?? null;
  const legacyList =
    (local?.userBackgroundDataUrls ?? []).length > 0
      ? local!.userBackgroundDataUrls!
      : legacySingle
        ? [legacySingle]
        : [];
  return legacyList.map((dataUrl, index) => ({
    id: stableUserBackgroundIdFromDataUrl(dataUrl, index),
    dataUrl,
    positionXPct: 50,
    positionYPct: 50,
  }));
}

/** Chaos preset spicy jokes + humor strip (parity with {@link applyPreset} chaos branch). */
export function applyChaosPresetHumorHarmony(s: ISettings): ISettings {
  if (s.preset !== "chaos") return s;
  let humorIntensity = s.humorIntensity;
  if (humorIntensity === "off" || humorIntensity === "mild") {
    humorIntensity = "spicy";
  }
  return {
    ...s,
    humorEnabled: true,
    humorIntensity,
    widgets: { ...s.widgets, humorBanner: true },
  };
}

function mergeSettings(
  sync: Partial<ISyncSlice> | undefined,
  local: Partial<ILocalSlice> | undefined,
): ISettings {
  const d = defaultSettings();
  const userBackgroundImages = buildUserBackgroundImagesFromLocal(local);
  let userBackgroundActiveId =
    typeof local?.userBackgroundActiveId === "string" ? local.userBackgroundActiveId.trim() : null;
  const validIds = new Set(userBackgroundImages.map((im) => im.id));
  if (userBackgroundActiveId && !validIds.has(userBackgroundActiveId)) {
    userBackgroundActiveId = null;
  }
  const userBackgroundDataUrls = userBackgroundImages.map((im) => im.dataUrl);
  const primary =
    userBackgroundActiveId && validIds.has(userBackgroundActiveId)
      ? userBackgroundImages.find((im) => im.id === userBackgroundActiveId)
      : userBackgroundImages[0];
  const userBackgroundDataUrl = primary?.dataUrl ?? null;

  const resolvedThemeMode = coerceThemeMode(sync?.themeMode, d.themeMode);
  const bgGradientFallback = themeGradientStops(resolvedThemeMode);
  const backgroundRotateMinutesBing = coerceBackgroundRotateMinutes(
    local?.backgroundRotateMinutesBing,
    d.backgroundRotateMinutesBing,
  );
  const backgroundRotateMinutesUser = coerceBackgroundRotateMinutes(
    local?.backgroundRotateMinutesUser,
    d.backgroundRotateMinutesUser,
  );
  const mergeNow = Date.now();
  let mergedNotes = coerceNotes(local?.notes);
  const legacyNotesText = typeof local?.notesText === "string" ? local.notesText : "";
  if (mergedNotes.length === 0 && legacyNotesText.trim().length > 0) {
    mergedNotes = migrateLegacyNotesTextIntoNotes(legacyNotesText, mergeNow);
  }
  const mergedNoteIds = new Set(mergedNotes.map((n) => n.id));
  const mergedNotePanels = coerceNotePanels(local?.notePanels, mergedNoteIds);

  const preset = coercePreset(sync?.preset, d.preset);

  const mergedBase: ISettings = {
    version: 1,
    preset,
    themeMode: resolvedThemeMode,
    themePalette: coerceThemePalette(sync?.themePalette, d.themePalette),
    themeCustomAccent: coerceThemeHex(sync?.themeCustomAccent, d.themeCustomAccent),
    themeCustomAccent2: coerceThemeHex(sync?.themeCustomAccent2, d.themeCustomAccent2),
    humorEnabled: sync?.humorEnabled ?? d.humorEnabled,
    humorIntensity: sync?.humorIntensity ?? d.humorIntensity,
    humorBuiltinVoice:
      sync === undefined
        ? d.humorBuiltinVoice
        : coerceHumorBuiltinVoice({
            humorBuiltinVoice: sync.humorBuiltinVoice,
            humorGenZMode: (sync as { humorGenZMode?: boolean }).humorGenZMode,
          }),
    humorBuiltinPackIds: sync?.humorBuiltinPackIds ?? d.humorBuiltinPackIds,
    spicyContentAcknowledged: sync?.spicyContentAcknowledged ?? d.spicyContentAcknowledged,
    hasSeenSettingsIntro:
      typeof sync?.hasSeenSettingsIntro === "boolean"
        ? sync.hasSeenSettingsIntro
        : sync
          ? true
          : d.hasSeenSettingsIntro,
    widgets: mergeWidgets(sync?.widgets as Partial<Record<string, unknown>> | undefined),
    searchEngine: sync?.searchEngine ?? d.searchEngine,
    weatherLat: sync?.weatherLat ?? d.weatherLat,
    weatherLon: sync?.weatherLon ?? d.weatherLon,
    weatherTemperatureUnit: coerceWeatherTemperatureUnit(
      sync?.weatherTemperatureUnit,
      d.weatherTemperatureUnit,
    ),
    clockHourFormat: coerceClockHourFormat(sync?.clockHourFormat, d.clockHourFormat),
    weatherAutoGeo: sync?.weatherAutoGeo ?? d.weatherAutoGeo,
    useOpenWeather: sync?.useOpenWeather ?? d.useOpenWeather,
    backgroundKind: sync?.backgroundKind ?? d.backgroundKind,
    backgroundRotate:
      typeof local?.backgroundRotate === "boolean" ? local.backgroundRotate : d.backgroundRotate,
    backgroundRotateMinutesBing,
    backgroundRotateMinutesUser,
    backgroundSolid: coerceThemeHex(sync?.backgroundSolid, d.backgroundSolid),
    backgroundGradientMid: coerceThemeHex(sync?.backgroundGradientMid, bgGradientFallback.mid),
    backgroundGradientEnd: coerceThemeHex(sync?.backgroundGradientEnd, bgGradientFallback.end),
    backgroundGradientShape: coerceBackgroundGradientShape(
      sync?.backgroundGradientShape,
      d.backgroundGradientShape,
    ),
    backgroundGradientAngleDeg: coerceBackgroundGradientAngleDeg(
      sync?.backgroundGradientAngleDeg,
      d.backgroundGradientAngleDeg,
    ),
    backgroundGradientCenterXPct: coerceBackgroundGradientCenterPct(
      sync?.backgroundGradientCenterXPct,
      d.backgroundGradientCenterXPct,
    ),
    backgroundGradientCenterYPct: coerceBackgroundGradientCenterPct(
      sync?.backgroundGradientCenterYPct,
      d.backgroundGradientCenterYPct,
    ),
    debugPluginSource: sync?.debugPluginSource ?? d.debugPluginSource,
    userBackgroundDataUrl,
    userBackgroundDataUrls,
    userBackgroundImages,
    userBackgroundActiveId,
    bingWallpaperFramings: coerceBingWallpaperFramings(local?.bingWallpaperFramings),
    openWeatherApiKey: local?.openWeatherApiKey ?? d.openWeatherApiKey,
    openaiApiKey: local?.openaiApiKey ?? d.openaiApiKey,
    openaiBaseUrl: local?.openaiBaseUrl ?? d.openaiBaseUrl,
    myLines: local?.myLines ?? d.myLines,
    importedPacks: local?.importedPacks ?? d.importedPacks,
    importedPlugins: local?.importedPlugins ?? d.importedPlugins,
    notesText: "",
    notes: mergedNotes,
    notePanels: mergedNotePanels,
    todos: local?.todos ?? d.todos,
    hudLayoutChaotic: local?.hudLayoutChaotic ?? d.hudLayoutChaotic,
    hudLayoutLocked: local?.hudLayoutLocked ?? d.hudLayoutLocked,
    hudPanelPositions: mergeHudPanelPositions(local?.hudPanelPositions),
  };
  return applyChaosPresetHumorHarmony(mergedBase);
}

export async function loadSettings(): Promise<ISettings> {
  const localRaw = await browser.storage.local.get([...TABOCALYPSE_SETTINGS_LOCAL_KEYS]);
  const syncRaw = browser.storage.sync
    ? await browser.storage.sync.get(SYNC_KEY)
    : ({} as Record<string, unknown>);
  const cloudSync = syncRaw[SYNC_KEY] as ISyncSlice | undefined;
  const mirrorSync = localRaw[SYNC_LOCAL_MIRROR_KEY] as ISyncSlice | undefined;
  const sync = mergeSyncFromSources(cloudSync, mirrorSync);
  const local = localRaw[LOCAL_KEY] as ILocalSlice | undefined;
  return mergeSettings(sync, local);
}

function isSyncQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.includes("MAX_WRITE_OPERATIONS") || msg.includes("QUOTA_BYTES") || msg.includes("MAX_ITEMS")
  );
}

export async function saveSettings(s: ISettings): Promise<void> {
  const syncPayload = toSync(s);
  const writes: Promise<unknown>[] = [
    browser.storage.local.set({
      [LOCAL_KEY]: toLocal(s),
      [SYNC_LOCAL_MIRROR_KEY]: syncPayload,
    }),
  ];
  if (browser.storage.sync) {
    writes.push(
      browser.storage.sync.set({ [SYNC_KEY]: syncPayload }).catch((err: unknown) => {
        if (isSyncQuotaError(err)) {
          if (import.meta.env.DEV) {
            console.warn("[Tabocalypse] sync write throttled:", err);
          }
          throw new Error(
            "Settings are changing too fast for browser sync. Your changes are saved locally — they'll sync once things settle down. Wait a moment before making more changes.",
          );
        }
        throw err;
      }),
    );
  }
  await Promise.all(writes);
}

export function applyPreset(preset: ISettings["preset"], s: ISettings): ISettings {
  const next = { ...s, preset };
  if (preset === "focus") {
    next.humorEnabled = false;
    next.humorIntensity = "off";
    next.widgets = {
      ...s.widgets,
      humorBanner: false,
      search: true,
      clock: true,
    };
  } else if (preset === "balanced") {
    next.humorEnabled = true;
    next.humorIntensity = "mild";
    next.widgets = { ...defaultSettings().widgets, ...s.widgets, humorBanner: true };
  } else {
    next.humorEnabled = true;
    next.humorIntensity = "spicy";
    next.widgets = { ...s.widgets, humorBanner: true };
  }
  return next;
}
