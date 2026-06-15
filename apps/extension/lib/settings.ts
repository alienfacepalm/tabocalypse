import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import browser from "webextension-polyfill";
import {
  HUD_LAYOUT_REFERENCE_CANVAS,
  HUD_PANEL_IDS,
  clampHudScalar,
  mergeHudPanelPositions,
  type IHudPanelPosition,
  type THudPanelId,
  type THudPanelPositionsByDisplay,
  type TNotePanelsByDisplay,
} from "./hud-layout";
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
import { coercePeapixBingCountry, type TPeapixBingCountry } from "./bing-wallpaper-country";
import { coerceClockHourFormat, type TClockHourFormat } from "./clock-hour-format";
import { coerceWeatherPanelView, type TWeatherPanelView } from "./weather/weather-panel-view";
import {
  coerceWeatherTenDayLayout,
  type TWeatherTenDayLayout,
} from "./weather/weather-ten-day-layout";
import {
  coerceWeatherTemperatureUnit,
  type TWeatherTemperatureUnit,
} from "./weather/weather-units";
import { coerceCryptoChartDays, type TCryptoChartDays } from "./crypto/crypto-chart-days";
import type { TBalancedNewsCategory } from "./news/balanced-news-types";
import {
  coerceBalancedNewsCategory,
  coerceBalancedNewsTopicCount,
  defaultBalancedNewsCategoryForCountry,
  inferBalancedNewsCountryFromNavigator,
} from "./news/balanced-news-country";
import {
  DEFAULT_EXPERIMENTAL_FEATURES,
  mergeExperimentalFeatures,
  type TExperimentalFeatureFlag,
} from "./feature-flags";

export type { TExperimentalFeatureFlag } from "./feature-flags";
export {
  DEFAULT_EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURE_DESCRIPTIONS,
  EXPERIMENTAL_FEATURE_FLAG_KEYS,
  EXPERIMENTAL_FEATURE_LABELS,
  isExperimentalFeatureEnabled,
  mergeExperimentalFeatures,
} from "./feature-flags";

export type { TCryptoChartDays };
export { coerceCryptoChartDays };

export type { IHudPanelPosition, THudPanelId, THudPanelPositionsByDisplay } from "./hud-layout";

export type { TThemeMode, TThemePalette } from "./theme";
export { coerceClockHourFormat, type TClockHourFormat } from "./clock-hour-format";
export type { TWeatherPanelView } from "./weather/weather-panel-view";
export type { TWeatherTenDayLayout } from "./weather/weather-ten-day-layout";
export type { TWeatherTemperatureUnit } from "./weather/weather-units";

export type THumorIntensity = "off" | "mild" | "spicy" | "unhinged";

export type TPresetKey = "focus" | "balanced" | "chaos";

/** Validates stored/imported preset; unknown values fall back (fresh installs → chaos). */
export function coercePreset(raw: unknown, fallback: TPresetKey): TPresetKey {
  if (raw === "focus" || raw === "balanced" || raw === "chaos") return raw;
  return fallback;
}

/**
 * Built-in roast “voice” for the humor banner.
 * Only one specialty voice at a time; `default` uses per-pack toggles.
 * Classic jargon can still be mixed in via `humorIncludeUnsuckClassics` when not already the locked voice.
 */
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
  | "crypto"
  | "speedTest"
  | "topSites"
  | "bookmarksStrip"
  | "tabGuilt"
  | "humorBanner"
  | "aiChat"
  | "balancedNews";

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
  /** Legacy storage field; display titles come from {@link deriveNoteTitle} on {@link text}. */
  name: string;
  tags: string[];
  text: string;
  /** When true, body cannot change and the note cannot be deleted; panels can still be hidden. */
  locked: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Max words used when building a display title from note body text. */
export const NOTE_TITLE_MAX_WORDS = 6;

/** Build a short title from the first non-empty line of note text (first few words). */
export function deriveNoteTitle(
  text: string | null | undefined,
  maxWords: number = NOTE_TITLE_MAX_WORDS,
): string {
  const body = typeof text === "string" ? text : "";
  const rawLines = body.split(/\r?\n/);
  let firstLineIndex = -1;
  let firstLine = "";
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i]!.trim();
    if (trimmed.length > 0) {
      firstLineIndex = i;
      firstLine = trimmed;
      break;
    }
  }
  if (!firstLine) return "Empty note";

  const words = firstLine.split(/\s+/).filter(Boolean);
  const truncatedOnLine = words.length > maxWords;
  const titleWords = words.slice(0, maxWords);
  const hasMoreLines = rawLines.slice(firstLineIndex + 1).some((line) => line.trim().length > 0);

  let title = titleWords.join(" ");
  if (truncatedOnLine || hasMoreLines) {
    title += "…";
  }
  return title;
}

export type TNotePersistPatch = Partial<Pick<INote, "name" | "tags" | "text" | "locked">>;

/** Merge a note patch respecting `locked`; returns null if the update is rejected. */
export function applyNotePersistPatch(
  note: INote,
  patch: TNotePersistPatch,
  now: number,
): INote | null {
  if (note.locked) {
    const keys = Object.keys(patch) as (keyof TNotePersistPatch)[];
    if (keys.length !== 1 || patch.locked !== false) return null;
    return { ...note, locked: false, updatedAt: now };
  }
  return { ...note, ...patch, updatedAt: now };
}

export function isNoteDeleteAllowed(note: INote): boolean {
  return !note.locked;
}

/**
 * Apply a storage reload without clobbering in-memory note edits that are newer than disk.
 * - For each id in `incoming`, keep whichever of `(baseline, incoming)` has the greater `updatedAt`
 *   (ties prefer `baseline` so unsaved local keystrokes win on equal timestamps).
 * - Appends baseline-only ids so a note created + edited before the first successful write is not dropped.
 */
export function mergeNotesPreferNewerBaseline(
  baseline: readonly INote[],
  incoming: readonly INote[],
): INote[] {
  const prevById = new Map(baseline.map((n) => [n.id, n]));
  const incomingIds = new Set(incoming.map((n) => n.id));
  const out: INote[] = [];
  for (const inc of incoming) {
    const loc = prevById.get(inc.id);
    if (!loc || loc.updatedAt < inc.updatedAt) {
      out.push(inc);
    } else {
      out.push(loc);
    }
  }
  for (const loc of baseline) {
    if (!incomingIds.has(loc.id)) {
      out.push(loc);
    }
  }
  return out;
}

