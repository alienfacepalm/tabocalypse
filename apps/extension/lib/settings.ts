import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import browser from "webextension-polyfill";
import { mergeHudPanelPositions, type IHudPanelPosition, type THudPanelId } from "./hud-layout";
import { coerceThemeMode, coerceThemePalette, type TThemeMode, type TThemePalette } from "./theme";
import {
  coerceWeatherTemperatureUnit,
  type TWeatherTemperatureUnit,
} from "./weather/weather-units";

export type { IHudPanelPosition, THudPanelId } from "./hud-layout";

export type { TThemeMode, TThemePalette } from "./theme";
export type { TWeatherTemperatureUnit } from "./weather/weather-units";
export type { IImportedPlugin, IPluginWidget } from "@tabocalypse/plugin-sdk";

export type THumorIntensity = "off" | "mild" | "spicy" | "unhinged";

export type TWidgetKey =
  | "search"
  | "clock"
  | "notes"
  | "todo"
  | "weather"
  | "topSites"
  | "bookmarksStrip"
  | "tabGuilt"
  | "humorBanner"
  | "productivityGag";

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

export interface ISettings {
  version: 1;
  preset: "focus" | "balanced" | "chaos";
  themeMode: TThemeMode;
  themePalette: TThemePalette;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: "ddg" | "google" | "bing";
  weatherLat: number;
  weatherLon: number;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: "solid" | "gradient" | "image" | "bing";
  /** If true and the chosen background kind supports it, the background rotates over time. */
  backgroundRotate: boolean;
  backgroundSolid: string;
  userBackgroundDataUrl: string | null;
  userBackgroundDataUrls: string[];
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  debugPluginSource: boolean;
  notesText: string;
  todos: ITodoItem[];
  /** When true, panels are not snapped to the HUD grid on drop. */
  hudLayoutChaotic: boolean;
  /** When true, panel drag handles are disabled until unlocked. */
  hudLayoutLocked: boolean;
  /** Percentage positions of draggable HUD panels within the canvas. */
  hudPanelPositions: Record<THudPanelId, IHudPanelPosition>;
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
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<TWidgetKey, boolean>;
  searchEngine: ISettings["searchEngine"];
  weatherLat: number;
  weatherLon: number;
  weatherTemperatureUnit: TWeatherTemperatureUnit;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: ISettings["backgroundKind"];
  backgroundSolid: string;
  debugPluginSource: boolean;
}

export interface ILocalSlice {
  version: 1;
  userBackgroundDataUrl: string | null;
  userBackgroundDataUrls: string[];
  backgroundRotate: boolean;
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: IImportedUserPack[];
  importedPlugins: IImportedPlugin[];
  notesText: string;
  todos: ITodoItem[];
  hudLayoutChaotic?: boolean;
  hudLayoutLocked?: boolean;
  hudPanelPositions?: Partial<Record<THudPanelId, IHudPanelPosition>>;
}

export const DEFAULT_WIDGETS: Record<TWidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: false,
  todo: false,
  weather: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
  productivityGag: false,
};

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
  productivityGag: "Productivity gag",
};

export function defaultSettings(): ISettings {
  return {
    version: 1,
    preset: "balanced",
    themeMode: "dark",
    themePalette: "glitch",
    humorEnabled: true,
    humorIntensity: "mild",
    humorBuiltinPackIds: ["tab_shame", "error_messages", "dev_snark"],
    spicyContentAcknowledged: false,
    widgets: { ...DEFAULT_WIDGETS },
    searchEngine: "ddg",
    weatherLat: 40.7128,
    weatherLon: -74.006,
    weatherTemperatureUnit: "celsius",
    weatherAutoGeo: false,
    useOpenWeather: false,
    backgroundKind: "gradient",
    backgroundRotate: false,
    backgroundSolid: "#0f0f12",
    userBackgroundDataUrl: null,
    userBackgroundDataUrls: [],
    openWeatherApiKey: "",
    openaiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    myLines: [],
    importedPacks: [],
    importedPlugins: [],
    debugPluginSource: false,
    notesText: "",
    todos: [],
    hudLayoutChaotic: false,
    hudLayoutLocked: false,
    hudPanelPositions: mergeHudPanelPositions(undefined),
  };
}

function toSync(s: ISettings): ISyncSlice {
  return {
    version: 1,
    preset: s.preset,
    themeMode: s.themeMode,
    themePalette: s.themePalette,
    humorEnabled: s.humorEnabled,
    humorIntensity: s.humorIntensity,
    humorBuiltinPackIds: s.humorBuiltinPackIds,
    spicyContentAcknowledged: s.spicyContentAcknowledged,
    widgets: s.widgets,
    searchEngine: s.searchEngine,
    weatherLat: s.weatherLat,
    weatherLon: s.weatherLon,
    weatherTemperatureUnit: s.weatherTemperatureUnit,
    weatherAutoGeo: s.weatherAutoGeo,
    useOpenWeather: s.useOpenWeather,
    backgroundKind: s.backgroundKind,
    backgroundSolid: s.backgroundSolid,
    debugPluginSource: s.debugPluginSource,
  };
}