function mergeNotePanelsWhenEpochMatches(
  baseline: readonly INotePanel[],
  incoming: readonly INotePanel[],
  validNoteIds: ReadonlySet<string>,
): INotePanel[] {
  const incomingC = coerceNotePanels(incoming, validNoteIds);
  const baselineC = coerceNotePanels(baseline, validNoteIds);
  const incById = new Map(incomingC.map((p) => [p.noteId, p]));
  const baseById = new Map(baselineC.map((p) => [p.noteId, p]));
  const order: string[] = [];
  for (const p of incomingC) {
    if (!order.includes(p.noteId)) order.push(p.noteId);
  }
  for (const p of baselineC) {
    if (!order.includes(p.noteId)) order.push(p.noteId);
  }
  const out: INotePanel[] = [];
  for (const id of order) {
    const b = baseById.get(id);
    const i = incById.get(id);
    out.push(b ?? i!);
  }
  return out;
}

/**
 * Resolve `notePanels` when applying a storage reload alongside in-memory baseline.
 * Disk snapshots can briefly omit a panel that is already open locally (different write ordering),
 * or include a stale layout before a close persists; {@link mergeNotesPreferNewerBaseline}
 * fixes note text — this uses a monotonic `notePanelsEpoch` (bumped whenever `notePanels` changes).
 */
export function mergeNotePanelsForStorageReload(
  baseline: readonly INotePanel[],
  incoming: readonly INotePanel[],
  baselineEpoch: number,
  incomingEpoch: number,
  validNoteIds: ReadonlySet<string>,
): INotePanel[] {
  const bE = Number.isFinite(baselineEpoch) ? Math.max(0, Math.floor(baselineEpoch)) : 0;
  const iE = Number.isFinite(incomingEpoch) ? Math.max(0, Math.floor(incomingEpoch)) : 0;
  if (bE > iE) return coerceNotePanels(baseline, validNoteIds);
  if (iE > bE) return coerceNotePanels(incoming, validNoteIds);
  return mergeNotePanelsWhenEpochMatches(baseline, incoming, validNoteIds);
}

/** Fixed canvas placement for a sticky note (does not scale with viewport). */
export interface IStickyNotePosition {
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}

export const STICKY_NOTE_DEFAULT_SIZE_PX = { widthPx: 260, heightPx: 220 };

export const STICKY_NOTE_SIZE_LIMITS = {
  minW: 180,
  maxW: 640,
  minH: 140,
  maxH: 720,
} as const;

/** Clamp sticky outer size; optionally cap to remaining canvas space from {@link xPx}/{@link yPx}. */
export function clampStickyNoteSize(
  widthPx: number,
  heightPx: number,
  options?: { canvasW?: number; canvasH?: number; xPx?: number; yPx?: number },
): { widthPx: number; heightPx: number } {
  const L = STICKY_NOTE_SIZE_LIMITS;
  let w = Math.round(clampHudScalar(widthPx, L.minW, L.maxW));
  let h = Math.round(clampHudScalar(heightPx, L.minH, L.maxH));
  const canvasW = options?.canvasW;
  const canvasH = options?.canvasH;
  const xPx = options?.xPx;
  const yPx = options?.yPx;
  if (canvasW != null && xPx != null) {
    w = Math.min(w, Math.max(L.minW, canvasW - xPx));
  }
  if (canvasH != null && yPx != null) {
    h = Math.min(h, Math.max(L.minH, canvasH - yPx));
  }
  return { widthPx: w, heightPx: h };
}

/** A note placed on the canvas as a sticky (independent fixed pixel position). */
export interface INotePanel {
  noteId: string;
  position: IStickyNotePosition;
  /** When true, the sticky stays at {@link position}; cannot be dragged or auto-moved on resize. */
  pinned?: boolean;
}

/** Whether a note is shown as a sticky on the canvas (active). */
export function isNoteActive(noteId: string, notePanels: readonly INotePanel[]): boolean {
  return notePanels.some((p) => p.noteId === noteId);
}

/**
 * Whether the notes master list HUD panel should render.
 * With no active stickies the list is always shown; otherwise {@link notesListPanelVisible} applies.
 */
export function resolveNotesListPanelVisible(
  notePanels: readonly INotePanel[],
  notesListPanelVisible: boolean,
): boolean {
  if (notePanels.length === 0) return true;
  return notesListPanelVisible;
}

/** Default sticky placement when opening a note on the canvas. */
export function defaultStickyNotePosition(
  staggerIndex: number,
  anchor?: IHudPanelPosition,
): IStickyNotePosition {
  const refW = HUD_LAYOUT_REFERENCE_CANVAS.widthPx;
  const refH = HUD_LAYOUT_REFERENCE_CANVAS.heightPx;
  const { widthPx, heightPx } = STICKY_NOTE_DEFAULT_SIZE_PX;
  const baseX = anchor ? (anchor.xPct / 100) * refW : refW * 0.58;
  const baseY = anchor ? (anchor.yPct / 100) * refH : refH * 0.02;
  const stagger = staggerIndex * 24;
  return {
    xPx: Math.min(Math.max(0, refW - widthPx), Math.round(baseX + stagger)),
    yPx: Math.min(Math.max(0, refH - heightPx), Math.round(baseY + 48 + stagger)),
    widthPx,
    heightPx,
  };
}

function coerceStickyNotePosition(raw: unknown): IStickyNotePosition | null {
  if (typeof raw !== "object" || raw === null) return null;
  const pr = raw as Record<string, unknown>;
  const { widthPx: defaultW, heightPx: defaultH } = STICKY_NOTE_DEFAULT_SIZE_PX;

  let widthPx = defaultW;
  if (typeof pr.widthPx === "number" && Number.isFinite(pr.widthPx) && pr.widthPx > 0) {
    widthPx = Math.round(pr.widthPx);
  }

  let heightPx = defaultH;
  if (typeof pr.heightPx === "number" && Number.isFinite(pr.heightPx) && pr.heightPx > 0) {
    heightPx = Math.round(pr.heightPx);
  }

  if (
    typeof pr.xPx === "number" &&
    Number.isFinite(pr.xPx) &&
    typeof pr.yPx === "number" &&
    Number.isFinite(pr.yPx)
  ) {
    const xPx = Math.max(0, Math.round(pr.xPx));
    const yPx = Math.max(0, Math.round(pr.yPx));
    const sized = clampStickyNoteSize(widthPx, heightPx);
    return { xPx, yPx, ...sized };
  }

  const xPct = typeof pr.xPct === "number" && Number.isFinite(pr.xPct) ? pr.xPct : 0;
  const yPct = typeof pr.yPct === "number" && Number.isFinite(pr.yPct) ? pr.yPct : 0;
  const xPx = Math.max(0, Math.round((xPct / 100) * HUD_LAYOUT_REFERENCE_CANVAS.widthPx));
  const yPx = Math.max(0, Math.round((yPct / 100) * HUD_LAYOUT_REFERENCE_CANVAS.heightPx));
  const sized = clampStickyNoteSize(widthPx, heightPx);
  return { xPx, yPx, ...sized };
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
    const locked = o.locked === true;
    out.push({ id, name, tags, text, locked, createdAt, updatedAt });
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
    const position = coerceStickyNotePosition(o.position);
    if (!position) continue;
    const pinned = o.pinned === true;
    out.push({ noteId, position, ...(pinned ? { pinned: true } : {}) });
  }
  return out;
}

export function migrateLegacyNotesTextIntoNotes(text: string, now: number): INote[] {
  const trimmed = text.trim();
  if (!trimmed.length) return [];
  return [
    {
      id: newNoteId(),
      name: "",
      tags: [],
      text: trimmed,
      locked: false,
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
  /**
   * When true (Auto HUD) and the background is Bing or an uploaded image, primary and secondary
   * accents follow the wallpaper (lower area → main, upper band → secondary) whenever the visible
   * image changes; sampled colors are lightened for HUD readability, stored as the custom palette.
   * Defaults to on; turn off in Appearance to freeze manual accent colors on those backgrounds.
   */
  themeAccentsMatchWallpaper: boolean;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  /** Specialty built-in voice, or default mix controlled by `humorBuiltinPackIds`. */
  humorBuiltinVoice: THumorBuiltinVoice;
  humorIncludeUnsuckClassics: boolean;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: "ddg" | "google" | "bing";
  /** When true, Enter in the HUD search field opens the assist destination instead of classic web search. */
  searchAssistActive: boolean;
  /** Shared HUD latitude (Weather, Clock, Balanced News, …). Storage key keeps the `weather*` prefix. */
  weatherLat: number;
  /** Shared HUD longitude. Storage key keeps the `weather*` prefix. */
  weatherLon: number;
  /** Clears the default-location warning once the user updates HUD coordinates or enables auto geo. */
  weatherGeoAdjusted: boolean;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  /** When true, temperature units follow the browser locale; when false, `weatherTemperatureUnit` is fixed. */
  weatherTemperatureUnitAuto: boolean;
  /** Global HUD preference: 12-hour (with AM/PM) vs 24-hour time (clock, alarms, and other read-only timestamps). */
  clockHourFormat: TClockHourFormat;
  /** When true, clock hour cycle follows the browser locale; when false, `clockHourFormat` is fixed. */
  clockHourFormatAuto: boolean;
  /** When true, shared HUD coordinates update via one browser lookup per new tab (Settings → Weather / Optional permissions). */
  weatherAutoGeo: boolean;
  /** When true, the Weather HUD panel can switch to 2 Lakes buoy readings (Settings → Weather). */
  weatherLakesEmbedEnabled: boolean;
  /** Last Forecast / 10 Day / 2 Lakes choice in the Weather panel (2 Lakes only when lakes view is enabled). */
  weatherPanelView: TWeatherPanelView;
  /** Legacy 10-day layout preference (always stacked vertically). */
  weatherTenDayLayout: TWeatherTenDayLayout;
  /** Crypto widget: CoinGecko chart window (days param). */
  cryptoChartDays: TCryptoChartDays;
  /** When true, Balanced news region follows locale or device geo; when false, {@link balancedNewsCountry} is used. */
  balancedNewsCountryAuto: boolean;
  /** Peapix-style lowercase country code when {@link balancedNewsCountryAuto} is false. */
  balancedNewsCountry: TPeapixBingCountry;
  /** When true with auto region, prefer shared HUD coordinates for country resolution. */
  balancedNewsUseDeviceGeo: boolean;
  /** FreeQuickNews category filter for the Balanced news widget. */
  balancedNewsCategory: TBalancedNewsCategory;
  /** Optional FreeQuickNews API key (local only) for higher rate limits. */
  balancedNewsApiKey: string;
  /** Number of topic roundups shown in the Balanced news panel (3–10). */
  balancedNewsTopicCount: number;
  /** When true, Bing spotlight country follows browser locale; when false, {@link bingWallpaperCountry} is used. */
  bingWallpaperCountryAuto: boolean;
  /** Peapix `country` code when {@link bingWallpaperCountryAuto} is false. */
  bingWallpaperCountry: TPeapixBingCountry;
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
  openaiApiKey: string;
  /** Gemini API key when the Gemini preset is active (Google AI Studio). */
  geminiApiKey: string;
  openaiBaseUrl: string;
  /** OpenAI-compatible model id for BYO AI chat and tests. */
  openaiModel: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  debugPluginSource: boolean;
  /** @deprecated Prefer `notes`; kept for storage/load migration only. */
  notesText: string;
  notes: INote[];
  /**
   * Legacy/default sticky layout used when a display has no {@link notePanelsByDisplay} entry yet.
   * Active stickies are stored per monitor in {@link notePanelsByDisplay}.
   */
  notePanels: INotePanel[];
  /** Per-monitor active stickies and positions; keyed by {@link getHudDisplayLayoutKey}. */
  notePanelsByDisplay: TNotePanelsByDisplay;
  /**
   * Bump whenever {@link notePanels} is replaced (open/close/drag commit). Used to ignore stale
   * `notePanels` from `storage.onChanged` while saves are reordering (see merge on reload).
   */
  notePanelsEpoch: number;
  /** When false and at least one sticky is on the canvas, the notes list panel is hidden. */
  notesListPanelVisible: boolean;
  todos: ITodoItem[];
  /** When true, panels are not snapped to the HUD grid on drop. */
  hudLayoutChaotic: boolean;
  /** When true, panel drag handles are disabled until unlocked. */
  hudLayoutLocked: boolean;
  /**
   * Priority-1 layout control: when true, visible panels reflow on window resize (grid or chaotic).
   * When false, positions stay fixed on resize unless changed manually; chaotic/lock apply normally.
   */
  hudLayoutAutoReposition: boolean;
  /**
   * When layout is locked, still allow {@link hudLayoutAutoReposition} to reflow panels on resize
   * (manual drag remains disabled).
   */
  hudLayoutAdaptiveWhileLocked: boolean;
  /** Percentage positions of draggable HUD panels within the canvas. */
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
  /** Per-monitor overrides for {@link hudPanelPositions}; keyed by {@link getHudDisplayLayoutKey}. */
  hudPanelPositionsByDisplay: THudPanelPositionsByDisplay;
  /**
   * Per-monitor widget toggles layered on {@link widgets}; keyed by {@link getHudDisplayLayoutKey}.
   * Stored locally because monitor fingerprints differ per machine.
   */
  widgetsByDisplay: TWidgetsByDisplay;
  /**
   * After first-run settings intro is finished, stays true so the welcome callout does not repeat.
   * Fresh installs default to false; upgraded profiles without stored value stay “seen”.
   */
  hasSeenSettingsIntro: boolean;
  /** Opt-in experimental features (Settings > Experimental); synced across devices. */
  experimentalFeatures: Record<TExperimentalFeatureFlag, boolean>;
}

const SYNC_KEY = "tabocalypseSync";
const NOTES_SYNC_KEY = "tabocalypseNotes";
const LOCAL_KEY = "tabocalypseLocal";
/** Same payload as `SYNC_KEY`, stored in `storage.local` so preferences survive sync quota/errors and new tabs read the latest save immediately. */
const SYNC_LOCAL_MIRROR_KEY = "tabocalypseSyncMirror";
/** Same payload as `NOTES_SYNC_KEY`, mirrored under `storage.local` for the same reasons as prefs. */
const NOTES_SYNC_LOCAL_MIRROR_KEY = "tabocalypseNotesMirror";

/** Keys read together from `browser.storage.sync` for settings (also used to filter `storage.onChanged`). */
export const TABOCALYPSE_SETTINGS_SYNC_KEYS = [SYNC_KEY, NOTES_SYNC_KEY] as const;

/** Keys read together from `browser.storage.local` for settings (also used to filter `storage.onChanged`). */
export const TABOCALYPSE_SETTINGS_LOCAL_KEYS = [
  LOCAL_KEY,
  SYNC_LOCAL_MIRROR_KEY,
  NOTES_SYNC_LOCAL_MIRROR_KEY,
] as const;

/** Chromium per-item byte limit for `storage.sync` values. */
const SYNC_NOTES_MAX_BYTES = 8192;

export interface INotesSyncSlice {
  version: 1;
  notes: INote[];
  notePanels: INotePanel[];
  notePanelsEpoch: number;
  notesListPanelVisible?: boolean;
}

function syncJsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

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
    return changes[SYNC_KEY] !== undefined || changes[NOTES_SYNC_KEY] !== undefined;
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

function mergeNotesSyncFromSources(
  cloud: Partial<INotesSyncSlice> | undefined,
  mirror: Partial<INotesSyncSlice> | undefined,
): Partial<INotesSyncSlice> | undefined {
  if (!cloud && !mirror) return undefined;
  return { ...cloud, ...mirror };
}

/** Resolve notes from sync (cloud + mirror) and legacy local storage on load. */
function resolveNotesFromStorage(
  cloud: Partial<INotesSyncSlice> | undefined,
  mirror: Partial<INotesSyncSlice> | undefined,
  local: Partial<ILocalSlice> | undefined,
  mergeNow: number,
): Pick<ISettings, "notes" | "notePanels" | "notePanelsEpoch" | "notesListPanelVisible"> {
  const notesSync = mergeNotesSyncFromSources(cloud, mirror);
  const mirrorNotes = coerceNotes(mirror?.notes);
  const cloudNotes = coerceNotes(cloud?.notes);
  let notes = mergeNotesPreferNewerBaseline(mirrorNotes, cloudNotes);
  const legacyLocalNotes = coerceNotes(local?.notes);
  if (legacyLocalNotes.length > 0) {
    notes = mergeNotesPreferNewerBaseline(notes, legacyLocalNotes);
  }
  const legacyNotesText = typeof local?.notesText === "string" ? local.notesText : "";
  if (notes.length === 0 && legacyNotesText.trim().length > 0) {
    notes = migrateLegacyNotesTextIntoNotes(legacyNotesText, mergeNow);
  }

  const mergedNoteIds = new Set(notes.map((n) => n.id));
  const mirrorEpoch =
    typeof mirror?.notePanelsEpoch === "number" && Number.isFinite(mirror.notePanelsEpoch)
      ? Math.max(0, Math.floor(mirror.notePanelsEpoch))
      : 0;
  const cloudEpoch =
    typeof cloud?.notePanelsEpoch === "number" && Number.isFinite(cloud.notePanelsEpoch)
      ? Math.max(0, Math.floor(cloud.notePanelsEpoch))
      : 0;
  let notePanels = mergeNotePanelsForStorageReload(
    coerceNotePanels(mirror?.notePanels, mergedNoteIds),
    coerceNotePanels(cloud?.notePanels, mergedNoteIds),
    mirrorEpoch,
    cloudEpoch,
    mergedNoteIds,
  );
  let notePanelsEpoch = Math.max(mirrorEpoch, cloudEpoch);

  if (local?.notePanels) {
    const localEpoch =
      typeof local.notePanelsEpoch === "number" && Number.isFinite(local.notePanelsEpoch)
        ? Math.max(0, Math.floor(local.notePanelsEpoch))
        : 0;
    notePanels = mergeNotePanelsForStorageReload(
      notePanels,
      coerceNotePanels(local.notePanels, mergedNoteIds),
      notePanelsEpoch,
      localEpoch,
      mergedNoteIds,
    );
    notePanelsEpoch = Math.max(notePanelsEpoch, localEpoch);
  } else if (notesSync?.notePanels) {
    notePanels = coerceNotePanels(notesSync.notePanels, mergedNoteIds);
    if (
      typeof notesSync.notePanelsEpoch === "number" &&
      Number.isFinite(notesSync.notePanelsEpoch)
    ) {
      notePanelsEpoch = Math.max(0, Math.floor(notesSync.notePanelsEpoch));
    }
  }

  if (notePanels.length > 0 && notePanelsEpoch === 0) {
    notePanelsEpoch = 1;
  }

  const notesSyncMerged = mergeNotesSyncFromSources(cloud, mirror);
  const notesListPanelVisible =
    typeof notesSyncMerged?.notesListPanelVisible === "boolean"
      ? notesSyncMerged.notesListPanelVisible
      : true;

  return { notes, notePanels, notePanelsEpoch, notesListPanelVisible };
}

export interface ISyncSlice {
  version: 1;
  preset: ISettings["preset"];
  themeMode: TThemeMode;
  themePalette: TThemePalette;
  themeCustomAccent: string;
  themeCustomAccent2: string;
  themeAccentsMatchWallpaper: boolean;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  humorBuiltinVoice: THumorBuiltinVoice;
  humorIncludeUnsuckClassics: boolean;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: ISettings["searchEngine"];
  searchAssistActive: boolean;
  weatherLat: number;
  weatherLon: number;
  weatherGeoAdjusted: boolean;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  weatherTemperatureUnitAuto: boolean;
  clockHourFormat: TClockHourFormat;
  clockHourFormatAuto: boolean;
  weatherAutoGeo: boolean;
  weatherLakesEmbedEnabled: boolean;
  weatherPanelView: TWeatherPanelView;
  weatherTenDayLayout: TWeatherTenDayLayout;
  cryptoChartDays: TCryptoChartDays;
  balancedNewsCountryAuto: boolean;
  balancedNewsCountry: ISettings["balancedNewsCountry"];
  balancedNewsUseDeviceGeo: boolean;
  balancedNewsCategory: TBalancedNewsCategory;
  balancedNewsTopicCount: number;
  bingWallpaperCountryAuto: boolean;
  bingWallpaperCountry: ISettings["bingWallpaperCountry"];
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
  experimentalFeatures: Record<TExperimentalFeatureFlag, boolean>;
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
  openaiApiKey: string;
  /** Gemini API key when the Gemini preset is active (Google AI Studio). */
  geminiApiKey: string;
  openaiBaseUrl: string;
  /** OpenAI-compatible model id for BYO AI chat and tests. */
  openaiModel: string;
  balancedNewsApiKey: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  notesText: string;
  /** @deprecated Migrated to `storage.sync` — read only when upgrading from older local-only storage. */
  notes?: INote[];
  /** @deprecated Migrated to `storage.sync` — read only when upgrading from older local-only storage. */
  notePanels?: INotePanel[];
  /** @deprecated Migrated to `storage.sync` — read only when upgrading from older local-only storage. */
  notePanelsEpoch?: number;
  todos: ITodoItem[];
  hudLayoutChaotic?: boolean;
  hudLayoutLocked?: boolean;
  hudLayoutAutoReposition?: boolean;
  hudLayoutAdaptiveWhileLocked?: boolean;
  hudPanelPositions?: Partial<Record<THudPanelId, IHudPanelPosition>>;
  hudPanelPositionsByDisplay?: THudPanelPositionsByDisplay;
  notePanelsByDisplay?: TNotePanelsByDisplay;
  widgetsByDisplay?: TWidgetsByDisplay;
  /** @deprecated Migrated to {@link notePanelsByDisplay} on load. */
  notePanelPositionsByDisplay?: unknown;
}

function coerceSingleHudPanelPosition(raw: unknown): IHudPanelPosition | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as IHudPanelPosition;
  if (!Number.isFinite(p.xPct) || !Number.isFinite(p.yPct)) return null;
  const next: IHudPanelPosition = { xPct: p.xPct, yPct: p.yPct };
  if (typeof p.widthPx === "number" && Number.isFinite(p.widthPx) && p.widthPx > 0) {
    next.widthPx = p.widthPx;
  }
  if (typeof p.heightPx === "number" && Number.isFinite(p.heightPx) && p.heightPx > 0) {
    next.heightPx = p.heightPx;
  }
  return next;
}

function coerceNotePanelsByDisplay(
  raw: unknown,
  validNoteIds: ReadonlySet<string>,
): TNotePanelsByDisplay {
  if (!raw || typeof raw !== "object") return {};
  const out: TNotePanelsByDisplay = {};
  for (const [displayKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof displayKey !== "string") continue;
    if (Array.isArray(value)) {
      out[displayKey] = coerceNotePanels(value, validNoteIds);
      continue;
    }
    if (!value || typeof value !== "object") continue;
    const partial: Partial<Record<string, IStickyNotePosition>> = {};
    for (const [noteId, posRaw] of Object.entries(value as Record<string, unknown>)) {
      if (!validNoteIds.has(noteId)) continue;
      const position = coerceStickyNotePosition(posRaw);
      if (position) partial[noteId] = position;
    }
    if (Object.keys(partial).length > 0) {
      const panels: INotePanel[] = [];
      for (const [noteId, position] of Object.entries(partial)) {
        if (position) panels.push({ noteId, position });
      }
      if (panels.length > 0) out[displayKey] = panels;
    }
  }
  return out;
}

function migrateLegacyNotePanelPositionsByDisplay(
  base: readonly INotePanel[],
  raw: unknown,
  validNoteIds: ReadonlySet<string>,
): TNotePanelsByDisplay {
  if (!raw || typeof raw !== "object") return {};
  const out: TNotePanelsByDisplay = {};
  for (const [displayKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      typeof displayKey !== "string" ||
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      continue;
    }
    const partial: Partial<Record<string, IStickyNotePosition>> = {};
    for (const [noteId, posRaw] of Object.entries(value as Record<string, unknown>)) {
      if (!validNoteIds.has(noteId)) continue;
      const position = coerceStickyNotePosition(posRaw);
      if (position) partial[noteId] = position;
    }
    if (Object.keys(partial).length === 0) continue;
    out[displayKey] = base.map((panel) => ({
      ...panel,
      position: partial[panel.noteId] ?? panel.position,
    }));
  }
  return out;
}

function coerceHudPanelPositionsByDisplay(raw: unknown): THudPanelPositionsByDisplay {
  if (!raw || typeof raw !== "object") return {};
  const out: THudPanelPositionsByDisplay = {};
  for (const [displayKey, panelsRaw] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof displayKey !== "string" || !panelsRaw || typeof panelsRaw !== "object") continue;
    const partial: Partial<Record<THudPanelId, IHudPanelPosition>> = {};
    for (const id of HUD_PANEL_IDS) {
      const next = coerceSingleHudPanelPosition(
        (panelsRaw as Partial<Record<THudPanelId, unknown>>)[id],
      );
      if (next) partial[id] = next;
    }
    if (Object.keys(partial).length > 0) out[displayKey] = partial;
  }
  return out;
}