function toLocal(s: ISettings): ILocalSlice {
  return {
    version: 1,
    userBackgroundDataUrl: s.userBackgroundDataUrl,
    userBackgroundDataUrls: s.userBackgroundDataUrls,
    backgroundRotate: s.backgroundRotate,
    openWeatherApiKey: s.openWeatherApiKey,
    openaiApiKey: s.openaiApiKey,
    openaiBaseUrl: s.openaiBaseUrl,
    myLines: s.myLines,
    importedPacks: s.importedPacks,
    importedPlugins: s.importedPlugins,
    notesText: s.notesText,
    todos: s.todos,
    hudLayoutChaotic: s.hudLayoutChaotic,
    hudLayoutLocked: s.hudLayoutLocked,
    hudPanelPositions: s.hudPanelPositions,
  };
}

function mergeSettings(
  sync: Partial<ISyncSlice> | undefined,
  local: Partial<ILocalSlice> | undefined,
): ISettings {
  const d = defaultSettings();
  const legacySingle = local?.userBackgroundDataUrl ?? d.userBackgroundDataUrl;
  const legacyToList =
    (local?.userBackgroundDataUrls ?? d.userBackgroundDataUrls).length > 0
      ? (local?.userBackgroundDataUrls ?? d.userBackgroundDataUrls)
      : legacySingle
        ? [legacySingle]
        : [];
  return {
    version: 1,
    preset: sync?.preset ?? d.preset,
    themeMode: coerceThemeMode(sync?.themeMode, d.themeMode),
    themePalette: coerceThemePalette(sync?.themePalette, d.themePalette),
    humorEnabled: sync?.humorEnabled ?? d.humorEnabled,
    humorIntensity: sync?.humorIntensity ?? d.humorIntensity,
    humorBuiltinPackIds: sync?.humorBuiltinPackIds ?? d.humorBuiltinPackIds,
    spicyContentAcknowledged: sync?.spicyContentAcknowledged ?? d.spicyContentAcknowledged,
    widgets: { ...d.widgets, ...(sync?.widgets ?? {}) },
    searchEngine: sync?.searchEngine ?? d.searchEngine,
    weatherLat: sync?.weatherLat ?? d.weatherLat,
    weatherLon: sync?.weatherLon ?? d.weatherLon,
    weatherTemperatureUnit: coerceWeatherTemperatureUnit(
      sync?.weatherTemperatureUnit,
      d.weatherTemperatureUnit,
    ),
    weatherAutoGeo: sync?.weatherAutoGeo ?? d.weatherAutoGeo,
    useOpenWeather: sync?.useOpenWeather ?? d.useOpenWeather,
    backgroundKind: sync?.backgroundKind ?? d.backgroundKind,
    backgroundRotate: local?.backgroundRotate ?? d.backgroundRotate,
    backgroundSolid: sync?.backgroundSolid ?? d.backgroundSolid,
    debugPluginSource: sync?.debugPluginSource ?? d.debugPluginSource,
    userBackgroundDataUrl: legacySingle,
    userBackgroundDataUrls: legacyToList,
    openWeatherApiKey: local?.openWeatherApiKey ?? d.openWeatherApiKey,
    openaiApiKey: local?.openaiApiKey ?? d.openaiApiKey,
    openaiBaseUrl: local?.openaiBaseUrl ?? d.openaiBaseUrl,
    myLines: local?.myLines ?? d.myLines,
    importedPacks: local?.importedPacks ?? d.importedPacks,
    importedPlugins: local?.importedPlugins ?? d.importedPlugins,
    notesText: local?.notesText ?? d.notesText,
    todos: local?.todos ?? d.todos,
    hudLayoutChaotic: local?.hudLayoutChaotic ?? d.hudLayoutChaotic,
    hudLayoutLocked: local?.hudLayoutLocked ?? d.hudLayoutLocked,
    hudPanelPositions: mergeHudPanelPositions(local?.hudPanelPositions),
  };
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

export async function saveSettings(s: ISettings): Promise<void> {
  const syncPayload = toSync(s);
  const writes: Promise<unknown>[] = [
    browser.storage.local.set({
      [LOCAL_KEY]: toLocal(s),
      [SYNC_LOCAL_MIRROR_KEY]: syncPayload,
    }),
  ];
  if (browser.storage.sync) {
    writes.push(browser.storage.sync.set({ [SYNC_KEY]: syncPayload }));
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
      productivityGag: false,
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
    next.widgets = { ...s.widgets, humorBanner: true, productivityGag: true };
  }
  return next;
}