/**
 * Whether auto-reposition on resize should run.
 * Priority 1: {@link hudLayoutAutoReposition} — when off, chaotic/lock rules apply and panels are not auto-reflowed.
 * When on, works in grid and chaotic modes; if layout is locked, {@link hudLayoutAdaptiveWhileLocked} must also be on.
 */
export function isHudAutoRepositionEnabled(
  s: Pick<
    ISettings,
    "hudLayoutAutoReposition" | "hudLayoutLocked" | "hudLayoutAdaptiveWhileLocked"
  >,
): boolean {
  if (!s.hudLayoutAutoReposition) return false;
  if (!s.hudLayoutLocked) return true;
  return s.hudLayoutAdaptiveWhileLocked;
}

/** HUD defaults align with three-column positions in `hud-layout`; optional-permission widgets stay off. */
export const DEFAULT_WIDGETS: Record<TWidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: true,
  todo: true,
  weather: true,
  crypto: true,
  speedTest: false,
  aiChat: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
  balancedNews: false,
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

/** Per-monitor widget overrides keyed by {@link getHudDisplayLayoutKey}. */
export type TWidgetsByDisplay = Record<string, Partial<Record<TWidgetKey, boolean>>>;

function coerceWidgetTogglePartial(raw: unknown): Partial<Record<TWidgetKey, boolean>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<TWidgetKey, boolean>> = {};
  for (const key of Object.keys(DEFAULT_WIDGETS) as TWidgetKey[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

export function coerceWidgetsByDisplay(raw: unknown): TWidgetsByDisplay {
  if (!raw || typeof raw !== "object") return {};
  const out: TWidgetsByDisplay = {};
  for (const [displayKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof displayKey !== "string") continue;
    const partial = coerceWidgetTogglePartial(value);
    if (Object.keys(partial).length > 0) out[displayKey] = partial;
  }
  return out;
}

/** Merges synced {@link widgets} with per-monitor overrides for the active display. */
export function resolveWidgetsForDisplay(
  base: Record<TWidgetKey, boolean>,
  byDisplay: TWidgetsByDisplay | undefined,
  displayKey: string,
): Record<TWidgetKey, boolean> {
  const displayPartial = byDisplay?.[displayKey];
  if (!displayPartial || Object.keys(displayPartial).length === 0) {
    return { ...base };
  }
  const merged = { ...base };
  for (const key of Object.keys(merged) as TWidgetKey[]) {
    const v = displayPartial[key];
    if (typeof v === "boolean") merged[key] = v;
  }
  return merged;
}

export function patchWidgetsForDisplay(
  byDisplay: TWidgetsByDisplay | undefined,
  displayKey: string,
  updates: Partial<Record<TWidgetKey, boolean>>,
): TWidgetsByDisplay {
  const prev = byDisplay?.[displayKey] ?? {};
  return {
    ...(byDisplay ?? {}),
    [displayKey]: { ...prev, ...updates },
  };
}

export function resetWidgetsForDisplay(
  byDisplay: TWidgetsByDisplay | undefined,
  displayKey: string,
): TWidgetsByDisplay {
  if (!byDisplay || !(displayKey in byDisplay)) return byDisplay ?? {};
  const next = { ...byDisplay };
  delete next[displayKey];
  return next;
}

export function hasWidgetsDisplayOverride(
  byDisplay: TWidgetsByDisplay | undefined,
  displayKey: string,
): boolean {
  const partial = byDisplay?.[displayKey];
  return partial != null && Object.keys(partial).length > 0;
}

/** User-visible names for the Widgets settings list (storage keys stay `TWidgetKey`). */
export const WIDGET_LABELS: Record<TWidgetKey, string> = {
  search: "Search",
  clock: "Clock",
  notes: "Notes",
  todo: "To-do",
  weather: "Weather",
  crypto: "Crypto prices",
  speedTest: "Speed test",
  aiChat: "AI chat",
  topSites: "Top sites",
  bookmarksStrip: "Bookmarks strip",
  tabGuilt: "Tab guilt",
  humorBanner: "Humor banner",
  balancedNews: "Balanced news",
};

export function resolveWeatherGeoAdjusted(
  raw: {
    weatherGeoAdjusted?: unknown;
    weatherLat?: unknown;
    weatherLon?: unknown;
    weatherAutoGeo?: unknown;
  },
  defaults: Pick<ISettings, "weatherLat" | "weatherLon"> = defaultSettings(),
): boolean {
  if (typeof raw.weatherGeoAdjusted === "boolean") {
    return raw.weatherGeoAdjusted;
  }
  if (raw.weatherAutoGeo === true) {
    return true;
  }
  if (typeof raw.weatherLat === "number" && Number.isFinite(raw.weatherLat)) {
    if (raw.weatherLat !== defaults.weatherLat) {
      return true;
    }
  }
  if (typeof raw.weatherLon === "number" && Number.isFinite(raw.weatherLon)) {
    if (raw.weatherLon !== defaults.weatherLon) {
      return true;
    }
  }
  return false;
}

export function defaultSettings(): ISettings {
  return {
    version: 1,
    preset: "chaos",
    themeMode: "dark",
    themePalette: "glitch",
    themeCustomAccent: DEFAULT_THEME_CUSTOM_ACCENT,
    themeCustomAccent2: DEFAULT_THEME_CUSTOM_ACCENT2,
    themeAccentsMatchWallpaper: true,
    humorEnabled: true,
    humorIntensity: "spicy",
    humorBuiltinVoice: "gen_z",
    /** Fresh installs: blend Classic jargon with Gen-Z by default; upgraded profiles without the key stay off until opted in. */
    humorIncludeUnsuckClassics: true,
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
    searchAssistActive: false,
    weatherLat: 40.7128,
    weatherLon: -74.006,
    weatherGeoAdjusted: false,
    weatherTemperatureUnit: "celsius",
    weatherTemperatureUnitAuto: true,
    clockHourFormat: "24h",
    clockHourFormatAuto: false,
    weatherAutoGeo: false,
    weatherLakesEmbedEnabled: false,
    weatherPanelView: "forecast",
    weatherTenDayLayout: "stack",
    cryptoChartDays: 1,
    balancedNewsCountryAuto: true,
    balancedNewsCountry: "us",
    balancedNewsUseDeviceGeo: false,
    balancedNewsCategory: defaultBalancedNewsCategoryForCountry(
      inferBalancedNewsCountryFromNavigator(),
    ),
    balancedNewsApiKey: "",
    balancedNewsTopicCount: 5,
    bingWallpaperCountryAuto: true,
    bingWallpaperCountry: "us",
    backgroundKind: "bing",
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
    openaiApiKey: "",
    geminiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    openaiModel: "gpt-4o-mini",
    myLines: [],
    importedPacks: [],
    importedPlugins: [],
    debugPluginSource: false,
    notesText: "",
    notes: [],
    notePanels: [],
    notePanelsByDisplay: {},
    notePanelsEpoch: 0,
    notesListPanelVisible: true,
    todos: [],
    hudLayoutChaotic: true,
    hudLayoutLocked: false,
    hudLayoutAutoReposition: true,
    hudLayoutAdaptiveWhileLocked: true,
    hudPanelPositions: mergeHudPanelPositions(undefined),
    hudPanelPositionsByDisplay: {},
    widgetsByDisplay: {},
    hasSeenSettingsIntro: false,
    experimentalFeatures: { ...DEFAULT_EXPERIMENTAL_FEATURES },
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
    themeAccentsMatchWallpaper: s.themeAccentsMatchWallpaper,
    humorEnabled: s.humorEnabled,
    humorIntensity: s.humorIntensity,
    humorBuiltinVoice: s.humorBuiltinVoice,
    humorIncludeUnsuckClassics: s.humorIncludeUnsuckClassics,
    humorBuiltinPackIds: s.humorBuiltinPackIds,
    spicyContentAcknowledged: s.spicyContentAcknowledged,
    widgets: s.widgets,
    searchEngine: s.searchEngine,
    searchAssistActive: s.searchAssistActive,
    weatherLat: s.weatherLat,
    weatherLon: s.weatherLon,
    weatherGeoAdjusted: s.weatherGeoAdjusted,
    weatherTemperatureUnit: s.weatherTemperatureUnit,
    weatherTemperatureUnitAuto: s.weatherTemperatureUnitAuto,
    clockHourFormat: s.clockHourFormat,
    clockHourFormatAuto: s.clockHourFormatAuto,
    weatherAutoGeo: s.weatherAutoGeo,
    weatherLakesEmbedEnabled: s.weatherLakesEmbedEnabled,
    weatherPanelView: s.weatherPanelView,
    weatherTenDayLayout: s.weatherTenDayLayout,
    cryptoChartDays: s.cryptoChartDays,
    balancedNewsCountryAuto: s.balancedNewsCountryAuto,
    balancedNewsCountry: s.balancedNewsCountry,
    balancedNewsUseDeviceGeo: s.balancedNewsUseDeviceGeo,
    balancedNewsCategory: s.balancedNewsCategory,
    balancedNewsTopicCount: s.balancedNewsTopicCount,
    bingWallpaperCountryAuto: s.bingWallpaperCountryAuto,
    bingWallpaperCountry: s.bingWallpaperCountry,
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
    experimentalFeatures: s.experimentalFeatures,
  };
}

function toNotesSync(s: ISettings): INotesSyncSlice {
  return {
    version: 1,
    notes: s.notes,
    notePanels: s.notePanels,
    notePanelsEpoch: s.notePanelsEpoch,
    notesListPanelVisible: s.notesListPanelVisible,
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
    openaiApiKey: s.openaiApiKey,
    geminiApiKey: s.geminiApiKey,
    openaiBaseUrl: s.openaiBaseUrl,
    openaiModel: s.openaiModel,
    balancedNewsApiKey: s.balancedNewsApiKey,
    myLines: s.myLines,
    importedPacks: s.importedPacks,
    importedPlugins: s.importedPlugins,
    notesText: s.notesText,
    todos: s.todos,
    hudLayoutChaotic: s.hudLayoutChaotic,
    hudLayoutLocked: s.hudLayoutLocked,
    hudLayoutAutoReposition: s.hudLayoutAutoReposition,
    hudLayoutAdaptiveWhileLocked: s.hudLayoutAdaptiveWhileLocked,
    hudPanelPositions: s.hudPanelPositions,
    hudPanelPositionsByDisplay: s.hudPanelPositionsByDisplay,
    notePanelsByDisplay: s.notePanelsByDisplay,
    widgetsByDisplay: s.widgetsByDisplay,
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

/** Chaos preset: keep joke intensity at least spicy (parity with {@link applyPreset} chaos branch). */
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
  };
}

function mergeSettings(
  sync: Partial<ISyncSlice> | undefined,
  notesCloud: Partial<INotesSyncSlice> | undefined,
  notesMirror: Partial<INotesSyncSlice> | undefined,
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
  const {
    notes: mergedNotes,
    notePanels: mergedNotePanels,
    notePanelsEpoch,
    notesListPanelVisible,
  } = resolveNotesFromStorage(notesCloud, notesMirror, local, mergeNow);

  const preset = coercePreset(sync?.preset, d.preset);

  const mergedBase: ISettings = {
    version: 1,
    preset,
    themeMode: resolvedThemeMode,
    themePalette: coerceThemePalette(sync?.themePalette, d.themePalette),
    themeCustomAccent: coerceThemeHex(sync?.themeCustomAccent, d.themeCustomAccent),
    themeCustomAccent2: coerceThemeHex(sync?.themeCustomAccent2, d.themeCustomAccent2),
    themeAccentsMatchWallpaper:
      typeof sync?.themeAccentsMatchWallpaper === "boolean"
        ? sync.themeAccentsMatchWallpaper
        : d.themeAccentsMatchWallpaper,
    humorEnabled: sync?.humorEnabled ?? d.humorEnabled,
    humorIntensity: sync?.humorIntensity ?? d.humorIntensity,
    humorBuiltinVoice:
      sync === undefined
        ? d.humorBuiltinVoice
        : coerceHumorBuiltinVoice({
            humorBuiltinVoice: sync.humorBuiltinVoice,
            humorGenZMode: (sync as { humorGenZMode?: boolean }).humorGenZMode,
          }),
    humorIncludeUnsuckClassics:
      typeof sync?.humorIncludeUnsuckClassics === "boolean"
        ? sync.humorIncludeUnsuckClassics
        : sync === undefined
          ? d.humorIncludeUnsuckClassics
          : false,
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
    searchAssistActive:
      typeof sync?.searchAssistActive === "boolean"
        ? sync.searchAssistActive
        : d.searchAssistActive,
    weatherLat: sync?.weatherLat ?? d.weatherLat,
    weatherLon: sync?.weatherLon ?? d.weatherLon,
    weatherGeoAdjusted: resolveWeatherGeoAdjusted(sync ?? {}, d),
    weatherTemperatureUnit: coerceWeatherTemperatureUnit(
      sync?.weatherTemperatureUnit,
      d.weatherTemperatureUnit,
    ),
    weatherTemperatureUnitAuto:
      typeof sync?.weatherTemperatureUnitAuto === "boolean"
        ? sync.weatherTemperatureUnitAuto
        : sync === undefined
          ? d.weatherTemperatureUnitAuto
          : false,
    clockHourFormat: coerceClockHourFormat(sync?.clockHourFormat, d.clockHourFormat),
    clockHourFormatAuto:
      typeof sync?.clockHourFormatAuto === "boolean"
        ? sync.clockHourFormatAuto
        : sync === undefined
          ? d.clockHourFormatAuto
          : false,
    weatherAutoGeo: sync?.weatherAutoGeo ?? d.weatherAutoGeo,
    weatherLakesEmbedEnabled:
      typeof sync?.weatherLakesEmbedEnabled === "boolean"
        ? sync.weatherLakesEmbedEnabled
        : sync === undefined
          ? d.weatherLakesEmbedEnabled
          : false,
    weatherPanelView: coerceWeatherPanelView(sync?.weatherPanelView, d.weatherPanelView),
    weatherTenDayLayout: coerceWeatherTenDayLayout(
      sync?.weatherTenDayLayout,
      d.weatherTenDayLayout,
    ),
    cryptoChartDays: coerceCryptoChartDays(sync?.cryptoChartDays, d.cryptoChartDays),
    balancedNewsCountryAuto:
      typeof sync?.balancedNewsCountryAuto === "boolean"
        ? sync.balancedNewsCountryAuto
        : sync === undefined
          ? d.balancedNewsCountryAuto
          : true,
    balancedNewsCountry: coercePeapixBingCountry(sync?.balancedNewsCountry, d.balancedNewsCountry),
    balancedNewsUseDeviceGeo:
      typeof sync?.balancedNewsUseDeviceGeo === "boolean"
        ? sync.balancedNewsUseDeviceGeo
        : sync === undefined
          ? d.balancedNewsUseDeviceGeo
          : false,
    balancedNewsCategory: coerceBalancedNewsCategory(
      sync?.balancedNewsCategory,
      d.balancedNewsCategory,
    ),
    balancedNewsTopicCount: coerceBalancedNewsTopicCount(
      sync?.balancedNewsTopicCount,
      d.balancedNewsTopicCount,
    ),
    bingWallpaperCountryAuto:
      typeof sync?.bingWallpaperCountryAuto === "boolean"
        ? sync.bingWallpaperCountryAuto
        : sync === undefined
          ? d.bingWallpaperCountryAuto
          : true,
    bingWallpaperCountry: coercePeapixBingCountry(
      sync?.bingWallpaperCountry,
      d.bingWallpaperCountry,
    ),
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
    experimentalFeatures: mergeExperimentalFeatures(
      sync?.experimentalFeatures as Partial<Record<string, unknown>> | undefined,
    ),
    userBackgroundDataUrl,
    userBackgroundDataUrls,
    userBackgroundImages,
    userBackgroundActiveId,
    bingWallpaperFramings: coerceBingWallpaperFramings(local?.bingWallpaperFramings),
    openaiApiKey: local?.openaiApiKey ?? d.openaiApiKey,
    geminiApiKey: local?.geminiApiKey ?? d.geminiApiKey,
    openaiBaseUrl: local?.openaiBaseUrl ?? d.openaiBaseUrl,
    openaiModel:
      typeof local?.openaiModel === "string" && local.openaiModel.trim().length > 0
        ? local.openaiModel.trim()
        : d.openaiModel,
    balancedNewsApiKey:
      typeof local?.balancedNewsApiKey === "string"
        ? local.balancedNewsApiKey
        : d.balancedNewsApiKey,
    myLines: local?.myLines ?? d.myLines,
    importedPacks: local?.importedPacks ?? d.importedPacks,
    importedPlugins: local?.importedPlugins ?? d.importedPlugins,
    notesText: "",
    notes: mergedNotes,
    notePanels: mergedNotePanels,
    notePanelsEpoch,
    notesListPanelVisible,
    todos: local?.todos ?? d.todos,
    hudLayoutChaotic: local?.hudLayoutChaotic ?? d.hudLayoutChaotic,
    hudLayoutLocked: local?.hudLayoutLocked ?? d.hudLayoutLocked,
    hudLayoutAutoReposition:
      typeof local?.hudLayoutAutoReposition === "boolean"
        ? local.hudLayoutAutoReposition
        : d.hudLayoutAutoReposition,
    hudLayoutAdaptiveWhileLocked:
      typeof local?.hudLayoutAdaptiveWhileLocked === "boolean"
        ? local.hudLayoutAdaptiveWhileLocked
        : d.hudLayoutAdaptiveWhileLocked,
    hudPanelPositions: mergeHudPanelPositions(local?.hudPanelPositions),
    hudPanelPositionsByDisplay: coerceHudPanelPositionsByDisplay(local?.hudPanelPositionsByDisplay),
    widgetsByDisplay: coerceWidgetsByDisplay(local?.widgetsByDisplay),
    notePanelsByDisplay: (() => {
      const validNoteIds = new Set(mergedNotes.map((n) => n.id));
      const direct = coerceNotePanelsByDisplay(local?.notePanelsByDisplay, validNoteIds);
      if (Object.keys(direct).length > 0) return direct;
      return migrateLegacyNotePanelPositionsByDisplay(
        mergedNotePanels,
        local?.notePanelPositionsByDisplay,
        validNoteIds,
      );
    })(),
  };
  return applyChaosPresetHumorHarmony(mergedBase);
}

export async function loadSettings(): Promise<ISettings> {
  const localRaw = await browser.storage.local.get([...TABOCALYPSE_SETTINGS_LOCAL_KEYS]);
  const syncRaw = browser.storage.sync
    ? await browser.storage.sync.get([...TABOCALYPSE_SETTINGS_SYNC_KEYS])
    : ({} as Record<string, unknown>);
  const cloudSync = syncRaw[SYNC_KEY] as ISyncSlice | undefined;
  const mirrorSync = localRaw[SYNC_LOCAL_MIRROR_KEY] as ISyncSlice | undefined;
  const sync = mergeSyncFromSources(cloudSync, mirrorSync);
  const cloudNotes = syncRaw[NOTES_SYNC_KEY] as INotesSyncSlice | undefined;
  const mirrorNotes = localRaw[NOTES_SYNC_LOCAL_MIRROR_KEY] as INotesSyncSlice | undefined;
  const local = localRaw[LOCAL_KEY] as ILocalSlice | undefined;
  return mergeSettings(sync, cloudNotes, mirrorNotes, local);
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
  const notesPayload = toNotesSync(s);
  const writes: Promise<unknown>[] = [
    browser.storage.local.set({
      [LOCAL_KEY]: toLocal(s),
      [SYNC_LOCAL_MIRROR_KEY]: syncPayload,
      [NOTES_SYNC_LOCAL_MIRROR_KEY]: notesPayload,
    }),
  ];
  if (browser.storage.sync) {
    if (syncJsonByteLength(notesPayload) > SYNC_NOTES_MAX_BYTES) {
      throw new Error(
        "Notes are too large for browser sync (~8 KB limit). Your changes are saved on this device — shorten notes or remove some to sync across devices.",
      );
    }
    writes.push(
      browser.storage.sync
        .set({ [SYNC_KEY]: syncPayload, [NOTES_SYNC_KEY]: notesPayload })
        .catch((err: unknown) => {
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
