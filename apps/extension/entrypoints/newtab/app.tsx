import browser from "webextension-polyfill";
import {
  Bookmark,
  Braces,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Download,
  Eye,
  EyeOff,
  Flame,
  FolderUp,
  Image,
  ImagePlus,
  Images,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  LocateFixed,
  Lock as LucideLock,
  Moon,
  Move,
  Paintbrush,
  Pencil,
  Scale,
  Sun,
  Settings as SettingsIcon,
  Shuffle,
  Sparkles,
  Square,
  Target,
  Trash2,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AiChatPanel } from "../../components/built-in/ai-chat-panel";
import { ByoAiProviderSettingPicker } from "../../components/byo-ai-provider-setting-picker";
import { ensureByoAiHostPermission } from "../../lib/byo-ai-host-permission";
import {
  augmentRateLimitErrorWithAlternateProviders,
  BYO_AI_PROVIDER_PRESETS,
  byoAiApiKeyForPreset,
  matchByoAiProviderPreset,
} from "../../lib/byo-ai-provider-options";
import { testOpenAiCompatible } from "../../lib/openai-compatible-chat";
import { DraggableHudPanel } from "../../components/draggable-hud-panel";
import { HudCanvasGrid } from "../../components/hud-canvas-grid";
import {
  HudAutoRepositionSync,
  type IHudAutoRepositionResult,
} from "../../components/hud-auto-reposition-sync";
import { HudLayoutMetricsSync } from "../../components/hud-layout-metrics-sync";
import { HudPlacementProvider } from "../../components/hud-placement-context";
import { BackgroundRotateMinutesInput } from "../../components/background-rotate-minutes-input";
import { UserBackgroundGallery } from "../../components/user-background-gallery";
import { HudPanelBody, HudPanelTitle } from "../../components/hud-panel-drag-context";
import { HudColorInput } from "../../components/hud-color-input";
import { HudTip } from "../../components/hud-tip";
import { HudToastProvider, type THudToastHandle } from "../../components/hud-toast";
import { ClockWidget } from "../../components/built-in/clock-widget";
import { CryptoPricesWidget } from "../../components/built-in/crypto-prices-widget";
import { SpeedTestWidget } from "../../components/built-in/speed-test-widget";
import { BookmarksWidget, TopSitesWidget } from "../../components/built-in/links-widget";
import { NotesMasterList } from "../../components/built-in/notes-master-list";
import { StickyNoteLayer } from "../../components/built-in/sticky-note-layer";
import { SearchWidget } from "../../components/built-in/search-widget";
import { SearchEngineSettingPicker } from "../../components/search-engine-setting-picker";
import { TodoWidget } from "../../components/built-in/todo-widget";
import { WeatherWidget } from "../../components/built-in/weather-widget";
import { PluginDeck } from "../../components/plugin-views";
import { runOneShotWeatherGeolocation } from "../../lib/weather-geolocation";
import { coerceWeatherPanelView } from "../../lib/weather/weather-panel-view";
import {
  WEATHER_TEMPERATURE_UNITS,
  WEATHER_TEMPERATURE_UNIT_AUTO_LABEL,
  WEATHER_UNIT_LABELS,
  coerceWeatherTemperatureUnit,
} from "../../lib/weather/weather-units";
import {
  getNavigatorFormattingLocale,
  resolveEffectiveWeatherTemperatureUnit,
} from "../../lib/locale-units";
import { settingsBackgroundGradientCss } from "../../lib/background-gradient-css";
import {
  applyChaosPresetHumorHarmony,
  applyNotePersistPatch,
  applyPreset,
  coerceNotes,
  BACKGROUND_ROTATE_MINUTES_MAX,
  BACKGROUND_ROTATE_MINUTES_MIN,
  coerceBackgroundGradientAngleDeg,
  coerceBackgroundGradientCenterPct,
  coerceBackgroundGradientShape,
  coerceClockHourFormat,
  coerceCryptoChartDays,
  coerceHumorBuiltinVoice,
  coercePreset,
  DEFAULT_BACKGROUND_ROTATE_MINUTES,
  defaultSettings,
  defaultStickyNotePosition,
  type IStickyNotePosition,
  type IHudPanelPosition,
  type ISettings,
  isHudAutoRepositionEnabled,
  isNoteDeleteAllowed,
  isTabocalypseSettingsStorageChange,
  type IUserBackgroundImage,
  loadSettings,
  mergeNotePanelsForStorageReload,
  mergeWidgets,
  mergeNotesPreferNewerBaseline,
  resolveNotesListPanelVisible,
  resolveWeatherGeoAdjusted,
  resolveUserBackgroundImage,
  saveSettings,
  type THumorIntensity,
  type THudPanelId,
  type TWidgetKey,
  WIDGET_LABELS,
} from "../../lib/settings";
import { BUILTIN_PACKS } from "../../lib/humor/builtin-packs";
import type { IHumorContext } from "../../lib/humor/engine";
import { pickDailyLine } from "../../lib/humor/engine";
import { validatePluginJsonText } from "@tabocalypse/plugin-sdk";
import { mergeImportedPlugin, removeImportedPlugin } from "../../lib/plugin-import";
import { getSupportActions, openExternal } from "../../lib/support-links";
import {
  estimateImportedBytes,
  MAX_TOTAL_IMPORTED_BYTES,
  parsePackJsonText,
  parseTabocalypseZip,
} from "../../lib/user-packs";
import {
  compressImageFileToDataUrl,
  estimateDataUrlBytes,
} from "../../lib/compress-background-image";
import { extractWallpaperAccentsFromImageUrl } from "../../lib/extract-wallpaper-accents";
import {
  PEAPIX_BING_COUNTRY_OPTIONS,
  resolveEffectivePeapixBingCountry,
} from "../../lib/bing-wallpaper-country";
import {
  bingWallpaperCaptionFromEntry,
  fetchBingWallpaperFeed,
  pickDailyBingWallpaperEntry,
  pickRotatingBingWallpaperEntry,
} from "../../lib/fetch-bing-wallpaper";
import {
  getHumorContentCacheSnapshot,
  humorContentLastRefreshedAt,
  initHumorContentCache,
  refreshHumorContentIfStale,
} from "../../lib/humor/humor-content-cache";
import { privilegedExtensionFetchBytes } from "../../lib/privileged-extension-fetch";
import { defaultAlarmWhenLocal, formatDatetimeLocalFromDate } from "../../lib/alarm-datetime";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import {
  getHudDisplayLayoutKey,
  measureHudCanvasSize,
  patchHudPanelPositionsForDisplay,
  patchNotePanelsForDisplay,
  removeNoteFromAllDisplays,
  resetHudPanelPositionsForDisplay,
  resolveHudPanelPositionsForDisplay,
  resolveNotePanelsForDisplay,
} from "../../lib/hud-layout";
import {
  computeHudPanelAutoLayoutUpdates,
  HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT,
  isHudKeyboardShortcutTypingTarget,
} from "../../lib/hud-auto-layout";
import { computeStickyNoteResizeUpdates } from "../../lib/sticky-note-auto-layout";
import {
  applyDocumentTheme,
  coerceThemeHex,
  coerceThemeMode,
  coerceThemePalette,
  getResolvedAccentPair,
  THEME_MODE_LABELS,
  THEME_PALETTE_LABELS,
  THEME_MODES,
  THEME_PRESET_PALETTES,
  themeGradientStops,
} from "../../lib/theme";

const BG_MAX = 1_500_000;
const BG_TOTAL_MAX = 6_000_000;
/** Longer side cap before encoding (decoded pixels on the canvas). */
const BG_MAX_EDGE_PX = 2560;
/** Shown in Settings — must stay in sync with BG_MAX / BG_TOTAL_MAX. */
const BG_MAX_LABEL = "1.5 MB";
const BG_TOTAL_LABEL = "6 MB";

type TSettingsUpdater = ISettings | ((current: ISettings) => ISettings);

type TSettingsSectionJump =
  | "weather"
  | "widgets"
  | "byoAi"
  | "optionalPermissions"
  | "topSitesPermission"
  | "bookmarksPermission"
  | "tabsPermission";

type TSettingsAccordionSection =
  | "presets"
  | "appearance"
  | "widgets"
  | "panelLayout"
  | "chaos"
  | "searchEngine"
  | "background"
  | "weather"
  | "optionalPermissions"
  | "alarms"
  | "byoAi"
  | "importPack"
  | "importPlugin"
  | "manageImports"
  | "debug"
  | "data";

type TAlarmScheduleBanner = { kind: "ok" | "err"; message: string };

type TPendingAlarm = { name: string; scheduledTime: number; message: string };

/** Safe string for React children; alarmMeta may store legacy `{ message, title }` objects. */
function formatAlarmReminderForList(raw: unknown): string | null {
  const line = coerceAlarmMetaMessage(raw).trim();
  if (!line) return null;
  if (/^Tabocalypse alarm\.?$/.test(line)) return null;
  return line;
}

type TBackgroundStyleExtras = {
  bingImageUrl?: string | null;
  userImageUrl?: string | null;
  backgroundPosition?: string;
};

function revokeObjectUrlMaybe(url: string | null): void {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

function backgroundStyle(s: ISettings, extras?: TBackgroundStyleExtras): React.CSSProperties {
  const grad = settingsBackgroundGradientCss(s);

  if (s.backgroundKind === "bing") {
    const u = extras?.bingImageUrl;
    if (u) {
      return {
        backgroundColor: "transparent",
        backgroundImage: `url(${u})`,
        backgroundSize: "cover",
        backgroundPosition: extras?.backgroundPosition ?? "50% 50%",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      };
    }
    return {
      backgroundColor: "transparent",
      background: grad,
      backgroundAttachment: "fixed",
    };
  }
  if (s.backgroundKind === "solid") {
    return {
      backgroundColor: "transparent",
      background: s.backgroundSolid,
      backgroundAttachment: "fixed",
    };
  }
  if (s.backgroundKind === "image") {
    const u = extras?.userImageUrl ?? s.userBackgroundDataUrl;
    if (!u) {
      return {
        backgroundColor: "transparent",
        background: grad,
        backgroundAttachment: "fixed",
      };
    }
    return {
      backgroundColor: "transparent",
      backgroundImage: `url(${u})`,
      backgroundSize: "cover",
      backgroundPosition: extras?.backgroundPosition ?? "50% 50%",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    };
  }
  return {
    backgroundColor: "transparent",
    background: grad,
    backgroundAttachment: "fixed",
  };
}

/**
 * Same wallpaper row the upload pipeline resolves (rotation slot or active still image).
 * Used so shell + Auto HUD track gallery/rotation switches on the same render as settings —
 * not one frame behind `userChosenUrl` state (rotation ticks bump that state so time-based slots stay in sync).
 */
function resolveVisibleUserBackgroundFromSettings(s: ISettings): {
  id: string | null;
  dataUrl: string | null;
} {
  if (s.backgroundKind !== "image" || s.userBackgroundImages.length === 0) {
    return { id: null, dataUrl: null };
  }
  const rotateOn = s.backgroundRotate ?? true;
  const userMs = Math.max(
    60_000,
    (s.backgroundRotateMinutesUser ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
  );
  const resolved = resolveUserBackgroundImage(
    s.userBackgroundImages,
    s.userBackgroundActiveId,
    rotateOn,
    userMs,
  );
  return { id: resolved?.id ?? null, dataUrl: resolved?.dataUrl ?? null };
}

function applyReactStyle(target: HTMLElement, style: React.CSSProperties): void {
  const t = target.style as unknown as Record<string, string>;
  for (const k of Object.keys(style) as (keyof React.CSSProperties)[]) {
    const v = style[k];
    if (v === undefined) continue;
    if (typeof v === "number") t[String(k)] = String(v);
    else t[String(k)] = String(v);
  }
}

function mergeHydratedSettingsWithBaseline(
  baseline: ISettings,
  disk: ISettings,
  preserveMyLinesDraft: boolean,
): ISettings {
  const mergedNotes = coerceNotes(mergeNotesPreferNewerBaseline(baseline.notes, disk.notes));
  const validNoteIds = new Set(mergedNotes.map((n) => n.id));
  const bEpoch = baseline.notePanelsEpoch ?? 0;
  const dEpoch = disk.notePanelsEpoch ?? 0;
  return {
    ...disk,
    notes: mergedNotes,
    notePanels: mergeNotePanelsForStorageReload(
      baseline.notePanels,
      disk.notePanels,
      bEpoch,
      dEpoch,
      validNoteIds,
    ),
    notePanelsEpoch: Math.max(bEpoch, dEpoch),
    ...(preserveMyLinesDraft ? { myLines: baseline.myLines } : {}),
  };
}

function App({ initialSettings }: { initialSettings: ISettings }): React.JSX.Element {
  const [settings, setSettings] = useState<ISettings>(initialSettings);
  const [openSettings, setOpenSettings] = useState(() => !initialSettings.hasSeenSettingsIntro);
  const [warnSpicy, setWarnSpicy] = useState(false);
  const [pendingIntensity, setPendingIntensity] = useState<THumorIntensity | null>(null);
  const hudToastRef = useRef<THudToastHandle | null>(null);
  const showHudError = useCallback((message: string) => {
    hudToastRef.current?.showToast({ message, variant: "error" });
  }, []);
  const [pluginValidateLog, setPluginValidateLog] = useState<string>("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [bingChosenUrl, setBingChosenUrl] = useState<string | null>(null);
  const [bingWallpaperCaption, setBingWallpaperCaption] = useState<string | null>(null);
  const [bingPaintUrl, setBingPaintUrl] = useState<string | null>(null);
  const [bingFetchErr, setBingFetchErr] = useState<string | null>(null);
  const [bingImageLoadErr, setBingImageLoadErr] = useState<string | null>(null);
  const [bingRefreshing, setBingRefreshing] = useState(false);
  const [userChosenUrl, setUserChosenUrl] = useState<string | null>(null);
  const [bgPanLive, setBgPanLive] = useState<{
    kind: "user";
    id: string;
    positionXPct: number;
    positionYPct: number;
  } | null>(null);
  /** Uploaded-image framing: drag only after enabling from the background context menu. */
  const [userBgRepositionMode, setUserBgRepositionMode] = useState(false);
  const [userBgRepositionDraft, setUserBgRepositionDraft] = useState<{
    positionXPct: number;
    positionYPct: number;
  } | null>(null);
  const [userBgContextMenu, setUserBgContextMenu] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const userBgRepositionModeRef = useRef(false);
  const userBgContextMenuRef = useRef<HTMLDivElement | null>(null);
  /** Mirrors `browser.permissions.contains` for optional API permissions (not widget toggles alone). */
  const [optionalApiPerms, setOptionalApiPerms] = useState({
    topSites: false,
    bookmarks: false,
    tabs: false,
  });
  /** Bumped when optional/extension permissions change so HUD widgets refetch (mount-only effects otherwise stay stale). */
  const [permissionsEpoch, setPermissionsEpoch] = useState(0);
  const [geoStatus, setGeoStatus] = useState<"detecting" | "denied" | "unavailable" | null>(null);
  const [pendingSettingsSectionJump, setPendingSettingsSectionJump] =
    useState<TSettingsSectionJump | null>(null);
  /** Survives closing the settings dialog until the new-tab session ends. */
  const [settingsAccordionOpen, setSettingsAccordionOpen] = useState<
    Partial<Record<TSettingsAccordionSection, boolean>>
  >(() => ({ presets: true }));
  const [byoAiApiKeyVisible, setByoAiApiKeyVisible] = useState(false);
  const [humorContentRevision, setHumorContentRevision] = useState(0);
  const [humorRefreshBusy, setHumorRefreshBusy] = useState(false);
  const [humorRefreshStatus, setHumorRefreshStatus] = useState<string | null>(null);
  const weatherManualGeoEpochRef = useRef(0);
  const weatherSettingsSectionRef = useRef<HTMLDetailsElement | null>(null);
  const widgetsSettingsSectionRef = useRef<HTMLDetailsElement | null>(null);
  const byoAiSettingsSectionRef = useRef<HTMLDetailsElement | null>(null);
  const optionalPermissionsSettingsSectionRef = useRef<HTMLDetailsElement | null>(null);
  const topSitesPermissionButtonRef = useRef<HTMLButtonElement | null>(null);
  const bookmarksPermissionButtonRef = useRef<HTMLButtonElement | null>(null);
  const tabsPermissionButtonRef = useRef<HTMLButtonElement | null>(null);
  const [alarmWhen, setAlarmWhen] = useState("");
  const [alarmMessage, setAlarmMessage] = useState("");
  const [alarmScheduleBanner, setAlarmScheduleBanner] = useState<TAlarmScheduleBanner | null>(null);
  const [pendingAlarms, setPendingAlarms] = useState<TPendingAlarm[]>([]);
  const [editingAlarmName, setEditingAlarmName] = useState<string | null>(null);
  const alarmWhenInputRef = useRef<HTMLInputElement>(null);
  const alarmDatetimeMin = useMemo(() => formatDatetimeLocalFromDate(new Date()), [openSettings]);
  const supportActions = useMemo(() => getSupportActions(), []);
  const extensionVersion = useMemo(() => browser.runtime.getManifest().version, []);
  const bingPaintUrlRef = useRef<string | null>(null);
  /** Cancels stale async wallpaper color sampling when the image URL changes quickly. */
  const wallpaperAccentGenRef = useRef(0);
  /**
   * Stable identity for the visible Bing spotlight (`bingChosenUrl`) or upload (background row id).
   * Mode-specific contrast is applied at render time in `resolveThemeCssVars`, not in storage.
   */
  const lastWallpaperAccentApplyRef = useRef<{ logicalKey: string } | null>(null);
  const latestSettingsRef = useRef<ISettings>(initialSettings);
  const persistChainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const myLinesSaveTimerRef = useRef<number | null>(null);
  const bgPanDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originXPct: number;
    originYPct: number;
    userId: string;
  } | null>(null);
  const bgPanCommitRef = useRef<{
    kind: "user";
    id: string;
    positionXPct: number;
    positionYPct: number;
  } | null>(null);

  const visibleUserBackground = useMemo(
    () => resolveVisibleUserBackgroundFromSettings(settings),
    [
      settings.backgroundKind,
      settings.userBackgroundImages,
      settings.userBackgroundActiveId,
      settings.backgroundRotate,
      settings.backgroundRotateMinutesUser,
      userChosenUrl,
    ],
  );

  useEffect(() => {
    bingPaintUrlRef.current = bingPaintUrl;
  }, [bingPaintUrl]);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    userBgRepositionModeRef.current = userBgRepositionMode;
  }, [userBgRepositionMode]);

  useEffect(() => {
    setUserBgRepositionMode(false);
    setUserBgRepositionDraft(null);
    setUserBgContextMenu(null);
  }, [visibleUserBackground.id, settings.backgroundKind]);

  useEffect(() => {
    if (!userBgContextMenu) return;
    const onPointerDown = (ev: PointerEvent) => {
      if (userBgContextMenuRef.current?.contains(ev.target as Node)) return;
      setUserBgContextMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [userBgContextMenu]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      setUserBgContextMenu(null);
      if (userBgRepositionModeRef.current) {
        setUserBgRepositionMode(false);
        setUserBgRepositionDraft(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(
    () => () => {
      revokeObjectUrlMaybe(bingPaintUrlRef.current);
      if (myLinesSaveTimerRef.current !== null) {
        window.clearTimeout(myLinesSaveTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    void loadSettings().then((next) => {
      const baseline = latestSettingsRef.current;
      const merged = mergeHydratedSettingsWithBaseline(
        baseline,
        next,
        myLinesSaveTimerRef.current !== null,
      );
      latestSettingsRef.current = merged;
      setSettings(merged);
    });
    void initHumorContentCache().then(() =>
      refreshHumorContentIfStale().then((result) => {
        if (result.updated) {
          setHumorContentRevision((n) => n + 1);
        }
        if (result.error && !result.unsuckOk) {
          setHumorRefreshStatus("Using bundled humor — live refresh failed.");
        }
      }),
    );
  }, []);

  useEffect(() => {
    const onStorageChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" && areaName !== "sync") return;
      if (!isTabocalypseSettingsStorageChange(changes, areaName)) return;
      void loadSettings().then((next) => {
        const baseline = latestSettingsRef.current;
        const merged = mergeHydratedSettingsWithBaseline(
          baseline,
          next,
          myLinesSaveTimerRef.current !== null,
        );
        latestSettingsRef.current = merged;
        setSettings(merged);
      });
    };
    browser.storage.onChanged.addListener(onStorageChanged);
    return () => browser.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  useLayoutEffect(() => {
    applyDocumentTheme(settings.themeMode, settings.themePalette, {
      accent: settings.themeCustomAccent,
      accent2: settings.themeCustomAccent2,
    });
  }, [
    settings.themeMode,
    settings.themePalette,
    settings.themeCustomAccent,
    settings.themeCustomAccent2,
  ]);

  const peapixBingCountry = useMemo(
    () =>
      resolveEffectivePeapixBingCountry({
        bingWallpaperCountryAuto: settings.bingWallpaperCountryAuto,
        bingWallpaperCountry: settings.bingWallpaperCountry,
      }),
    [settings.bingWallpaperCountryAuto, settings.bingWallpaperCountry],
  );

  useEffect(() => {
    const kind = settings?.backgroundKind;
    if (kind !== "bing") {
      setBingChosenUrl(null);
      setBingWallpaperCaption(null);
      setBingPaintUrl((prev) => {
        revokeObjectUrlMaybe(prev);
        return null;
      });
      setBingFetchErr(null);
      setBingImageLoadErr(null);
      setBingRefreshing(false);
      return;
    }
    const rotate = settings?.backgroundRotate ?? true;
    const bingRotateMs = Math.max(
      60_000,
      (settings?.backgroundRotateMinutesBing ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
    );
    let cancelled = false;
    const listAbort = new AbortController();
    setBingChosenUrl(null);
    setBingWallpaperCaption(null);
    setBingPaintUrl((prev) => {
      revokeObjectUrlMaybe(prev);
      return null;
    });
    setBingFetchErr(null);
    setBingImageLoadErr(null);
    setBingRefreshing(false);
    void fetchBingWallpaperFeed(peapixBingCountry, listAbort.signal)
      .then((entries) => {
        if (cancelled) return;
        if (entries.length === 0) {
          setBingFetchErr("No images returned.");
          return;
        }
        const chosen = rotate
          ? pickRotatingBingWallpaperEntry(entries, Date.now(), bingRotateMs)
          : pickDailyBingWallpaperEntry(entries);
        setBingChosenUrl(chosen.imageUrl);
        const caption = bingWallpaperCaptionFromEntry(chosen);
        setBingWallpaperCaption(caption || null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setBingFetchErr(e instanceof Error ? e.message : String(e));
      });
    if (!rotate) {
      return () => {
        cancelled = true;
        listAbort.abort();
      };
    }
    const id = window.setInterval(() => {
      setBingRefreshing(true);
      const step = Math.max(
        60_000,
        (latestSettingsRef.current.backgroundRotateMinutesBing ??
          DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
      );
      const country = resolveEffectivePeapixBingCountry({
        bingWallpaperCountryAuto: latestSettingsRef.current.bingWallpaperCountryAuto,
        bingWallpaperCountry: latestSettingsRef.current.bingWallpaperCountry,
      });
      void fetchBingWallpaperFeed(country)
        .then((entries) => {
          if (cancelled) return;
          if (entries.length === 0) {
            setBingFetchErr("No images returned.");
            return;
          }
          setBingFetchErr(null);
          const chosen = pickRotatingBingWallpaperEntry(entries, Date.now(), step);
          setBingChosenUrl(chosen.imageUrl);
          const caption = bingWallpaperCaptionFromEntry(chosen);
          setBingWallpaperCaption(caption || null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setBingFetchErr(e instanceof Error ? e.message : String(e));
        })
        .finally(() => {
          if (!cancelled) setBingRefreshing(false);
        });
    }, bingRotateMs);
    return () => {
      cancelled = true;
      listAbort.abort();
      window.clearInterval(id);
    };
  }, [
    settings?.backgroundKind,
    settings?.backgroundRotate,
    settings?.backgroundRotateMinutesBing,
    peapixBingCountry,
  ]);

  useEffect(() => {
    if (settings?.backgroundKind !== "bing" || !bingChosenUrl) {
      setBingImageLoadErr(null);
      setBingPaintUrl((prev) => {
        revokeObjectUrlMaybe(prev);
        return null;
      });
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setBingImageLoadErr(null);
    setBingPaintUrl((prev) => {
      revokeObjectUrlMaybe(prev);
      return null;
    });

    void privilegedExtensionFetchBytes(bingChosenUrl, ac.signal)
      .then(({ mime, bytes }) => {
        if (cancelled) return;
        const blob = new Blob([bytes], { type: mime || "image/jpeg" });
        const objectUrl = URL.createObjectURL(blob);
        setBingPaintUrl((prev) => {
          revokeObjectUrlMaybe(prev);
          return objectUrl;
        });
      })
      .catch((e: unknown) => {
        if (cancelled || ac.signal.aborted) return;
        setBingImageLoadErr(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [settings?.backgroundKind, bingChosenUrl]);

  useEffect(() => {
    const kind = settings?.backgroundKind;
    if (kind !== "image") {
      setUserChosenUrl(null);
      return;
    }
    const applyUserBackground = (): void => {
      const c = latestSettingsRef.current;
      const rotateOn = c.backgroundRotate ?? true;
      const userMs = Math.max(
        60_000,
        (c.backgroundRotateMinutesUser ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
      );
      const resolved = resolveUserBackgroundImage(
        c.userBackgroundImages,
        c.userBackgroundActiveId,
        rotateOn,
        userMs,
      );
      setUserChosenUrl(resolved?.dataUrl ?? null);
    };
    applyUserBackground();
    if (!(settings.backgroundRotate ?? true)) return;
    const userMs = Math.max(
      60_000,
      (settings.backgroundRotateMinutesUser ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
    );
    const id = window.setInterval(applyUserBackground, userMs);
    return () => window.clearInterval(id);
  }, [
    settings,
    settings?.backgroundKind,
    settings?.backgroundRotate,
    settings?.backgroundRotateMinutesUser,
    settings?.userBackgroundActiveId,
    settings?.userBackgroundImages,
  ]);

  const clearMyLinesDebouncedSaveTimer = useCallback((): void => {
    if (myLinesSaveTimerRef.current === null) return;
    window.clearTimeout(myLinesSaveTimerRef.current);
    myLinesSaveTimerRef.current = null;
  }, []);

  const saveLatestToDisk = useCallback(async (): Promise<void> => {
    const cur = latestSettingsRef.current;
    try {
      await saveSettings(cur);
    } catch (e: unknown) {
      showHudError(e instanceof Error ? e.message : String(e));
    }
  }, [showHudError]);

  const persist = useCallback(
    (next: TSettingsUpdater): Promise<boolean> => {
      const run = async (): Promise<boolean> => {
        clearMyLinesDebouncedSaveTimer();
        const current = latestSettingsRef.current;
        const raw = typeof next === "function" ? next(current) : next;
        const noteLayoutChanged =
          raw.notePanels !== current.notePanels ||
          raw.notePanelsByDisplay !== current.notePanelsByDisplay;
        const resolved: ISettings = noteLayoutChanged
          ? { ...raw, notePanelsEpoch: (current.notePanelsEpoch ?? 0) + 1 }
          : { ...raw, notePanelsEpoch: raw.notePanelsEpoch ?? current.notePanelsEpoch ?? 0 };
        latestSettingsRef.current = resolved;
        setSettings(resolved);
        try {
          await saveSettings(resolved);
          return true;
        } catch (e: unknown) {
          showHudError(e instanceof Error ? e.message : String(e));
          return false;
        }
      };

      persistChainRef.current = persistChainRef.current.then(run).catch((e: unknown) => {
        showHudError(e instanceof Error ? e.message : String(e));
        return false;
      });
      return persistChainRef.current;
    },
    [clearMyLinesDebouncedSaveTimer, showHudError],
  );

  useEffect(() => {
    if (!settings.themeAccentsMatchWallpaper) {
      lastWallpaperAccentApplyRef.current = null;
      return;
    }
    const kind = settings.backgroundKind;
    const visibleForAccent =
      kind === "image" ? resolveVisibleUserBackgroundFromSettings(settings) : null;
    const src =
      kind === "bing"
        ? bingPaintUrl
        : kind === "image"
          ? (visibleForAccent?.dataUrl ?? null)
          : null;

    const logicalKey =
      kind === "bing"
        ? (bingChosenUrl ?? "")
        : kind === "image"
          ? (visibleForAccent?.id ?? "")
          : "";

    if (!src) {
      // Bing clears `bingPaintUrl` to null while fetching/decoding the next blob; do not reset the
      // last-applied ref or we re-persist identical accents and thrash theme + storage listeners.
      if (kind === "bing" && bingChosenUrl) {
        return;
      }
      // Uploads: avoid clearing during brief mismatches between resolved wallpaper vs `userChosenUrl`
      // or rows that have an id before `dataUrl` is ready (same storage-thrash failure mode as Bing).
      if (kind === "image" && settings.userBackgroundImages.length > 0) {
        const resolveMissingPaint =
          visibleForAccent != null &&
          visibleForAccent.id != null &&
          visibleForAccent.dataUrl == null;
        const chosenPendingResolve = userChosenUrl != null && visibleForAccent?.dataUrl == null;
        if (resolveMissingPaint || chosenPendingResolve) {
          return;
        }
      }
      lastWallpaperAccentApplyRef.current = null;
      return;
    }

    const applied = lastWallpaperAccentApplyRef.current;
    if (
      logicalKey !== "" &&
      applied?.logicalKey === logicalKey &&
      settings.themePalette === "custom"
    ) {
      return;
    }
    if (logicalKey !== "") {
      lastWallpaperAccentApplyRef.current = { logicalKey };
    }

    const gen = ++wallpaperAccentGenRef.current;
    let cancelled = false;

    void extractWallpaperAccentsFromImageUrl(src).then((pair) => {
      if (cancelled || gen !== wallpaperAccentGenRef.current) return;
      if (!pair) return;
      if (!latestSettingsRef.current.themeAccentsMatchWallpaper) return;
      const snap = latestSettingsRef.current;
      if (
        snap.themePalette === "custom" &&
        snap.themeCustomAccent.toLowerCase() === pair.accent.toLowerCase() &&
        snap.themeCustomAccent2.toLowerCase() === pair.accent2.toLowerCase()
      ) {
        return;
      }
      void persist((cur) => {
        if (!cur.themeAccentsMatchWallpaper) return cur;
        return {
          ...cur,
          themePalette: "custom",
          themeCustomAccent: pair.accent,
          themeCustomAccent2: pair.accent2,
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    settings.themeAccentsMatchWallpaper,
    settings.themePalette,
    settings.backgroundKind,
    settings.backgroundRotate,
    settings.backgroundRotateMinutesUser,
    settings.userBackgroundImages,
    settings.userBackgroundActiveId,
    bingChosenUrl,
    bingPaintUrl,
    userChosenUrl,
    persist,
  ]);

  const acknowledgeSettingsIntro = useCallback(() => {
    void persist((cur) =>
      cur.hasSeenSettingsIntro ? cur : { ...cur, hasSeenSettingsIntro: true },
    );
  }, [persist]);

  const closeSettingsDialog = useCallback(() => {
    setOpenSettings(false);
    const cur = latestSettingsRef.current;
    if (!cur.hasSeenSettingsIntro) {
      void persist((next) =>
        next.hasSeenSettingsIntro ? next : { ...next, hasSeenSettingsIntro: true },
      );
    }
  }, [persist]);

  const settingsAccordionIsOpen = useCallback(
    (section: TSettingsAccordionSection, defaultOpen = false): boolean =>
      settingsAccordionOpen[section] ?? defaultOpen,
    [settingsAccordionOpen],
  );

  const onSettingsAccordionToggle = useCallback(
    (section: TSettingsAccordionSection, defaultOpen = false) =>
      (e: React.SyntheticEvent<HTMLDetailsElement>) => {
        const details =
          e.currentTarget instanceof HTMLDetailsElement
            ? e.currentTarget
            : e.target instanceof HTMLDetailsElement
              ? e.target
              : null;
        if (!details) return;
        const nextOpen = details.open;
        setSettingsAccordionOpen((prev) => {
          const currentOpen = prev[section] ?? defaultOpen;
          if (currentOpen === nextOpen) return prev;
          return { ...prev, [section]: nextOpen };
        });
      },
    [],
  );

  const openSettingsAccordionSection = useCallback((section: TSettingsAccordionSection) => {
    setSettingsAccordionOpen((prev) => ({ ...prev, [section]: true }));
  }, []);

  useEffect(() => {
    if (!openSettings || !pendingSettingsSectionJump) {
      return;
    }
    const section =
      pendingSettingsSectionJump === "weather"
        ? weatherSettingsSectionRef.current
        : pendingSettingsSectionJump === "widgets"
          ? widgetsSettingsSectionRef.current
          : pendingSettingsSectionJump === "byoAi"
            ? byoAiSettingsSectionRef.current
            : optionalPermissionsSettingsSectionRef.current;
    if (!section) {
      return;
    }
    const focusTarget =
      pendingSettingsSectionJump === "topSitesPermission"
        ? topSitesPermissionButtonRef.current
        : pendingSettingsSectionJump === "bookmarksPermission"
          ? bookmarksPermissionButtonRef.current
          : pendingSettingsSectionJump === "tabsPermission"
            ? tabsPermissionButtonRef.current
            : section.querySelector("summary");
    requestAnimationFrame(() => {
      section.scrollIntoView({ block: "start" });
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    });
    setPendingSettingsSectionJump(null);
  }, [openSettings, pendingSettingsSectionJump]);

  const openWeatherSettingsSection = useCallback(() => {
    openSettingsAccordionSection("weather");
    setPendingSettingsSectionJump("weather");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openWidgetsSettingsSection = useCallback(() => {
    openSettingsAccordionSection("widgets");
    setPendingSettingsSectionJump("widgets");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openByoAiSettingsSection = useCallback(() => {
    openSettingsAccordionSection("byoAi");
    setPendingSettingsSectionJump("byoAi");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openOptionalPermissionsSettingsSection = useCallback(() => {
    openSettingsAccordionSection("optionalPermissions");
    setPendingSettingsSectionJump("optionalPermissions");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openTopSitesSettingsSection = useCallback(() => {
    openSettingsAccordionSection("optionalPermissions");
    setPendingSettingsSectionJump("topSitesPermission");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openBookmarksSettingsSection = useCallback(() => {
    openSettingsAccordionSection("optionalPermissions");
    setPendingSettingsSectionJump("bookmarksPermission");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const openTabsSettingsSection = useCallback(() => {
    openSettingsAccordionSection("optionalPermissions");
    setPendingSettingsSectionJump("tabsPermission");
    setOpenSettings(true);
  }, [openSettingsAccordionSection]);

  const fetchWeatherLocationOnce = useCallback(() => {
    if (latestSettingsRef.current.weatherAutoGeo) return;

    weatherManualGeoEpochRef.current += 1;
    const epoch = weatherManualGeoEpochRef.current;

    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }

    setGeoStatus("detecting");
    runOneShotWeatherGeolocation(navigator.geolocation, (outcome) => {
      if (epoch !== weatherManualGeoEpochRef.current) return;
      if (latestSettingsRef.current.weatherAutoGeo) {
        return;
      }
      if (outcome.kind === "ok") {
        setGeoStatus(null);
        void persist((cur) => ({
          ...cur,
          weatherLat: outcome.latitude,
          weatherLon: outcome.longitude,
          weatherGeoAdjusted: true,
        }));
        return;
      }
      setGeoStatus(outcome.kind);
    });
  }, [persist]);

  useEffect(() => {
    if (!settings.weatherAutoGeo) {
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      void persist((cur) => ({ ...cur, weatherAutoGeo: false }));
      return;
    }
    let cancelled = false;
    setGeoStatus("detecting");
    runOneShotWeatherGeolocation(navigator.geolocation, (outcome) => {
      if (cancelled) return;
      if (outcome.kind === "ok") {
        setGeoStatus(null);
        void persist((cur) => ({
          ...cur,
          weatherLat: outcome.latitude,
          weatherLon: outcome.longitude,
          weatherGeoAdjusted: true,
        }));
        return;
      }
      setGeoStatus(outcome.kind === "denied" ? "denied" : "unavailable");
      void persist((cur) => ({ ...cur, weatherAutoGeo: false }));
    });
    return () => {
      cancelled = true;
    };
  }, [persist, settings.weatherAutoGeo]);

  const hudCanvasRef = useRef<HTMLDivElement | null>(null);
  const displayLayoutKeyRef = useRef(getHudDisplayLayoutKey());
  const [displayLayoutKey, setDisplayLayoutKey] = useState(() => getHudDisplayLayoutKey());
  /** When opening a pinned note temporarily unlocks HUD, dragging that note prompts to re-lock. */
  const relockPromptNoteIdAfterAutoHudUnlockRef = useRef<string | null>(null);

  useEffect(() => {
    const syncDisplayKey = (): void => {
      const next = getHudDisplayLayoutKey();
      displayLayoutKeyRef.current = next;
      setDisplayLayoutKey((prev) => (prev === next ? prev : next));
    };
    syncDisplayKey();
    window.addEventListener("resize", syncDisplayKey);
    return () => window.removeEventListener("resize", syncDisplayKey);
  }, []);

  const effectiveHudPanelPositions = useMemo(
    () =>
      resolveHudPanelPositionsForDisplay(
        settings.hudPanelPositions,
        settings.hudPanelPositionsByDisplay,
        displayLayoutKey,
      ),
    [settings.hudPanelPositions, settings.hudPanelPositionsByDisplay, displayLayoutKey],
  );

  const effectiveNotePanels = useMemo(
    () =>
      resolveNotePanelsForDisplay(
        settings.notePanels,
        settings.notePanelsByDisplay,
        displayLayoutKey,
      ),
    [settings.notePanels, settings.notePanelsByDisplay, displayLayoutKey],
  );

  const commitHudPanel = useCallback(
    (id: THudPanelId, pos: IHudPanelPosition) => {
      void persist((cur) => ({
        ...cur,
        hudPanelPositionsByDisplay: patchHudPanelPositionsForDisplay(
          cur.hudPanelPositionsByDisplay,
          displayLayoutKeyRef.current,
          { [id]: pos },
        ),
      }));
    },
    [persist],
  );

  const applyAutoHudLayout = useCallback(
    (result: IHudAutoRepositionResult) => {
      if (result.hudPanelPositions == null && result.notePanels == null) return;
      void persist((cur) => ({
        ...cur,
        ...(result.hudPanelPositions != null
          ? {
              hudPanelPositionsByDisplay: patchHudPanelPositionsForDisplay(
                cur.hudPanelPositionsByDisplay,
                displayLayoutKeyRef.current,
                result.hudPanelPositions,
              ),
            }
          : {}),
        ...(result.notePanels != null
          ? {
              notePanelsByDisplay: patchNotePanelsForDisplay(
                cur.notePanelsByDisplay,
                displayLayoutKeyRef.current,
                result.notePanels,
              ),
            }
          : {}),
      }));
    },
    [persist],
  );

  const arrangeHudPanelsNow = useCallback(() => {
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const snap = latestSettingsRef.current;
    const displayKey = displayLayoutKeyRef.current;
    const effectiveHud = resolveHudPanelPositionsForDisplay(
      snap.hudPanelPositions,
      snap.hudPanelPositionsByDisplay,
      displayKey,
    );
    const { widthPx, heightPx } = measureHudCanvasSize(canvas);
    const planInput = {
      widgets: snap.widgets,
      hudPanelPositions: effectiveHud,
      pluginDeckVisible: snap.importedPlugins.some((p) => p.enabled),
      notesListPanelVisible: resolveNotesListPanelVisible(
        resolveNotePanelsForDisplay(snap.notePanels, snap.notePanelsByDisplay, displayKey),
        snap.notesListPanelVisible,
      ),
    };
    const hudUpdates = computeHudPanelAutoLayoutUpdates(planInput, widthPx, heightPx, {
      onlyIfChanged: false,
    });
    const effectiveHudAfterArrange = { ...effectiveHud, ...hudUpdates };
    const effectiveNotePanels = resolveNotePanelsForDisplay(
      snap.notePanels,
      snap.notePanelsByDisplay,
      displayKey,
    );
    const notePanelUpdates = computeStickyNoteResizeUpdates(
      effectiveNotePanels,
      { ...planInput, hudPanelPositions: effectiveHudAfterArrange },
      widthPx,
      heightPx,
      { onlyIfChanged: false },
    );
    const hasHudUpdates = Object.keys(hudUpdates).length > 0;
    if (!hasHudUpdates && notePanelUpdates == null) return;
    applyAutoHudLayout({
      ...(hasHudUpdates ? { hudPanelPositions: hudUpdates } : {}),
      ...(notePanelUpdates != null ? { notePanels: notePanelUpdates } : {}),
    });
    if (hasHudUpdates) {
      canvas.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [applyAutoHudLayout]);

  const arrangeHudPanelsNowRef = useRef(arrangeHudPanelsNow);
  arrangeHudPanelsNowRef.current = arrangeHudPanelsNow;

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT) return;
      if (isHudKeyboardShortcutTypingTarget(ev.target)) return;
      ev.preventDefault();
      arrangeHudPanelsNowRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const setNoteActive = useCallback(
    (noteId: string, active: boolean) => {
      void persist((cur) => {
        const displayKey = displayLayoutKeyRef.current;
        const effectivePanels = resolveNotePanelsForDisplay(
          cur.notePanels,
          cur.notePanelsByDisplay,
          displayKey,
        );
        const onCanvas = effectivePanels.some((p) => p.noteId === noteId);
        if (active) {
          if (onCanvas) return cur;
          let hudLayoutLockedNext = cur.hudLayoutLocked;
          if (cur.hudLayoutLocked) {
            relockPromptNoteIdAfterAutoHudUnlockRef.current = noteId;
            hudLayoutLockedNext = false;
          }
          const position = defaultStickyNotePosition(
            effectivePanels.length,
            resolveHudPanelPositionsForDisplay(
              cur.hudPanelPositions,
              cur.hudPanelPositionsByDisplay,
              displayKey,
            ).notes,
          );
          return {
            ...cur,
            hudLayoutLocked: hudLayoutLockedNext,
            notePanelsByDisplay: patchNotePanelsForDisplay(cur.notePanelsByDisplay, displayKey, [
              ...effectivePanels,
              { noteId, position },
            ]),
            notesListPanelVisible: false,
          };
        }
        if (!onCanvas) return cur;
        if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
          relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
        }
        return {
          ...cur,
          notePanelsByDisplay: patchNotePanelsForDisplay(
            cur.notePanelsByDisplay,
            displayKey,
            effectivePanels.filter((p) => p.noteId !== noteId),
          ),
        };
      });
    },
    [persist],
  );

  const toggleNotesListPanel = useCallback(() => {
    void persist((cur) => ({
      ...cur,
      notesListPanelVisible: !cur.notesListPanelVisible,
    }));
  }, [persist]);

  const commitStickyNotePosition = useCallback(
    (noteId: string, pos: IStickyNotePosition) => {
      const snapshot = latestSettingsRef.current;
      const displayKey = displayLayoutKeyRef.current;
      const effectivePanels = resolveNotePanelsForDisplay(
        snapshot.notePanels,
        snapshot.notePanelsByDisplay,
        displayKey,
      );
      const prev = effectivePanels.find((p) => p.noteId === noteId)?.position;
      const moved =
        prev != null &&
        (prev.xPx !== pos.xPx ||
          prev.yPx !== pos.yPx ||
          prev.widthPx !== pos.widthPx ||
          prev.heightPx !== pos.heightPx);

      void (async () => {
        await persist((cur) => ({
          ...cur,
          notePanelsByDisplay: patchNotePanelsForDisplay(
            cur.notePanelsByDisplay,
            displayKey,
            resolveNotePanelsForDisplay(cur.notePanels, cur.notePanelsByDisplay, displayKey).map(
              (p) => (p.noteId === noteId ? { ...p, position: pos } : p),
            ),
          ),
        }));
        if (!moved) return;
        if (relockPromptNoteIdAfterAutoHudUnlockRef.current !== noteId) return;
        relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
        const ok = window.confirm(
          "Lock the panel layout again? You can toggle this anytime in the header.",
        );
        if (ok) {
          void persist((cur) => ({ ...cur, hudLayoutLocked: true }));
        }
      })();
    },
    [persist],
  );

  const refreshOptionalApiPerms = useCallback(async (): Promise<void> => {
    try {
      const [topSites, bookmarks, tabs] = await Promise.all([
        browser.permissions.contains({ permissions: ["topSites"] }),
        browser.permissions.contains({ permissions: ["bookmarks"] }),
        browser.permissions.contains({ permissions: ["tabs"] }),
      ]);
      setOptionalApiPerms({ topSites, bookmarks, tabs });
      setPermissionsEpoch((e) => e + 1);
    } catch {
      // Ignore: API unavailable in non-extension contexts.
    }
  }, []);

  useEffect(() => {
    const perms = browser.permissions;
    if (!perms?.onAdded || !perms?.onRemoved) return;
    const bump = (): void => {
      setPermissionsEpoch((e) => e + 1);
    };
    perms.onAdded.addListener(bump);
    perms.onRemoved.addListener(bump);
    return () => {
      perms.onAdded.removeListener(bump);
      perms.onRemoved.removeListener(bump);
    };
  }, []);

  useEffect(() => {
    if (!openSettings) return;
    void refreshOptionalApiPerms();
  }, [openSettings, refreshOptionalApiPerms]);

  const refreshPendingAlarms = useCallback(async () => {
    try {
      const alarms = await browser.alarms.getAll();
      const r = await browser.storage.local.get("alarmMeta");
      const meta = (typeof r.alarmMeta === "object" && r.alarmMeta ? r.alarmMeta : {}) as Record<
        string,
        string
      >;
      const pending: TPendingAlarm[] = alarms
        .filter((a) => a.name.startsWith("tabocalypse:"))
        .map((a) => ({
          name: a.name,
          scheduledTime: a.scheduledTime,
          message: coerceAlarmMetaMessage(meta[a.name]) || "Tabocalypse alarm",
        }))
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
      setPendingAlarms(pending);
    } catch {
      // alarms API unavailable outside extension context
    }
  }, []);

  useEffect(() => {
    if (!openSettings) return;
    setAlarmScheduleBanner(null);
    setEditingAlarmName(null);
    setAlarmWhen((prev) => (prev ? prev : defaultAlarmWhenLocal()));
    void refreshPendingAlarms();
  }, [openSettings, refreshPendingAlarms]);

  const openAlarmWhenPicker = useCallback(() => {
    const el = alarmWhenInputRef.current;
    if (!el) return;
    const pick = el.showPicker;
    if (typeof pick === "function") {
      void Promise.resolve(pick.call(el)).catch(() => {
        el.focus();
      });
    } else {
      el.focus();
    }
  }, []);

  const scheduleMyLinesPersist = useCallback(
    (myLines: string[]) => {
      const current = latestSettingsRef.current;
      const next = { ...current, myLines };
      latestSettingsRef.current = next;
      setSettings(next);

      if (myLinesSaveTimerRef.current !== null) {
        window.clearTimeout(myLinesSaveTimerRef.current);
      }
      myLinesSaveTimerRef.current = window.setTimeout(() => {
        myLinesSaveTimerRef.current = null;
        persistChainRef.current = persistChainRef.current
          .then(async (): Promise<boolean> => {
            await saveLatestToDisk();
            return true;
          })
          .catch((e: unknown) => {
            showHudError(e instanceof Error ? e.message : String(e));
            return false;
          });
      }, 300);
    },
    [saveLatestToDisk, showHudError],
  );

  const humorCtx: IHumorContext = useMemo(
    () => ({
      humorEnabled: settings.humorEnabled,
      humorIntensity: settings.humorIntensity,
      humorBuiltinVoice: settings.humorBuiltinVoice,
      humorIncludeUnsuckClassics: settings.humorIncludeUnsuckClassics,
      enabledBuiltinPackIds: settings.humorBuiltinPackIds,
      importedPacks: settings.importedPacks,
      myLines: settings.myLines,
      locale: navigator.language,
    }),
    [settings],
  );

  const backgroundPositionStr = useMemo(() => {
    const visId = visibleUserBackground.id;
    if (
      bgPanLive &&
      bgPanLive.kind === "user" &&
      settings.backgroundKind === "image" &&
      visId &&
      bgPanLive.id === visId
    ) {
      return `${bgPanLive.positionXPct}% ${bgPanLive.positionYPct}%`;
    }
    if (settings.backgroundKind === "bing" && bingChosenUrl) {
      const f = settings.bingWallpaperFramings[bingChosenUrl];
      if (f) return `${f.positionXPct}% ${f.positionYPct}%`;
    }
    if (settings.backgroundKind === "image" && visId) {
      const im = settings.userBackgroundImages.find((row) => row.id === visId);
      if (im) return `${im.positionXPct}% ${im.positionYPct}%`;
    }
    return "50% 50%";
  }, [
    bgPanLive,
    settings.backgroundKind,
    settings.bingWallpaperFramings,
    settings.userBackgroundImages,
    bingChosenUrl,
    visibleUserBackground.id,
  ]);

  const shellStyle = useMemo(
    () =>
      backgroundStyle(settings, {
        // Only paint Bing from a same-origin blob URL. Raw Peapix HTTPS URLs in CSS
        // can trigger cross-origin loads from the extension page (CORS / fetch noise).
        bingImageUrl: bingPaintUrl,
        userImageUrl: visibleUserBackground.dataUrl,
        backgroundPosition: backgroundPositionStr,
      }),
    [settings, bingPaintUrl, visibleUserBackground.dataUrl, backgroundPositionStr],
  );

  useLayoutEffect(() => {
    const html = document.documentElement;
    const bs = document.body;
    const { style: hs } = html;
    const { style: bsStyle } = bs;
    const prevHtml = hs.cssText;
    const prevBody = bsStyle.cssText;
    applyReactStyle(html, shellStyle);
    applyReactStyle(bs, shellStyle);
    hs.setProperty("min-height", "100%");
    bsStyle.setProperty("min-height", "100%");
    return () => {
      hs.cssText = prevHtml;
      bsStyle.cssText = prevBody;
    };
  }, [shellStyle]);

  const [bannerLine, setBannerLine] = useState(() => pickDailyLine(humorCtx));
  useEffect(() => {
    setBannerLine(pickDailyLine(humorCtx));
    const t = window.setInterval(() => setBannerLine(pickDailyLine(humorCtx)), 5 * 60_000);
    return () => window.clearInterval(t);
  }, [humorCtx, humorContentRevision]);

  const s = settings;

  const notesListPanelEffectiveVisible = useMemo(
    () => resolveNotesListPanelVisible(effectiveNotePanels, s.notesListPanelVisible),
    [effectiveNotePanels, s.notesListPanelVisible],
  );
  const hasVisibleStickyNotes = effectiveNotePanels.length > 0;

  const hudNumberLocale = useMemo(() => getNavigatorFormattingLocale(), []);
  const effectiveWeatherTemperatureUnit = useMemo(
    () => resolveEffectiveWeatherTemperatureUnit(s),
    [s.weatherTemperatureUnit, s.weatherTemperatureUnitAuto],
  );
  /** WebKit/Safari often emits `input` while the system color panel is open; `change` alone can leave the inline swatch stale. */
  const onBackgroundSolidColorChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      void persist((cur) => ({
        ...cur,
        backgroundSolid: coerceThemeHex(raw, cur.backgroundSolid),
      }));
    },
    [persist],
  );

  const onBackgroundGradientEndColorChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      void persist((cur) => ({
        ...cur,
        backgroundGradientEnd: coerceThemeHex(raw, cur.backgroundGradientEnd),
      }));
    },
    [persist],
  );

  const onAccentPrimaryColorChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      void persist((cur) => {
        const hex = coerceThemeHex(raw, cur.themeCustomAccent);
        const pair = getResolvedAccentPair(cur.themePalette, {
          accent: cur.themeCustomAccent,
          accent2: cur.themeCustomAccent2,
        });
        return {
          ...cur,
          themePalette: "custom",
          themeCustomAccent: hex,
          themeCustomAccent2: pair.accent2,
        };
      });
    },
    [persist],
  );

  const onAccentSecondaryColorChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      void persist((cur) => {
        const hex = coerceThemeHex(raw, cur.themeCustomAccent2);
        const pair = getResolvedAccentPair(cur.themePalette, {
          accent: cur.themeCustomAccent,
          accent2: cur.themeCustomAccent2,
        });
        return {
          ...cur,
          themePalette: "custom",
          themeCustomAccent: pair.accent,
          themeCustomAccent2: hex,
        };
      });
    },
    [persist],
  );

  /** Same gates as `onBackgroundPanPointerDown` for uploaded wallpaper pan (avoid a move cursor when drag is a no-op). */
  const userBackgroundWallpaperPanDraggable = useMemo(() => {
    if (s.hudLayoutLocked) return false;
    if (s.backgroundKind !== "image" || !visibleUserBackground.dataUrl || !userBgRepositionMode)
      return false;
    const id = visibleUserBackground.id;
    if (!id) return false;
    return s.userBackgroundImages.some((row) => row.id === id);
  }, [
    s.hudLayoutLocked,
    s.backgroundKind,
    s.userBackgroundImages,
    visibleUserBackground.dataUrl,
    visibleUserBackground.id,
    userBgRepositionMode,
  ]);

  const requestIntensity = (hi: THumorIntensity) => {
    void persist((cur) => {
      if ((hi === "spicy" || hi === "unhinged") && !cur.spicyContentAcknowledged) {
        setPendingIntensity(hi);
        setWarnSpicy(true);
        return cur;
      }
      return { ...cur, humorIntensity: hi };
    });
  };

  const confirmSpicy = () => {
    const hi = pendingIntensity ?? "spicy";
    void persist((cur) => ({ ...cur, spicyContentAcknowledged: true, humorIntensity: hi }));
    setWarnSpicy(false);
    setPendingIntensity(null);
  };

  const toggleWidget = (k: TWidgetKey, on: boolean) => {
    void persist((cur) => ({ ...cur, widgets: { ...cur.widgets, [k]: on } }));
  };

  const togglePack = (id: string, on: boolean) => {
    void persist((cur) => {
      const set = new Set(cur.humorBuiltinPackIds);
      if (on) set.add(id);
      else set.delete(id);
      return { ...cur, humorBuiltinPackIds: [...set] };
    });
  };

  const onPickBackgrounds = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = [...files];
    const dataUrls: string[] = [];
    for (const f of picked) {
      try {
        const url = await compressImageFileToDataUrl(f, {
          maxBytes: BG_MAX,
          maxEdgePx: BG_MAX_EDGE_PX,
        });
        dataUrls.push(url);
      } catch (e: unknown) {
        showHudError(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    const existingBytes = latestSettingsRef.current.userBackgroundImages.reduce(
      (n, im) => n + estimateDataUrlBytes(im.dataUrl),
      0,
    );
    const newBytes = dataUrls.reduce((n, u) => n + estimateDataUrlBytes(u), 0);
    if (existingBytes + newBytes > BG_TOTAL_MAX) {
      showHudError(
        `After compressing on this device, images still exceed about ${BG_TOTAL_LABEL} total. Remove one file or pick smaller sources.`,
      );
      return;
    }
    void persist((cur) => {
      const additions: IUserBackgroundImage[] = dataUrls.map((dataUrl) => ({
        id: crypto.randomUUID(),
        dataUrl,
        positionXPct: 50,
        positionYPct: 50,
      }));
      const nextImages = [...cur.userBackgroundImages, ...additions];
      const nextActive =
        cur.userBackgroundImages.length === 0 ? additions[0]!.id : cur.userBackgroundActiveId;
      const primary = nextImages.find((row) => row.id === nextActive) ?? nextImages[0];
      return {
        ...cur,
        backgroundKind: "image",
        userBackgroundImages: nextImages,
        userBackgroundActiveId: nextActive,
        userBackgroundDataUrl: primary?.dataUrl ?? null,
        userBackgroundDataUrls: nextImages.map((row) => row.dataUrl),
      };
    });
  };

  const deleteUserBackground = useCallback(
    (id: string) => {
      void persist((cur) => {
        const next = cur.userBackgroundImages.filter((im) => im.id !== id);
        let active = cur.userBackgroundActiveId;
        if (active === id) active = next[0]?.id ?? null;
        const primary = next.find((row) => row.id === active) ?? next[0];
        const nextKind =
          next.length === 0 && cur.backgroundKind === "image" ? "gradient" : cur.backgroundKind;
        return {
          ...cur,
          backgroundKind: nextKind,
          userBackgroundImages: next,
          userBackgroundActiveId: active,
          userBackgroundDataUrl: primary?.dataUrl ?? null,
          userBackgroundDataUrls: next.map((row) => row.dataUrl),
        };
      });
    },
    [persist],
  );

  const moveUserBackground = useCallback(
    (id: string, direction: "up" | "down") => {
      void persist((cur) => {
        const list = [...cur.userBackgroundImages];
        const i = list.findIndex((im) => im.id === id);
        if (i < 0) return cur;
        const j = direction === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return cur;
        const a = list[i]!;
        const b = list[j]!;
        list[i] = b;
        list[j] = a;
        return {
          ...cur,
          userBackgroundImages: list,
          userBackgroundDataUrls: list.map((row) => row.dataUrl),
        };
      });
    },
    [persist],
  );

  const onBackgroundPanPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (s.hudLayoutLocked) return;
      if (e.button !== 0) return;
      const canvas = hudCanvasRef.current;
      if (!canvas) return;
      if (s.backgroundKind === "image" && visibleUserBackground.dataUrl) {
        if (!userBgRepositionMode) return;
        const id = visibleUserBackground.id;
        if (!id) return;
        const im = s.userBackgroundImages.find((row) => row.id === id);
        if (!im) return;
        const originXPct = userBgRepositionDraft?.positionXPct ?? im.positionXPct;
        const originYPct = userBgRepositionDraft?.positionYPct ?? im.positionYPct;
        canvas.setPointerCapture(e.pointerId);
        bgPanDragRef.current = {
          pointerId: e.pointerId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          originXPct,
          originYPct,
          userId: id,
        };
        const live = {
          kind: "user" as const,
          id,
          positionXPct: im.positionXPct,
          positionYPct: im.positionYPct,
        };
        bgPanCommitRef.current = live;
        setBgPanLive(live);
        return;
      }
    },
    [
      s,
      visibleUserBackground.dataUrl,
      visibleUserBackground.id,
      userBgRepositionMode,
      userBgRepositionDraft,
    ],
  );

  const onBackgroundPanPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = bgPanDragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = ((e.clientX - drag.startClientX) / Math.max(1, rect.width)) * 100;
    const dy = ((e.clientY - drag.startClientY) / Math.max(1, rect.height)) * 100;
    const x = Math.min(100, Math.max(0, drag.originXPct + dx));
    const y = Math.min(100, Math.max(0, drag.originYPct + dy));
    const live = { kind: "user" as const, id: drag.userId, positionXPct: x, positionYPct: y };
    bgPanCommitRef.current = live;
    setBgPanLive(live);
  }, []);

  const finishBackgroundPan = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = bgPanDragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      try {
        hudCanvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      bgPanDragRef.current = null;
      const live = bgPanCommitRef.current;
      bgPanCommitRef.current = null;

      if (userBgRepositionModeRef.current) {
        setBgPanLive(null);
        if (live?.kind === "user") {
          setUserBgRepositionDraft({
            positionXPct: live.positionXPct,
            positionYPct: live.positionYPct,
          });
        }
      } else {
        setBgPanLive(null);
      }
    },
    [persist],
  );

  const onBackgroundPanDoubleClick = useCallback(() => {
    if (s.hudLayoutLocked) return;
    if (s.backgroundKind === "image" && visibleUserBackground.id) {
      if (userBgRepositionMode) {
        setUserBgRepositionDraft({ positionXPct: 50, positionYPct: 50 });
        return;
      }
      const id = visibleUserBackground.id;
      void persist((cur) => ({
        ...cur,
        userBackgroundImages: cur.userBackgroundImages.map((row) =>
          row.id === id ? { ...row, positionXPct: 50, positionYPct: 50 } : row,
        ),
      }));
      return;
    }
    if (s.backgroundKind === "bing" && bingChosenUrl) {
      const url = bingChosenUrl;
      void persist((cur) => ({
        ...cur,
        bingWallpaperFramings: {
          ...cur.bingWallpaperFramings,
          [url]: { positionXPct: 50, positionYPct: 50 },
        },
      }));
    }
  }, [
    s.hudLayoutLocked,
    s.backgroundKind,
    visibleUserBackground.id,
    userBgRepositionMode,
    bingChosenUrl,
    persist,
  ]);

  const commitUserBackgroundReposition = useCallback(() => {
    const id = visibleUserBackground.id;
    if (!id || s.backgroundKind !== "image") return;
    const im = latestSettingsRef.current.userBackgroundImages.find((row) => row.id === id);
    if (!im) return;
    const x = userBgRepositionDraft?.positionXPct ?? im.positionXPct;
    const y = userBgRepositionDraft?.positionYPct ?? im.positionYPct;
    void persist((cur) => ({
      ...cur,
      userBackgroundImages: cur.userBackgroundImages.map((row) =>
        row.id === id ? { ...row, positionXPct: x, positionYPct: y } : row,
      ),
    }));
    setUserBgRepositionMode(false);
    setUserBgRepositionDraft(null);
  }, [visibleUserBackground.id, s.backgroundKind, userBgRepositionDraft, persist]);

  const cancelUserBackgroundReposition = useCallback(() => {
    setUserBgRepositionMode(false);
    setUserBgRepositionDraft(null);
  }, []);

  const onUserBackgroundContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (s.hudLayoutLocked) return;
      if (s.backgroundKind !== "image" || !visibleUserBackground.dataUrl) return;
      e.preventDefault();
      const pad = 8;
      const approxW = 220;
      const approxH = 120;
      const x = Math.min(e.clientX, window.innerWidth - approxW - pad);
      const y = Math.min(e.clientY, window.innerHeight - approxH - pad);
      setUserBgContextMenu({ clientX: Math.max(pad, x), clientY: Math.max(pad, y) });
    },
    [s.hudLayoutLocked, s.backgroundKind, visibleUserBackground.dataUrl],
  );

  const scheduleAlarm = async () => {
    setAlarmScheduleBanner(null);
    const raw = alarmWhen.trim();
    if (!raw) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "Choose a date and time first (or use the calendar button).",
      });
      return;
    }
    const whenMs = new Date(raw).getTime();
    if (Number.isNaN(whenMs)) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "That date and time is not valid.",
      });
      return;
    }
    if (whenMs < Date.now()) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "Pick a time in the future.",
      });
      return;
    }
    const metaKey = "alarmMeta";
    const isEdit = editingAlarmName !== null;
    try {
      if (isEdit) {
        await browser.alarms.clear(editingAlarmName);
      }
      const name = isEdit ? editingAlarmName : `tabocalypse:${crypto.randomUUID()}`;
      const cur = await browser.storage.local.get(metaKey);
      const meta = {
        ...(typeof cur[metaKey] === "object" && cur[metaKey] ? cur[metaKey] : {}),
        [name]: alarmMessage.trim() || "Tabocalypse alarm",
      };
      await browser.storage.local.set({ [metaKey]: meta });
      await browser.alarms.create(name, { when: whenMs });
    } catch (e) {
      setAlarmScheduleBanner({
        kind: "err",
        message: e instanceof Error ? e.message : "Could not schedule the notification.",
      });
      return;
    }
    setAlarmMessage("");
    setAlarmWhen("");
    setEditingAlarmName(null);
    setAlarmScheduleBanner({
      kind: "ok",
      message: isEdit
        ? "Alarm updated."
        : "Scheduled. You will get a browser notification at that time (if notifications are allowed for this extension).",
    });
    void refreshPendingAlarms();
    window.setTimeout(() => {
      setAlarmScheduleBanner((b) => (b?.kind === "ok" ? null : b));
    }, 6000);
  };

  const deleteAlarm = async (name: string) => {
    try {
      await browser.alarms.clear(name);
      const r = await browser.storage.local.get("alarmMeta");
      const meta = (typeof r.alarmMeta === "object" && r.alarmMeta ? r.alarmMeta : {}) as Record<
        string,
        string
      >;
      const { [name]: _, ...rest } = meta;
      await browser.storage.local.set({ alarmMeta: rest });
    } catch {
      // ignore
    }
    if (editingAlarmName === name) {
      setEditingAlarmName(null);
      setAlarmWhen(defaultAlarmWhenLocal());
      setAlarmMessage("");
    }
    void refreshPendingAlarms();
  };

  const startEditAlarm = (alarm: TPendingAlarm) => {
    setEditingAlarmName(alarm.name);
    setAlarmWhen(formatDatetimeLocalFromDate(new Date(alarm.scheduledTime)));
    setAlarmMessage(
      alarm.message === "Tabocalypse alarm" ? "" : coerceAlarmMetaMessage(alarm.message),
    );
    setAlarmScheduleBanner(null);
  };

  const cancelEdit = () => {
    setEditingAlarmName(null);
    setAlarmWhen(defaultAlarmWhenLocal());
    setAlarmMessage("");
    setAlarmScheduleBanner(null);
  };

  const runByoAiTest = async () => {
    setAiResult(null);
    const byoAiPreset = matchByoAiProviderPreset(s.openaiBaseUrl, s.openaiModel);
    const apiKey = byoAiApiKeyForPreset(byoAiPreset, {
      openai: s.openaiApiKey,
      gemini: s.geminiApiKey,
    });
    if (!apiKey) {
      setAiResult("Add an API key first.");
      return;
    }
    const perm = await ensureByoAiHostPermission(s.openaiBaseUrl);
    if (!perm.ok) {
      setAiResult(perm.error);
      return;
    }
    const r = await testOpenAiCompatible({
      apiKey,
      baseUrl: s.openaiBaseUrl,
      model: s.openaiModel,
    });
    setAiResult(
      r.ok
        ? r.reply
        : augmentRateLimitErrorWithAlternateProviders(r.error, byoAiPreset, {
            openai: s.openaiApiKey,
            gemini: s.geminiApiKey,
          }),
    );
  };

  const importPackFile = async (file: File) => {
    try {
      let pack;
      if (file.name.endsWith(".zip")) {
        pack = parseTabocalypseZip(await file.arrayBuffer());
      } else {
        pack = parsePackJsonText(await file.text());
      }
      void persist((cur) => {
        const nextPacks = cur.importedPacks.filter((p) => p.id !== pack.id).concat(pack);
        if (estimateImportedBytes(nextPacks) > MAX_TOTAL_IMPORTED_BYTES) {
          throw new Error("Imported packs exceed local quota. Remove a pack first.");
        }
        return { ...cur, importedPacks: nextPacks };
      });
    } catch (e) {
      showHudError(e instanceof Error ? e.message : String(e));
    }
  };

  const importPluginFile = async (file: File) => {
    setPluginValidateLog("");
    const text = await file.text();
    const r = validatePluginJsonText(text);
    if (!r.ok || !r.plugin) {
      setPluginValidateLog(r.errors.join("\n"));
      return;
    }
    const plugin = r.plugin;
    setPluginValidateLog([...r.errors, ...r.warnings.map((w) => `warning: ${w}`)].join("\n"));
    void persist((cur) => ({
      ...cur,
      importedPlugins: mergeImportedPlugin(cur.importedPlugins, plugin),
    }));
  };

  const exportSettingsJson = () => {
    const cur = latestSettingsRef.current ?? s;
    const blob = new Blob([JSON.stringify(cur, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tabocalypse-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <HudToastProvider ref={hudToastRef} chaotic={s.preset === "chaos"}>
      <div className="shell">
        <div className="glitch-overlay" aria-hidden />
        {openSettings ? (
          <div className="dialog-backdrop" role="presentation" onClick={closeSettingsDialog}>
            <div
              className="dialog settings-dialog"
              role="dialog"
              aria-label="Settings"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="dialog-head">
                <h2>Settings</h2>
                <button type="button" className="btn ghost has-icon" onClick={closeSettingsDialog}>
                  <X size={18} strokeWidth={2} aria-hidden />
                  <span>Close</span>
                </button>
              </header>
              <div className="dialog-body">
                {!s.hasSeenSettingsIntro ? (
                  <section
                    className="settings-welcome"
                    role="region"
                    aria-label="Welcome to Tabocalypse"
                  >
                    <h3 className="settings-welcome-title">Welcome to Tabocalypse</h3>
                    <p className="settings-welcome-lead">
                      This new tab is a small HUD you control: turn widgets on or off, pick a theme
                      and background, tune the humor strip, import plugins, and more—all in this
                      dialog.
                    </p>
                    <p className="settings-welcome-note">
                      Start with{" "}
                      <HudTip tip="Jump to the Widgets section">
                        <button
                          type="button"
                          className="linkish p-0"
                          onClick={openWidgetsSettingsSection}
                          aria-label="Open Settings and jump to the Widgets section"
                        >
                          Settings &gt; Widgets
                        </button>
                      </HudTip>{" "}
                      to turn panels on, then{" "}
                      <HudTip tip="Jump to Optional permissions">
                        <button
                          type="button"
                          className="linkish p-0"
                          onClick={openOptionalPermissionsSettingsSection}
                          aria-label="Open Settings and jump to Optional permissions"
                        >
                          Settings &gt; Optional permissions
                        </button>
                      </HudTip>{" "}
                      for Top sites, Bookmarks, and Tab guilt.
                    </p>
                    <p className="settings-welcome-note">
                      Most preferences and notes sync when you use browser sync; API keys, todos,
                      and backgrounds stay on this device.
                    </p>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={acknowledgeSettingsIntro}
                    >
                      Got it
                    </button>
                  </section>
                ) : null}
                <div className="settings-accordion">
                  <details
                    ref={widgetsSettingsSectionRef}
                    className="acc-item"
                    open={settingsAccordionIsOpen("widgets", true)}
                    onToggle={onSettingsAccordionToggle("widgets", true)}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Widgets</span>
                    </summary>
                    <div className="acc-body">
                      {(Object.keys(s.widgets) as TWidgetKey[]).map((k) => (
                        <label key={k} className="check-row">
                          <input
                            type="checkbox"
                            checked={s.widgets[k]}
                            onChange={(e) => toggleWidget(k, e.target.checked)}
                          />
                          <span>{WIDGET_LABELS[k]}</span>
                        </label>
                      ))}
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("appearance")}
                    onToggle={onSettingsAccordionToggle("appearance")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Appearance</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2">Base mode</p>
                      <div className="row wrap">
                        {THEME_MODES.map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={
                              s.themeMode === mode ? "btn primary has-icon" : "btn has-icon"
                            }
                            onClick={() => void persist((cur) => ({ ...cur, themeMode: mode }))}
                          >
                            {mode === "dark" ? (
                              <Moon size={18} strokeWidth={2} aria-hidden />
                            ) : (
                              <Sun size={18} strokeWidth={2} aria-hidden />
                            )}
                            <span>{THEME_MODE_LABELS[mode]}</span>
                          </button>
                        ))}
                      </div>
                      <p className="muted sm mb-2 mt-4">Accent palette</p>
                      <div className="row wrap">
                        {THEME_PRESET_PALETTES.map((palette) => (
                          <button
                            key={palette}
                            type="button"
                            className={s.themePalette === palette ? "btn primary" : "btn"}
                            onClick={() =>
                              void persist((cur) => ({ ...cur, themePalette: palette }))
                            }
                          >
                            {THEME_PALETTE_LABELS[palette]}
                          </button>
                        ))}
                      </div>
                      <p className="muted sm mb-2 mt-4">Custom accents</p>
                      <p className="muted sm mb-3">
                        The swatches match the selected preset. Changing either switches to a custom
                        palette (synced like other appearance settings).
                      </p>
                      <HudTip tip="Sample the wallpaper (lower area → primary accent, upper band → secondary) and save a custom palette when the image changes. Sampled colors are lightened for readability—manual accent picks below are unchanged.">
                        <label className="check-row mb-3">
                          <input
                            type="checkbox"
                            checked={s.themeAccentsMatchWallpaper}
                            onChange={(e) => {
                              const v = e.target.checked;
                              void persist((cur) => ({ ...cur, themeAccentsMatchWallpaper: v }));
                            }}
                          />
                          <span>Auto HUD</span>
                        </label>
                      </HudTip>
                      <div className="color-accent-row">
                        <label htmlFor="tabocalypse-accent-primary">Primary accent</label>
                        <HudTip tip="Main HUD highlight color (buttons, borders)">
                          <HudColorInput
                            id="tabocalypse-accent-primary"
                            aria-label="Primary accent color"
                            value={
                              getResolvedAccentPair(s.themePalette, {
                                accent: s.themeCustomAccent,
                                accent2: s.themeCustomAccent2,
                              }).accent
                            }
                            onChange={onAccentPrimaryColorChange}
                          />
                        </HudTip>
                      </div>
                      <div className="color-accent-row">
                        <label htmlFor="tabocalypse-accent-secondary">Secondary accent</label>
                        <HudTip tip="Second highlight for hovers and contrast accents">
                          <HudColorInput
                            id="tabocalypse-accent-secondary"
                            aria-label="Secondary accent color"
                            value={
                              getResolvedAccentPair(s.themePalette, {
                                accent: s.themeCustomAccent,
                                accent2: s.themeCustomAccent2,
                              }).accent2
                            }
                            onChange={onAccentSecondaryColorChange}
                          />
                        </HudTip>
                      </div>
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("background")}
                    onToggle={onSettingsAccordionToggle("background")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Background</span>
                    </summary>
                    <div className="acc-body">
                      <div className="row wrap">
                        <button
                          type="button"
                          className={
                            s.backgroundKind === "solid" ? "btn primary has-icon" : "btn has-icon"
                          }
                          aria-pressed={s.backgroundKind === "solid"}
                          onClick={() =>
                            void persist((cur) => ({ ...cur, backgroundKind: "solid" }))
                          }
                        >
                          <Square size={18} strokeWidth={2} aria-hidden />
                          <span>Solid</span>
                        </button>
                        <button
                          type="button"
                          className={
                            s.backgroundKind === "gradient"
                              ? "btn primary has-icon"
                              : "btn has-icon"
                          }
                          aria-pressed={s.backgroundKind === "gradient"}
                          onClick={() =>
                            void persist((cur) => ({ ...cur, backgroundKind: "gradient" }))
                          }
                        >
                          <Paintbrush size={18} strokeWidth={2} aria-hidden />
                          <span>Gradient</span>
                        </button>
                        {s.userBackgroundImages.length > 0 ? (
                          <HudTip tip="Use your saved photo library as the new tab background">
                            <button
                              type="button"
                              className={
                                s.backgroundKind === "image"
                                  ? "btn primary has-icon"
                                  : "btn has-icon"
                              }
                              aria-pressed={s.backgroundKind === "image"}
                              onClick={() =>
                                void persist((cur) => {
                                  if (cur.userBackgroundImages.length === 0) return cur;
                                  const primary =
                                    cur.userBackgroundImages.find(
                                      (row) => row.id === cur.userBackgroundActiveId,
                                    ) ?? cur.userBackgroundImages[0];
                                  return {
                                    ...cur,
                                    backgroundKind: "image",
                                    userBackgroundActiveId:
                                      primary?.id ?? cur.userBackgroundActiveId,
                                    userBackgroundDataUrl: primary?.dataUrl ?? null,
                                    userBackgroundDataUrls: cur.userBackgroundImages.map(
                                      (row) => row.dataUrl,
                                    ),
                                  };
                                })
                              }
                            >
                              <Image size={18} strokeWidth={2} aria-hidden />
                              <span>My photos</span>
                            </button>
                          </HudTip>
                        ) : (
                          <HudTip tip="Pick images from your device to use as background">
                            <label className="btn has-icon">
                              <ImagePlus size={18} strokeWidth={2} aria-hidden />
                              <span>Upload first photo</span>
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  void onPickBackgrounds(e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </HudTip>
                        )}
                        <button
                          type="button"
                          className={
                            s.backgroundKind === "bing" ? "btn primary has-icon" : "btn has-icon"
                          }
                          aria-pressed={s.backgroundKind === "bing"}
                          onClick={() =>
                            void persist((cur) => ({ ...cur, backgroundKind: "bing" }))
                          }
                        >
                          <Images size={18} strokeWidth={2} aria-hidden />
                          <span>Bing spotlight</span>
                        </button>
                      </div>

                      <label className="check-row mt-3">
                        <input
                          type="checkbox"
                          checked={s.backgroundRotate ?? true}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, backgroundRotate: v }));
                          }}
                        />
                        <span>Rotate background</span>
                      </label>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="muted sm">Bing: minutes between images</span>
                          <BackgroundRotateMinutesInput
                            className="mt-1 w-full max-w-[8rem]"
                            value={s.backgroundRotateMinutesBing}
                            ariaLabel="Minutes between Bing spotlight images when rotation is on"
                            onCommit={(n) => {
                              void persist((cur) => ({ ...cur, backgroundRotateMinutesBing: n }));
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="muted sm">Uploads: minutes between photos</span>
                          <BackgroundRotateMinutesInput
                            className="mt-1 w-full max-w-[8rem]"
                            value={s.backgroundRotateMinutesUser}
                            ariaLabel="Minutes between uploaded photos when rotation is on"
                            onCommit={(n) => {
                              void persist((cur) => ({ ...cur, backgroundRotateMinutesUser: n }));
                            }}
                          />
                        </label>
                      </div>
                      <p className="muted sm">
                        Timers run while this tab stays open. Minimum{" "}
                        {BACKGROUND_ROTATE_MINUTES_MIN} minute; default{" "}
                        {DEFAULT_BACKGROUND_ROTATE_MINUTES} minutes; maximum{" "}
                        {Math.floor(BACKGROUND_ROTATE_MINUTES_MAX / 60)} hours.
                      </p>
                      {s.backgroundKind === "bing" ? (
                        <div className="mt-3 flex flex-col gap-2">
                          <p className="muted sm m-0">
                            Bing spotlight region (Peapix feed). Auto follows your browser locale;
                            turn off to pick a country.
                          </p>
                          <div className="row wrap gap-2">
                            <button
                              type="button"
                              className={s.bingWallpaperCountryAuto ? "btn primary sm" : "btn sm"}
                              onClick={() =>
                                void persist((cur) => ({ ...cur, bingWallpaperCountryAuto: true }))
                              }
                            >
                              Auto (locale)
                            </button>
                            <button
                              type="button"
                              className={!s.bingWallpaperCountryAuto ? "btn primary sm" : "btn sm"}
                              onClick={() =>
                                void persist((cur) => ({ ...cur, bingWallpaperCountryAuto: false }))
                              }
                            >
                              Fixed country
                            </button>
                          </div>
                          {!s.bingWallpaperCountryAuto ? (
                            <label className="block">
                              <span className="muted sm">Country</span>
                              <select
                                className="mt-1"
                                value={s.bingWallpaperCountry}
                                onChange={(e) => {
                                  const v = e.target
                                    .value as (typeof PEAPIX_BING_COUNTRY_OPTIONS)[number];
                                  void persist((cur) => ({ ...cur, bingWallpaperCountry: v }));
                                }}
                              >
                                {PEAPIX_BING_COUNTRY_OPTIONS.map((code) => (
                                  <option key={code} value={code}>
                                    {code.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <p className="muted sm m-0" role="status">
                              Using region: {peapixBingCountry.toUpperCase()}
                            </p>
                          )}
                        </div>
                      ) : null}
                      <p className="muted sm">
                        Local uploads are resized and compressed in your browser before saving
                        (about {BG_MAX_LABEL} stored per image, about {BG_TOTAL_LABEL} total per
                        multi-select). Large originals are shrunk to fit extension storage.
                      </p>
                      <p className="muted sm">
                        Unlock panel layout, then use Reposition background on an uploaded photo
                        (right click the wallpaper) to drag and preview framing; double-click empty
                        space on the new tab to re-center the current Bing or uploaded wallpaper.
                        Each Bing image and each saved photo remembers its own focal point.
                      </p>

                      {s.backgroundKind === "image" ? (
                        <UserBackgroundGallery
                          images={s.userBackgroundImages}
                          activeId={s.userBackgroundActiveId}
                          backgroundRotate={s.backgroundRotate ?? true}
                          onPickFiles={(files) => void onPickBackgrounds(files)}
                          onSetActiveId={(id) =>
                            void persist((cur) => {
                              const primary =
                                cur.userBackgroundImages.find((row) => row.id === id) ??
                                cur.userBackgroundImages[0];
                              return {
                                ...cur,
                                backgroundKind: "image",
                                userBackgroundActiveId: id,
                                userBackgroundDataUrl: primary?.dataUrl ?? null,
                                userBackgroundDataUrls: cur.userBackgroundImages.map(
                                  (row) => row.dataUrl,
                                ),
                              };
                            })
                          }
                          onDeleteId={deleteUserBackground}
                          onMove={moveUserBackground}
                        />
                      ) : null}

                      {s.backgroundKind === "solid" || s.backgroundKind === "gradient" ? (
                        <div
                          className="mt-4 flex flex-col gap-3 border border-outline/40 p-3"
                          role="group"
                          aria-label="Background colors"
                        >
                          {s.backgroundKind === "solid" ? (
                            <div className="color-accent-row">
                              <label htmlFor="tabocalypse-bg-solid">Background color</label>
                              <HudTip tip="Solid fill for the new tab behind the HUD">
                                <HudColorInput
                                  id="tabocalypse-bg-solid"
                                  aria-label="Background color"
                                  value={s.backgroundSolid}
                                  onChange={onBackgroundSolidColorChange}
                                />
                              </HudTip>
                            </div>
                          ) : (
                            <>
                              <div className="color-accent-row">
                                <label htmlFor="tabocalypse-bg-grad-start">Gradient start</label>
                                <HudTip tip="First color in the background blend">
                                  <HudColorInput
                                    id="tabocalypse-bg-grad-start"
                                    aria-label="Gradient start color"
                                    value={s.backgroundSolid}
                                    onChange={onBackgroundSolidColorChange}
                                  />
                                </HudTip>
                              </div>
                              <div className="color-accent-row">
                                <label htmlFor="tabocalypse-bg-grad-end">Gradient end</label>
                                <HudTip tip="Second color in the background blend">
                                  <HudColorInput
                                    id="tabocalypse-bg-grad-end"
                                    aria-label="Gradient end color"
                                    value={s.backgroundGradientEnd}
                                    onChange={onBackgroundGradientEndColorChange}
                                  />
                                </HudTip>
                              </div>
                              <p className="muted sm mb-0 mt-1">Gradient shape</p>
                              <div className="row wrap" role="group" aria-label="Gradient shape">
                                <HudTip tip="Blend colors along a line; set angle below">
                                  <button
                                    type="button"
                                    className={
                                      s.backgroundGradientShape === "linear" ? "btn primary" : "btn"
                                    }
                                    aria-pressed={s.backgroundGradientShape === "linear"}
                                    onClick={() =>
                                      void persist((cur) => ({
                                        ...cur,
                                        backgroundGradientShape: "linear",
                                      }))
                                    }
                                  >
                                    Linear
                                  </button>
                                </HudTip>
                                <HudTip tip="Circular blend from a focal point; set center below">
                                  <button
                                    type="button"
                                    className={
                                      s.backgroundGradientShape === "radial" ? "btn primary" : "btn"
                                    }
                                    aria-pressed={s.backgroundGradientShape === "radial"}
                                    onClick={() =>
                                      void persist((cur) => ({
                                        ...cur,
                                        backgroundGradientShape: "radial",
                                      }))
                                    }
                                  >
                                    Radial
                                  </button>
                                </HudTip>
                              </div>
                              {s.backgroundGradientShape === "linear" ? (
                                <div className="block">
                                  <span className="muted sm" id="tabocalypse-bg-grad-angle-label">
                                    Direction (degrees)
                                  </span>
                                  <div className="mt-1 flex flex-wrap items-center gap-3">
                                    <HudTip tip="Rotate the gradient direction (0° points up)">
                                      <input
                                        type="range"
                                        className="min-w-[10rem] flex-1"
                                        min={0}
                                        max={359}
                                        aria-labelledby="tabocalypse-bg-grad-angle-label"
                                        value={s.backgroundGradientAngleDeg}
                                        onChange={(e) => {
                                          const n = coerceBackgroundGradientAngleDeg(
                                            Number(e.target.value),
                                            s.backgroundGradientAngleDeg,
                                          );
                                          void persist((cur) => ({
                                            ...cur,
                                            backgroundGradientAngleDeg: n,
                                          }));
                                        }}
                                      />
                                    </HudTip>
                                    <label
                                      className="sr-only"
                                      htmlFor="tabocalypse-bg-grad-angle-num"
                                    >
                                      Direction in degrees
                                    </label>
                                    <HudTip tip="Exact angle in degrees (0–359)">
                                      <input
                                        id="tabocalypse-bg-grad-angle-num"
                                        type="number"
                                        className="w-20"
                                        min={0}
                                        max={359}
                                        aria-labelledby="tabocalypse-bg-grad-angle-label"
                                        value={s.backgroundGradientAngleDeg}
                                        onChange={(e) => {
                                          const n = coerceBackgroundGradientAngleDeg(
                                            Number(e.target.value),
                                            s.backgroundGradientAngleDeg,
                                          );
                                          void persist((cur) => ({
                                            ...cur,
                                            backgroundGradientAngleDeg: n,
                                          }));
                                        }}
                                      />
                                    </HudTip>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="block">
                                    <span className="muted sm" id="tabocalypse-bg-grad-cx-label">
                                      Center horizontal (%)
                                    </span>
                                    <div className="mt-1 flex flex-wrap items-center gap-3">
                                      <HudTip tip="Move the radial center left or right">
                                        <input
                                          type="range"
                                          className="min-w-[8rem] flex-1"
                                          min={0}
                                          max={100}
                                          aria-labelledby="tabocalypse-bg-grad-cx-label"
                                          value={s.backgroundGradientCenterXPct}
                                          onChange={(e) => {
                                            const n = coerceBackgroundGradientCenterPct(
                                              Number(e.target.value),
                                              s.backgroundGradientCenterXPct,
                                            );
                                            void persist((cur) => ({
                                              ...cur,
                                              backgroundGradientCenterXPct: n,
                                            }));
                                          }}
                                        />
                                      </HudTip>
                                      <label
                                        className="sr-only"
                                        htmlFor="tabocalypse-bg-grad-cx-num"
                                      >
                                        Center horizontal percent
                                      </label>
                                      <input
                                        id="tabocalypse-bg-grad-cx-num"
                                        type="number"
                                        className="w-20"
                                        min={0}
                                        max={100}
                                        aria-labelledby="tabocalypse-bg-grad-cx-label"
                                        value={s.backgroundGradientCenterXPct}
                                        onChange={(e) => {
                                          const n = coerceBackgroundGradientCenterPct(
                                            Number(e.target.value),
                                            s.backgroundGradientCenterXPct,
                                          );
                                          void persist((cur) => ({
                                            ...cur,
                                            backgroundGradientCenterXPct: n,
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="block">
                                    <span className="muted sm" id="tabocalypse-bg-grad-cy-label">
                                      Center vertical (%)
                                    </span>
                                    <div className="mt-1 flex flex-wrap items-center gap-3">
                                      <HudTip tip="Move the radial center up or down">
                                        <input
                                          type="range"
                                          className="min-w-[8rem] flex-1"
                                          min={0}
                                          max={100}
                                          aria-labelledby="tabocalypse-bg-grad-cy-label"
                                          value={s.backgroundGradientCenterYPct}
                                          onChange={(e) => {
                                            const n = coerceBackgroundGradientCenterPct(
                                              Number(e.target.value),
                                              s.backgroundGradientCenterYPct,
                                            );
                                            void persist((cur) => ({
                                              ...cur,
                                              backgroundGradientCenterYPct: n,
                                            }));
                                          }}
                                        />
                                      </HudTip>
                                      <label
                                        className="sr-only"
                                        htmlFor="tabocalypse-bg-grad-cy-num"
                                      >
                                        Center vertical percent
                                      </label>
                                      <input
                                        id="tabocalypse-bg-grad-cy-num"
                                        type="number"
                                        className="w-20"
                                        min={0}
                                        max={100}
                                        aria-labelledby="tabocalypse-bg-grad-cy-label"
                                        value={s.backgroundGradientCenterYPct}
                                        onChange={(e) => {
                                          const n = coerceBackgroundGradientCenterPct(
                                            Number(e.target.value),
                                            s.backgroundGradientCenterYPct,
                                          );
                                          void persist((cur) => ({
                                            ...cur,
                                            backgroundGradientCenterYPct: n,
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : null}

                      {s.backgroundKind === "bing" && !bingFetchErr && !bingImageLoadErr ? (
                        <p className="muted sm" role="status">
                          {bingChosenUrl
                            ? bingPaintUrl
                              ? bingRefreshing
                                ? "Refreshing Bing spotlight…"
                                : "Bing spotlight loaded."
                              : "Preparing Bing image…"
                            : "Loading Bing spotlight…"}
                        </p>
                      ) : null}
                      {s.backgroundKind === "bing" && bingFetchErr ? (
                        <p className="muted sm" role="status">
                          Bing list: {bingFetchErr}
                        </p>
                      ) : null}
                      {s.backgroundKind === "bing" && bingImageLoadErr ? (
                        <p className="muted sm" role="status">
                          Bing image: {bingImageLoadErr}
                        </p>
                      ) : null}
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("searchEngine")}
                    onToggle={onSettingsAccordionToggle("searchEngine")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Search engine</span>
                    </summary>
                    <div className="acc-body">
                      <SearchEngineSettingPicker
                        value={s.searchEngine}
                        onChange={(engine) =>
                          void persist((cur) => ({ ...cur, searchEngine: engine }))
                        }
                      />
                    </div>
                  </details>

                  <details
                    ref={weatherSettingsSectionRef}
                    id="settings-weather"
                    className="acc-item"
                    open={settingsAccordionIsOpen("weather")}
                    onToggle={onSettingsAccordionToggle("weather")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Weather</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2 mt-0">
                        Location and units for the Weather widget. Turn Weather on under Widgets if
                        you use it.
                      </p>
                      {s.weatherAutoGeo ? (
                        <p className="muted sm mb-2">
                          Automatic location updates your saved latitude and longitude with a single
                          browser lookup each time you open a new Tabocalypse tab—then it stops—not
                          continuous GPS tracking. Turn automatic location off under Optional
                          permissions below to edit coordinates manually.
                        </p>
                      ) : (
                        <p className="muted sm mb-2">
                          Manual latitude and longitude stay put until you change them. Tabocalypse
                          does not track your movements in real time.
                        </p>
                      )}
                      {!s.weatherGeoAdjusted ? (
                        <p className="mb-3 mt-0 text-xs leading-tight text-[var(--color-accent2)]">
                          Weather is still using the default GEO location. Update the coordinates or
                          run a browser location lookup so the forecast matches your area.
                        </p>
                      ) : null}
                      <div className="row">
                        <label className="block">
                          Lat
                          <input
                            type="number"
                            step="0.01"
                            value={s.weatherLat}
                            disabled={s.weatherAutoGeo}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              void persist((cur) => ({
                                ...cur,
                                weatherLat: v,
                                weatherGeoAdjusted: true,
                              }));
                            }}
                          />
                        </label>
                        <label className="block">
                          Lon
                          <input
                            type="number"
                            step="0.01"
                            value={s.weatherLon}
                            disabled={s.weatherAutoGeo}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              void persist((cur) => ({
                                ...cur,
                                weatherLon: v,
                                weatherGeoAdjusted: true,
                              }));
                            }}
                          />
                        </label>
                      </div>
                      {!s.weatherAutoGeo ? (
                        <>
                          <div className="row wrap gap-2 mt-3 mb-2">
                            <HudTip tip="Fills latitude and longitude once from the browser. Does not enable automatic lookups on future tabs or continuous tracking.">
                              <button
                                type="button"
                                className="btn primary has-icon"
                                disabled={geoStatus === "detecting"}
                                aria-label="Use my location once to set latitude and longitude for weather"
                                onClick={() => {
                                  fetchWeatherLocationOnce();
                                }}
                              >
                                <LocateFixed size={18} strokeWidth={2} aria-hidden />
                                <span>
                                  {geoStatus === "detecting"
                                    ? "Getting location once…"
                                    : "Use my location once"}
                                </span>
                              </button>
                            </HudTip>
                          </div>
                          {geoStatus === "denied" ? (
                            <p className="muted sm mb-2" style={{ color: "var(--color-danger)" }}>
                              Location permission denied. Allow location in your browser settings
                              and try again, or enter coordinates manually above.
                            </p>
                          ) : null}
                          {geoStatus === "unavailable" ? (
                            <p className="muted sm mb-2" style={{ color: "var(--color-danger)" }}>
                              Location is not available in this browser.
                            </p>
                          ) : null}
                        </>
                      ) : null}
                      <p className="muted sm mb-2 mt-4">Temperature units</p>
                      <p className="muted text-xs mb-2 mt-0">
                        Automatic picks Celsius or Fahrenheit from your browser locale (for example
                        United States regions use °F).
                      </p>
                      <div className="row wrap" role="group" aria-label="Temperature units">
                        <HudTip tip="Use Celsius or Fahrenheit based on your browser locale">
                          <button
                            type="button"
                            className={s.weatherTemperatureUnitAuto ? "btn primary" : "btn"}
                            onClick={() =>
                              void persist((cur) => ({ ...cur, weatherTemperatureUnitAuto: true }))
                            }
                          >
                            {WEATHER_TEMPERATURE_UNIT_AUTO_LABEL}
                          </button>
                        </HudTip>
                        {WEATHER_TEMPERATURE_UNITS.map((u) => (
                          <HudTip
                            key={u}
                            tip={
                              u === "celsius"
                                ? "Always show readings in Celsius"
                                : "Always show readings in Fahrenheit"
                            }
                          >
                            <button
                              type="button"
                              className={
                                !s.weatherTemperatureUnitAuto && s.weatherTemperatureUnit === u
                                  ? "btn primary"
                                  : "btn"
                              }
                              onClick={() =>
                                void persist((cur) => ({
                                  ...cur,
                                  weatherTemperatureUnitAuto: false,
                                  weatherTemperatureUnit: u,
                                }))
                              }
                            >
                              {WEATHER_UNIT_LABELS[u]}
                            </button>
                          </HudTip>
                        ))}
                      </div>
                      <p className="muted sm mb-2 mt-4">2 Lakes</p>
                      <p className="muted text-xs mb-2 mt-0">
                        Adds a &quot;2 Lakes&quot; view next to Forecast on the Weather widget with
                        buoy readings from King County (Lake Washington and Lake Sammamish).
                      </p>
                      <div className="row wrap gap-2">
                        <HudTip tip="Adds Forecast / 2 Lakes tabs on the Weather widget">
                          <button
                            type="button"
                            className={s.weatherLakesEmbedEnabled ? "btn primary" : "btn"}
                            onClick={() =>
                              void persist((cur) => ({
                                ...cur,
                                weatherLakesEmbedEnabled: !cur.weatherLakesEmbedEnabled,
                              }))
                            }
                          >
                            {s.weatherLakesEmbedEnabled ? "2 Lakes view on" : "2 Lakes view off"}
                          </button>
                        </HudTip>
                      </div>
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("chaos")}
                    onToggle={onSettingsAccordionToggle("chaos")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Chaos</span>
                    </summary>
                    <div className="acc-body">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={s.humorEnabled}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, humorEnabled: v }));
                          }}
                        />
                        <span>Humor on</span>
                      </label>
                      <fieldset className="m-0 min-w-0 border-0 p-0">
                        <legend className="text-sm font-medium">Built-in voice</legend>
                        <p className="muted sm mb-2 mt-1">
                          Pick one specialty voice, or default to mix the built-in packs you toggle
                          below. Your lines and imported packs still mix in. Use “Include Classic
                          jargon” to blend glossary-style lines with Gen-Z or your pack mix.
                        </p>
                        <div className="flex flex-col gap-1">
                          <label className="check-row">
                            <input
                              type="radio"
                              name="humor-builtin-voice"
                              checked={s.humorBuiltinVoice === "default"}
                              onChange={() =>
                                void persist((cur) => ({ ...cur, humorBuiltinVoice: "default" }))
                              }
                            />
                            <span>Default (pack toggles)</span>
                          </label>
                          <label className="check-row">
                            <input
                              type="radio"
                              name="humor-builtin-voice"
                              checked={s.humorBuiltinVoice === "gen_z"}
                              onChange={() =>
                                void persist((cur) => ({ ...cur, humorBuiltinVoice: "gen_z" }))
                              }
                            />
                            <span>Gen-Z</span>
                          </label>
                          <label className="check-row">
                            <input
                              type="radio"
                              name="humor-builtin-voice"
                              checked={s.humorBuiltinVoice === "unsuck_classics"}
                              onChange={() =>
                                void persist((cur) => ({
                                  ...cur,
                                  humorBuiltinVoice: "unsuck_classics",
                                }))
                              }
                            />
                            <span>Classic jargon</span>
                          </label>
                        </div>
                      </fieldset>
                      {s.humorBuiltinVoice !== "unsuck_classics" ? (
                        <label className="check-row mt-2">
                          <input
                            type="checkbox"
                            checked={s.humorIncludeUnsuckClassics}
                            disabled={!s.humorEnabled}
                            onChange={(e) => {
                              const v = e.target.checked;
                              void persist((cur) => ({ ...cur, humorIncludeUnsuckClassics: v }));
                            }}
                          />
                          <span>Include Classic jargon</span>
                        </label>
                      ) : null}
                      <p className="muted sm -mt-1 mb-2">
                        Classic jargon uses satirical business-term definitions (the same spirit as{" "}
                        <HudTip tip="Open Unsuck It Classics in a new browser tab">
                          <button
                            type="button"
                            className="linkish p-0"
                            onClick={() => openExternal("https://www.unsuck-it.com/classics")}
                          >
                            Unsuck It — Classics
                          </button>
                        </HudTip>
                        ). Specialty voices ignore the built-in pack toggles below.
                      </p>
                      <label className="block">
                        Intensity
                        <select
                          value={s.humorIntensity}
                          onChange={(e) => requestIntensity(e.target.value as THumorIntensity)}
                        >
                          <option value="off">off</option>
                          <option value="mild">mild</option>
                          <option value="spicy">spicy</option>
                          <option value="unhinged">unhinged</option>
                        </select>
                      </label>
                      <div className="mt-3 flex flex-col gap-2">
                        <p className="muted sm m-0">
                          Built-in humor lines refresh from the web about once a week (Classic
                          jargon from Unsuck It; optional pack JSON when configured at build time).
                          Bundled copy is used if a refresh fails.
                        </p>
                        {humorRefreshStatus ? (
                          <p className="muted sm m-0" role="status">
                            {humorRefreshStatus}
                          </p>
                        ) : null}
                        {(() => {
                          const lastAt = humorContentLastRefreshedAt(
                            getHumorContentCacheSnapshot(),
                          );
                          return lastAt ? (
                            <p className="muted sm m-0" role="status">
                              Last refreshed:{" "}
                              {new Date(lastAt).toLocaleString(hudNumberLocale, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          ) : null;
                        })()}
                        <HudTip tip="Fetch the latest built-in humor lines from the web now">
                          <button
                            type="button"
                            className="btn sm"
                            disabled={humorRefreshBusy}
                            onClick={() => {
                              setHumorRefreshBusy(true);
                              setHumorRefreshStatus(null);
                              void refreshHumorContentIfStale({ force: true })
                                .then((result) => {
                                  if (result.updated) {
                                    setHumorContentRevision((n) => n + 1);
                                    setHumorRefreshStatus("Humor lines updated.");
                                  } else if (result.error) {
                                    setHumorRefreshStatus(
                                      "Refresh failed — still using bundled or cached lines.",
                                    );
                                  } else {
                                    setHumorRefreshStatus("Already up to date.");
                                  }
                                })
                                .catch(() => {
                                  setHumorRefreshStatus(
                                    "Refresh failed — still using bundled or cached lines.",
                                  );
                                })
                                .finally(() => setHumorRefreshBusy(false));
                            }}
                          >
                            {humorRefreshBusy ? "Refreshing…" : "Refresh built-in humor now"}
                          </button>
                        </HudTip>
                      </div>
                      <p className="muted sm">Builtin packs (filtered for built-in lines only):</p>
                      {BUILTIN_PACKS.map((p) => (
                        <label key={p.id} className="check-row">
                          <input
                            type="checkbox"
                            checked={s.humorBuiltinPackIds.includes(p.id)}
                            disabled={s.humorBuiltinVoice !== "default"}
                            onChange={(e) => togglePack(p.id, e.target.checked)}
                          />
                          <span>
                            {p.name} <span className="muted sm">({p.maxIntensity})</span>
                          </span>
                        </label>
                      ))}
                      <p className="muted sm mt-3">
                        Your own lines (one per line) are mixed with the packs you enable — same
                        pool as the banner and the clock roast. Saved locally as you type.
                      </p>
                      <label htmlFor="tabocalypse-my-lines" className="block mt-2">
                        <span className="muted sm">Your lines</span>
                        <textarea
                          id="tabocalypse-my-lines"
                          rows={6}
                          className="mt-1 w-full"
                          placeholder="e.g. Another standup? Bold. Another reorg? Bolder."
                          value={s.myLines.join("\n")}
                          onChange={(e) => scheduleMyLinesPersist(e.target.value.split("\n"))}
                        />
                      </label>
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("presets")}
                    onToggle={onSettingsAccordionToggle("presets")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Presets</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2">
                        Applies right away. Adjusts jokes, the humor strip, and some widget toggles.
                        Panel snap vs chaotic layout stays under Panel layout and the header shuffle
                        button. New installs default to Chaos. Theme, background, and the rest of
                        Appearance are unchanged.
                      </p>
                      <div className="row wrap">
                        <button
                          type="button"
                          className={s.preset === "chaos" ? "btn primary has-icon" : "btn has-icon"}
                          aria-pressed={s.preset === "chaos"}
                          onClick={() => void persist((cur) => applyPreset("chaos", cur))}
                        >
                          <Flame size={18} strokeWidth={2} aria-hidden />
                          <span>Chaos</span>
                        </button>
                        <button
                          type="button"
                          className={
                            s.preset === "balanced" ? "btn primary has-icon" : "btn has-icon"
                          }
                          aria-pressed={s.preset === "balanced"}
                          onClick={() => void persist((cur) => applyPreset("balanced", cur))}
                        >
                          <Scale size={18} strokeWidth={2} aria-hidden />
                          <span>Balanced</span>
                        </button>
                        <button
                          type="button"
                          className={s.preset === "focus" ? "btn primary has-icon" : "btn has-icon"}
                          aria-pressed={s.preset === "focus"}
                          onClick={() => void persist((cur) => applyPreset("focus", cur))}
                        >
                          <Target size={18} strokeWidth={2} aria-hidden />
                          <span>Focus</span>
                        </button>
                      </div>
                      <div className="muted sm mt-3 flex flex-col gap-1.5">
                        <p className="m-0">
                          <span className="text-text">Chaos</span>
                          {" — "}
                          Default personality for Tabocalypse: spicier jokes and the humor strip on;
                          other widgets stay as they are. Snap vs chaotic HUD is independent—use
                          Panel layout or the header shuffle control.
                        </p>
                        <p className="m-0">
                          <span className="text-text">Balanced</span>
                          {" — "}
                          Mild jokes and the humor strip on. Widget toggles merge defaults with
                          yours.
                        </p>
                        <p className="m-0">
                          <span className="text-text">Focus</span>
                          {" — "}
                          Turns jokes off, hides the humor strip, and switches Search and Clock on.
                          Other widgets keep their current toggles.
                        </p>
                      </div>
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("panelLayout")}
                    onToggle={onSettingsAccordionToggle("panelLayout")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Panel layout</span>
                    </summary>
                    <div className="acc-body">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={s.hudLayoutAutoReposition}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, hudLayoutAutoReposition: v }));
                          }}
                        />
                        <span>Auto-reposition panels when the window is resized</span>
                      </label>
                      <p className="muted sm mb-2">
                        Priority control: when this is on, panels reflow on resize in both grid and
                        chaotic modes (overriding lock/chaotic for resize only). When it is off,
                        positions stay put on resize; chaotic, lock, and manual drag below take
                        over.
                      </p>
                      <button
                        type="button"
                        className="btn has-icon mb-2"
                        onClick={() => arrangeHudPanelsNow()}
                      >
                        <LayoutDashboard size={18} strokeWidth={2} aria-hidden />
                        <span>Arrange panels now ({HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT})</span>
                      </button>
                      <p className="muted sm mb-2">
                        Same repack as resize auto-reflow. Use the header dashboard icon or press{" "}
                        {HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT}. Pinned sticky notes stay put;
                        unpinned stickies reflow when the window resizes.
                      </p>
                      <p className="muted sm mb-2">
                        Drag panels by the grip in each header. In grid mode (not chaotic), a
                        12-column dashed overlay fills the HUD while layout is unlocked; drop
                        targets highlight the cells the panel will snap into. Use the top bar for
                        chaotic mode, arrange panels ({HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT}), and
                        layout lock.
                      </p>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={s.hudLayoutChaotic}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, hudLayoutChaotic: v }));
                          }}
                        />
                        <span>Chaotic layout (no snap to grid)</span>
                      </label>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={s.hudLayoutLocked}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, hudLayoutLocked: v }));
                          }}
                        />
                        <span>Lock panel positions</span>
                      </label>
                      {s.hudLayoutLocked ? (
                        <>
                          <label className="check-row ml-4">
                            <input
                              type="checkbox"
                              checked={s.hudLayoutAdaptiveWhileLocked}
                              disabled={!s.hudLayoutAutoReposition}
                              onChange={(e) => {
                                const v = e.target.checked;
                                void persist((cur) => ({
                                  ...cur,
                                  hudLayoutAdaptiveWhileLocked: v,
                                }));
                              }}
                            />
                            <span>Locked, but adaptive</span>
                          </label>
                          <p className="muted sm mb-2 ml-4">
                            Panels stay locked for dragging, but still reflow when the window is
                            resized. Requires auto-reposition above.
                          </p>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="btn has-icon mt-3"
                        onClick={() =>
                          void persist((cur) => ({
                            ...cur,
                            hudPanelPositionsByDisplay: resetHudPanelPositionsForDisplay(
                              cur.hudPanelPositionsByDisplay,
                              displayLayoutKeyRef.current,
                            ),
                          }))
                        }
                      >
                        <LayoutGrid size={18} strokeWidth={2} aria-hidden />
                        <span>Reset panel positions</span>
                      </button>
                    </div>
                  </details>

                  <details
                    ref={optionalPermissionsSettingsSectionRef}
                    className="acc-item"
                    open={settingsAccordionIsOpen("optionalPermissions")}
                    onToggle={onSettingsAccordionToggle("optionalPermissions")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Optional permissions</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2 mt-0">
                        Request browser access where HUD widgets need it—Top sites, bookmarks strip,
                        Tab guilt—or turn on automatic weather location lookups on each Tabocalypse
                        tab (still a single finite request per tab load, not live tracking—see
                        Weather for a one-time lookup while manually editing coordinates).
                      </p>
                      <div className="row wrap gap-2">
                        <button
                          ref={topSitesPermissionButtonRef}
                          type="button"
                          className="btn has-icon"
                          aria-label={
                            optionalApiPerms.topSites
                              ? "Disable Top sites permission"
                              : "Enable Top sites permission"
                          }
                          onClick={async () => {
                            if (optionalApiPerms.topSites) {
                              const ok = await browser.permissions.remove({
                                permissions: ["topSites"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, topSites: false },
                                }));
                              }
                            } else {
                              const ok = await browser.permissions.request({
                                permissions: ["topSites"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, topSites: true },
                                }));
                              }
                            }
                            void refreshOptionalApiPerms();
                          }}
                        >
                          <LayoutGrid size={18} strokeWidth={2} aria-hidden />
                          <span>
                            {optionalApiPerms.topSites ? "Disable Top sites" : "Enable Top sites"}
                          </span>
                        </button>
                        <button
                          ref={bookmarksPermissionButtonRef}
                          type="button"
                          className="btn has-icon"
                          aria-label={
                            optionalApiPerms.bookmarks
                              ? "Disable Bookmarks permission"
                              : "Enable Bookmarks permission"
                          }
                          onClick={async () => {
                            if (optionalApiPerms.bookmarks) {
                              const ok = await browser.permissions.remove({
                                permissions: ["bookmarks"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, bookmarksStrip: false },
                                }));
                              }
                            } else {
                              const ok = await browser.permissions.request({
                                permissions: ["bookmarks"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, bookmarksStrip: true },
                                }));
                              }
                            }
                            void refreshOptionalApiPerms();
                          }}
                        >
                          <Bookmark size={18} strokeWidth={2} aria-hidden />
                          <span>
                            {optionalApiPerms.bookmarks ? "Disable Bookmarks" : "Enable Bookmarks"}
                          </span>
                        </button>
                        <button
                          ref={tabsPermissionButtonRef}
                          type="button"
                          className="btn has-icon"
                          aria-label={
                            optionalApiPerms.tabs
                              ? "Disable Tab guilt (tabs) permission"
                              : "Enable Tab guilt (tabs) permission"
                          }
                          onClick={async () => {
                            if (optionalApiPerms.tabs) {
                              const ok = await browser.permissions.remove({
                                permissions: ["tabs"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, tabGuilt: false },
                                }));
                              }
                            } else {
                              const ok = await browser.permissions.request({
                                permissions: ["tabs"],
                              });
                              if (ok) {
                                await persist((cur) => ({
                                  ...cur,
                                  widgets: { ...cur.widgets, tabGuilt: true },
                                }));
                              }
                            }
                            void refreshOptionalApiPerms();
                          }}
                        >
                          <Layers size={18} strokeWidth={2} aria-hidden />
                          <span>
                            {optionalApiPerms.tabs
                              ? "Disable Tab guilt (tabs)"
                              : "Enable Tab guilt (tabs)"}
                          </span>
                        </button>
                        <HudTip tip="When on, saves latitude and longitude using one browser lookup each Tabocalypse tab you open—not continuous satellite-style tracking. For a single fill without future tab lookups, open Weather and tap Use my location once.">
                          <button
                            type="button"
                            className="btn has-icon"
                            disabled={geoStatus === "detecting"}
                            aria-label={
                              s.weatherAutoGeo
                                ? "Turn off automatic weather location on each tab"
                                : "Turn on automatic weather location each new Tabocalypse tab"
                            }
                            onClick={() => {
                              if (s.weatherAutoGeo) {
                                weatherManualGeoEpochRef.current += 1;
                                void persist((cur) => ({ ...cur, weatherAutoGeo: false }));
                                setGeoStatus(null);
                              } else {
                                void persist((cur) => ({ ...cur, weatherAutoGeo: true }));
                              }
                            }}
                          >
                            <LocateFixed size={18} strokeWidth={2} aria-hidden />
                            <span>
                              {geoStatus === "detecting"
                                ? "Updating location…"
                                : s.weatherAutoGeo
                                  ? "Turn off automatic weather location"
                                  : "Turn on automatic weather location"}
                            </span>
                          </button>
                        </HudTip>
                      </div>
                      {geoStatus === "denied" ? (
                        <p className="muted sm mt-1" style={{ color: "var(--color-danger)" }}>
                          Location permission denied. Allow location access in your browser and try
                          again, or enter coordinates manually under Weather.
                        </p>
                      ) : null}
                      {geoStatus === "unavailable" ? (
                        <p className="muted sm mt-1" style={{ color: "var(--color-danger)" }}>
                          Geolocation is not available in this browser.
                        </p>
                      ) : null}
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("alarms")}
                    onToggle={onSettingsAccordionToggle("alarms")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Alarms</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-3 mt-0">
                        One-time reminders as browser notifications (when the extension alarm API is
                        available).
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void scheduleAlarm();
                        }}
                        className="grid gap-3"
                      >
                        <label className="block">
                          <span className="muted sm">Date and time</span>
                          <div className="mt-1 flex max-w-md gap-2">
                            <input
                              ref={alarmWhenInputRef}
                              id="tabocalypse-alarm-when"
                              type="datetime-local"
                              step={60}
                              min={alarmDatetimeMin}
                              className="min-w-0 flex-1"
                              value={alarmWhen}
                              onChange={(e) => {
                                setAlarmWhen(e.target.value);
                                setAlarmScheduleBanner((b) => (b?.kind === "err" ? null : b));
                              }}
                              aria-label="Alarm date and time"
                            />
                            <HudTip tip="Open the date and time picker">
                              <button
                                type="button"
                                className="btn ghost sm icon-only shrink-0"
                                aria-label="Open date and time picker"
                                onClick={() => openAlarmWhenPicker()}
                              >
                                <Calendar size={18} strokeWidth={2} aria-hidden />
                              </button>
                            </HudTip>
                          </div>
                        </label>
                        <label className="block">
                          <span className="muted sm">Message (optional)</span>
                          <input
                            id="tabocalypse-alarm-msg"
                            type="text"
                            placeholder="What the notification should say"
                            className="mt-1 w-full"
                            value={alarmMessage}
                            onChange={(e) => {
                              setAlarmMessage(e.target.value);
                              setAlarmScheduleBanner((b) => (b?.kind === "err" ? null : b));
                            }}
                            aria-label="Alarm notification message"
                          />
                        </label>
                        <div className="flex items-center gap-2">
                          <HudTip
                            tip={
                              editingAlarmName
                                ? "Save changes to this alarm"
                                : "Save this one-time reminder using the time and message above"
                            }
                          >
                            <button type="submit" className="btn primary has-icon">
                              <CalendarClock size={20} strokeWidth={2} aria-hidden />
                              <span>{editingAlarmName ? "Update" : "Schedule"}</span>
                            </button>
                          </HudTip>
                          {editingAlarmName ? (
                            <button type="button" className="btn ghost" onClick={cancelEdit}>
                              Cancel
                            </button>
                          ) : null}
                        </div>
                        {alarmScheduleBanner ? (
                          <p
                            role="status"
                            className={
                              alarmScheduleBanner.kind === "err"
                                ? "err sm m-0"
                                : "m-0 text-sm text-accent"
                            }
                          >
                            {alarmScheduleBanner.message}
                          </p>
                        ) : null}
                      </form>
                      {pendingAlarms.length > 0 ? (
                        <>
                          <h4 className="mt-6 mb-2">Scheduled alarms</h4>
                          <ul className="grid gap-2" style={{ listStyle: "none", padding: 0 }}>
                            {pendingAlarms.map((alarm) => {
                              const reminderLine = formatAlarmReminderForList(alarm.message);
                              return (
                                <li
                                  key={alarm.name}
                                  className={`flex items-center gap-3 rounded border px-3 py-2 text-sm${editingAlarmName === alarm.name ? " border-accent" : ""}`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="font-mono text-xs opacity-70">
                                      {new Date(alarm.scheduledTime).toLocaleString()}
                                    </span>
                                    {reminderLine ? (
                                      <span className="ml-2">{reminderLine}</span>
                                    ) : null}
                                  </div>
                                  <HudTip tip="Edit this alarm">
                                    <button
                                      type="button"
                                      className="btn ghost sm icon-only"
                                      aria-label="Edit alarm"
                                      onClick={() => startEditAlarm(alarm)}
                                    >
                                      <Pencil size={16} strokeWidth={2} aria-hidden />
                                    </button>
                                  </HudTip>
                                  <HudTip tip="Delete this alarm">
                                    <button
                                      type="button"
                                      className="btn ghost sm icon-only"
                                      aria-label="Delete alarm"
                                      onClick={() => void deleteAlarm(alarm.name)}
                                    >
                                      <Trash2 size={16} strokeWidth={2} aria-hidden />
                                    </button>
                                  </HudTip>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </details>

                  <details
                    ref={byoAiSettingsSectionRef}
                    className="acc-item"
                    open={settingsAccordionIsOpen("byoAi")}
                    onToggle={onSettingsAccordionToggle("byoAi")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">BYO AI</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mt-0 mb-2">
                        OpenAI-compatible endpoints: you pay your provider. Enable the AI chat
                        widget under Settings &gt; Widgets. Nothing is sent without your key.
                      </p>
                      <ByoAiProviderSettingPicker
                        baseUrl={s.openaiBaseUrl}
                        model={s.openaiModel}
                        onSelectPreset={(preset) => {
                          const next = BYO_AI_PROVIDER_PRESETS[preset];
                          void persist((cur) => ({
                            ...cur,
                            openaiBaseUrl: next.baseUrl,
                            openaiModel: next.model,
                          }));
                        }}
                      />
                      <form
                        className="mt-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void runByoAiTest();
                        }}
                      >
                        <div className="flex gap-2">
                          <input
                            placeholder={
                              matchByoAiProviderPreset(s.openaiBaseUrl, s.openaiModel) === "gemini"
                                ? BYO_AI_PROVIDER_PRESETS.gemini.apiKeyHint
                                : matchByoAiProviderPreset(s.openaiBaseUrl, s.openaiModel) ===
                                    "openai"
                                  ? BYO_AI_PROVIDER_PRESETS.openai.apiKeyHint
                                  : "API key"
                            }
                            type={byoAiApiKeyVisible ? "text" : "password"}
                            autoComplete="off"
                            value={
                              matchByoAiProviderPreset(s.openaiBaseUrl, s.openaiModel) === "gemini"
                                ? s.geminiApiKey
                                : s.openaiApiKey
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              if (
                                matchByoAiProviderPreset(s.openaiBaseUrl, s.openaiModel) ===
                                "gemini"
                              ) {
                                void persist((cur) => ({ ...cur, geminiApiKey: v }));
                              } else {
                                void persist((cur) => ({ ...cur, openaiApiKey: v }));
                              }
                            }}
                            className="min-w-0 flex-1"
                          />
                          <HudTip
                            tip={byoAiApiKeyVisible ? "Hide the API key" : "Show the API key"}
                          >
                            <button
                              type="button"
                              className="btn ghost icon-only sm shrink-0"
                              aria-pressed={byoAiApiKeyVisible}
                              aria-label={byoAiApiKeyVisible ? "Hide API key" : "Show API key"}
                              onClick={() => setByoAiApiKeyVisible((visible) => !visible)}
                            >
                              {byoAiApiKeyVisible ? (
                                <EyeOff size={18} strokeWidth={2} aria-hidden />
                              ) : (
                                <Eye size={18} strokeWidth={2} aria-hidden />
                              )}
                            </button>
                          </HudTip>
                        </div>
                        <input
                          placeholder="Base URL"
                          value={s.openaiBaseUrl}
                          onChange={(e) => {
                            const v = e.target.value;
                            void persist((cur) => ({ ...cur, openaiBaseUrl: v }));
                          }}
                          className="mt-2 w-full"
                        />
                        <input
                          placeholder="Model"
                          value={s.openaiModel}
                          onChange={(e) => {
                            const v = e.target.value;
                            void persist((cur) => ({ ...cur, openaiModel: v }));
                          }}
                          className="mt-2 w-full"
                          autoComplete="off"
                        />
                        <button type="submit" className="btn has-icon mt-2">
                          <Sparkles size={18} strokeWidth={2} aria-hidden />
                          <span>Test chat completion</span>
                        </button>
                      </form>
                      {aiResult ? <pre className="ai-out">{aiResult}</pre> : null}
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("importPack")}
                    onToggle={onSettingsAccordionToggle("importPack")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Import pack</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2 mt-0">
                        Accepts .zip with pack.json, or standalone .json.
                      </p>
                      <label className="btn has-icon">
                        <FolderUp size={18} strokeWidth={2} aria-hidden />
                        <span>Choose file</span>
                        <input
                          hidden
                          type="file"
                          accept=".zip,.json,application/json"
                          onChange={(e) => void importPackFile(e.target.files![0]!)}
                        />
                      </label>
                      <p className="muted sm">You are responsible for imported content.</p>
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("importPlugin")}
                    onToggle={onSettingsAccordionToggle("importPlugin")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Import declarative plugin</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2 mt-0">Manifest tabocalypse-plugin.json.</p>
                      <label className="btn has-icon">
                        <Braces size={18} strokeWidth={2} aria-hidden />
                        <span>Choose JSON</span>
                        <input
                          hidden
                          type="file"
                          accept=".json,application/json"
                          onChange={(e) => void importPluginFile(e.target.files![0]!)}
                        />
                      </label>
                      <textarea
                        readOnly
                        rows={3}
                        className="mt-2 w-full"
                        value={pluginValidateLog}
                      />
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("manageImports")}
                    onToggle={onSettingsAccordionToggle("manageImports")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Manage imports</span>
                    </summary>
                    <div className="acc-body">
                      <p className="muted sm mb-2 mt-0">Packs</p>
                      {s.importedPacks.map((p) => (
                        <div key={p.id} className="row manage-row">
                          <label className="check-row">
                            <input
                              type="checkbox"
                              checked={p.enabled}
                              onChange={(e) => {
                                const v = e.target.checked;
                                void persist((cur) => ({
                                  ...cur,
                                  importedPacks: cur.importedPacks.map((x) =>
                                    x.id === p.id ? { ...x, enabled: v } : x,
                                  ),
                                }));
                              }}
                            />
                            <span>{p.name}</span>
                          </label>
                          <button
                            type="button"
                            className="btn ghost sm has-icon"
                            onClick={() =>
                              void persist((cur) => ({
                                ...cur,
                                importedPacks: cur.importedPacks.filter((x) => x.id !== p.id),
                              }))
                            }
                          >
                            <Trash2 size={18} strokeWidth={2} aria-hidden />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                      <p className="muted sm mb-2 mt-4">Plugins</p>
                      {s.importedPlugins.map((p) => (
                        <div key={p.id} className="row manage-row">
                          <label className="check-row">
                            <input
                              type="checkbox"
                              checked={p.enabled}
                              onChange={(e) => {
                                const v = e.target.checked;
                                void persist((cur) => ({
                                  ...cur,
                                  importedPlugins: cur.importedPlugins.map((x) =>
                                    x.id === p.id ? { ...x, enabled: v } : x,
                                  ),
                                }));
                              }}
                            />
                            <span>{p.name}</span>
                          </label>
                          <button
                            type="button"
                            className="btn ghost sm has-icon"
                            onClick={() =>
                              void persist((cur) => ({
                                ...cur,
                                importedPlugins: removeImportedPlugin(cur.importedPlugins, p.id),
                              }))
                            }
                          >
                            <Trash2 size={18} strokeWidth={2} aria-hidden />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>

                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("data")}
                    onToggle={onSettingsAccordionToggle("data")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Data</span>
                    </summary>
                    <div className="acc-body">
                      <div className="row wrap gap-2">
                        <button type="button" className="btn has-icon" onClick={exportSettingsJson}>
                          <Download size={18} strokeWidth={2} aria-hidden />
                          <span>Export settings JSON</span>
                        </button>
                        <label className="btn has-icon">
                          <Upload size={18} strokeWidth={2} aria-hidden />
                          <span>Import settings JSON</span>
                          <input
                            hidden
                            type="file"
                            accept="application/json"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                try {
                                  const parsed = JSON.parse(
                                    String(reader.result),
                                  ) as Partial<ISettings>;
                                  const d = defaultSettings();
                                  const importThemeMode = coerceThemeMode(
                                    parsed.themeMode,
                                    d.themeMode,
                                  );
                                  const importGradFallback = themeGradientStops(importThemeMode);
                                  const merged: ISettings = {
                                    ...d,
                                    ...parsed,
                                    version: 1,
                                    preset: coercePreset(parsed.preset, d.preset),
                                    widgets: mergeWidgets(
                                      parsed.widgets as
                                        | Partial<Record<string, unknown>>
                                        | undefined,
                                    ),
                                    themeMode: importThemeMode,
                                    themePalette: coerceThemePalette(
                                      parsed.themePalette,
                                      d.themePalette,
                                    ),
                                    themeCustomAccent: coerceThemeHex(
                                      parsed.themeCustomAccent,
                                      d.themeCustomAccent,
                                    ),
                                    themeCustomAccent2: coerceThemeHex(
                                      parsed.themeCustomAccent2,
                                      d.themeCustomAccent2,
                                    ),
                                    themeAccentsMatchWallpaper:
                                      typeof parsed.themeAccentsMatchWallpaper === "boolean"
                                        ? parsed.themeAccentsMatchWallpaper
                                        : d.themeAccentsMatchWallpaper,
                                    backgroundSolid: coerceThemeHex(
                                      parsed.backgroundSolid,
                                      d.backgroundSolid,
                                    ),
                                    backgroundGradientMid: coerceThemeHex(
                                      parsed.backgroundGradientMid,
                                      importGradFallback.mid,
                                    ),
                                    backgroundGradientEnd: coerceThemeHex(
                                      parsed.backgroundGradientEnd,
                                      importGradFallback.end,
                                    ),
                                    backgroundGradientShape: coerceBackgroundGradientShape(
                                      parsed.backgroundGradientShape,
                                      d.backgroundGradientShape,
                                    ),
                                    backgroundGradientAngleDeg: coerceBackgroundGradientAngleDeg(
                                      parsed.backgroundGradientAngleDeg,
                                      d.backgroundGradientAngleDeg,
                                    ),
                                    backgroundGradientCenterXPct: coerceBackgroundGradientCenterPct(
                                      parsed.backgroundGradientCenterXPct,
                                      d.backgroundGradientCenterXPct,
                                    ),
                                    backgroundGradientCenterYPct: coerceBackgroundGradientCenterPct(
                                      parsed.backgroundGradientCenterYPct,
                                      d.backgroundGradientCenterYPct,
                                    ),
                                    clockHourFormat: coerceClockHourFormat(
                                      parsed.clockHourFormat,
                                      d.clockHourFormat,
                                    ),
                                    clockHourFormatAuto:
                                      typeof parsed.clockHourFormatAuto === "boolean"
                                        ? parsed.clockHourFormatAuto
                                        : d.clockHourFormatAuto,
                                    weatherTemperatureUnit: coerceWeatherTemperatureUnit(
                                      parsed.weatherTemperatureUnit,
                                      d.weatherTemperatureUnit,
                                    ),
                                    weatherTemperatureUnitAuto:
                                      typeof parsed.weatherTemperatureUnitAuto === "boolean"
                                        ? parsed.weatherTemperatureUnitAuto
                                        : d.weatherTemperatureUnitAuto,
                                    weatherGeoAdjusted: resolveWeatherGeoAdjusted(parsed, d),
                                    weatherLakesEmbedEnabled:
                                      typeof parsed.weatherLakesEmbedEnabled === "boolean"
                                        ? parsed.weatherLakesEmbedEnabled
                                        : d.weatherLakesEmbedEnabled,
                                    weatherPanelView: coerceWeatherPanelView(
                                      parsed.weatherPanelView,
                                      d.weatherPanelView,
                                    ),
                                    cryptoChartDays: coerceCryptoChartDays(
                                      parsed.cryptoChartDays,
                                      d.cryptoChartDays,
                                    ),
                                    humorBuiltinVoice: coerceHumorBuiltinVoice(
                                      parsed as {
                                        humorBuiltinVoice?: unknown;
                                        humorGenZMode?: unknown;
                                      },
                                    ),
                                    humorIncludeUnsuckClassics:
                                      typeof parsed.humorIncludeUnsuckClassics === "boolean"
                                        ? parsed.humorIncludeUnsuckClassics
                                        : d.humorIncludeUnsuckClassics,
                                    backgroundRotate:
                                      typeof parsed.backgroundRotate === "boolean"
                                        ? parsed.backgroundRotate
                                        : d.backgroundRotate,
                                    hasSeenSettingsIntro:
                                      typeof parsed.hasSeenSettingsIntro === "boolean"
                                        ? parsed.hasSeenSettingsIntro
                                        : true,
                                  };
                                  void persist(applyChaosPresetHumorHarmony(merged));
                                } catch {
                                  showHudError("Invalid settings JSON");
                                }
                              };
                              reader.readAsText(f);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </details>
                  <details
                    className="acc-item"
                    open={settingsAccordionIsOpen("debug")}
                    onToggle={onSettingsAccordionToggle("debug")}
                  >
                    <summary className="acc-summary">
                      <span className="acc-title">Debug</span>
                    </summary>
                    <div className="acc-body">
                      <label className="check-row mt-0">
                        <input
                          type="checkbox"
                          checked={s.debugPluginSource}
                          onChange={(e) => {
                            const v = e.target.checked;
                            void persist((cur) => ({ ...cur, debugPluginSource: v }));
                          }}
                        />
                        <span>Show plugin widget types</span>
                      </label>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {warnSpicy ? (
          <div className="dialog-backdrop" role="presentation">
            <div
              className="dialog small flex flex-col gap-4 p-6"
              role="dialog"
              aria-label="Content notice"
            >
              <h2>Turn it up?</h2>
              <p>
                Spicy and unhinged modes may include swearing or abrasive humor in curated packs.
                You are responsible for imported content.
              </p>
              <div className="row justify-end gap-2">
                <button
                  type="button"
                  className="btn ghost has-icon"
                  onClick={() => setWarnSpicy(false)}
                >
                  <CircleX size={18} strokeWidth={2} aria-hidden />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className="btn primary has-icon"
                  onClick={() => confirmSpicy()}
                >
                  <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
                  <span>I understand</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <header className="top-bar">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="title">Tabocalypse</h1>
              <p className="tagline">SYSTEM_STABLE: FALSE</p>
            </div>
          </div>
          {s.widgets.search ? (
            <SearchWidget
              engine={s.searchEngine}
              assistActive={s.searchAssistActive}
              onAssistActiveChange={(active) => {
                void persist((cur) => ({ ...cur, searchAssistActive: active }));
              }}
              humorEnabled={s.humorEnabled}
              humorIntensity={s.humorIntensity}
              variant="header"
            />
          ) : null}
          <div className="flex shrink-0 items-center gap-2">
            <HudTip
              tip={
                s.hudLayoutChaotic
                  ? "Turn on grid snap so panels align to the layout grid and show the dashed overlay"
                  : "Turn on Chaotic layout so panels ignore the snap grid and hide the overlay"
              }
            >
              <button
                type="button"
                className={s.hudLayoutChaotic ? "btn primary icon-only" : "btn ghost icon-only"}
                aria-pressed={s.hudLayoutChaotic}
                aria-label={
                  s.hudLayoutChaotic
                    ? "Chaotic layout on; press to snap panels to a grid"
                    : "Snap to grid on; press for Chaotic layout"
                }
                onClick={() =>
                  void persist((cur) => ({ ...cur, hudLayoutChaotic: !cur.hudLayoutChaotic }))
                }
              >
                {s.hudLayoutChaotic ? (
                  <Shuffle size={20} strokeWidth={2} aria-hidden />
                ) : (
                  <LayoutGrid size={20} strokeWidth={2} aria-hidden />
                )}
              </button>
            </HudTip>
            <HudTip
              tip={`Arrange visible HUD panels to fit this window (${HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT}). Pinned stickies stay put`}
            >
              <button
                type="button"
                className="btn ghost icon-only"
                aria-label={`Arrange HUD panels (${HUD_ARRANGE_PANELS_KEYBOARD_SHORTCUT})`}
                onClick={() => arrangeHudPanelsNow()}
              >
                <LayoutDashboard size={20} strokeWidth={2} aria-hidden />
              </button>
            </HudTip>
            <HudTip
              tip={
                s.hudLayoutLocked
                  ? s.hudLayoutAdaptiveWhileLocked && s.hudLayoutAutoReposition
                    ? "Layout locked: panels reflow on resize but cannot be dragged. Unlock to move by hand"
                    : "Unlock so you can drag HUD panels to new positions"
                  : "Lock panel positions so they stay put while you work"
              }
            >
              <button
                type="button"
                className={s.hudLayoutLocked ? "btn primary icon-only" : "btn ghost icon-only"}
                aria-pressed={s.hudLayoutLocked}
                aria-label={s.hudLayoutLocked ? "Unlock panel layout" : "Lock panel layout"}
                onClick={() =>
                  void persist((cur) => ({ ...cur, hudLayoutLocked: !cur.hudLayoutLocked }))
                }
              >
                {s.hudLayoutLocked ? (
                  <LucideLock size={20} strokeWidth={2} aria-hidden />
                ) : (
                  <Unlock size={20} strokeWidth={2} aria-hidden />
                )}
              </button>
            </HudTip>
            <HudTip tip="Open the Settings dialog">
              <button
                type="button"
                className={openSettings ? "btn primary icon-only" : "btn ghost icon-only"}
                aria-expanded={openSettings}
                aria-label="Settings"
                onClick={() => setOpenSettings(true)}
              >
                <SettingsIcon size={20} strokeWidth={2} aria-hidden />
              </button>
            </HudTip>
          </div>
        </header>

        {userBgContextMenu ? (
          <div
            ref={userBgContextMenuRef}
            role="menu"
            aria-label="Background photo"
            className="fixed z-[100] flex min-w-[13rem] flex-col border-2 border-accent bg-elevated py-1 shadow-[4px_4px_0_0_var(--color-shadow-hard)]"
            style={{ left: userBgContextMenu.clientX, top: userBgContextMenu.clientY }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {!userBgRepositionMode ? (
              <div className="w-full border-b border-border last:border-b-0 [&>div]:flex [&>div]:w-full">
                <HudTip tip="Hold the mouse button and drag to preview; release to see the saved framing until you choose Set position">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left font-display text-xs font-bold uppercase tracking-widest text-text transition-colors duration-100 hover:bg-surface-strong active:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-inset"
                    onClick={() => {
                      setUserBgRepositionMode(true);
                      setUserBgRepositionDraft(null);
                      setUserBgContextMenu(null);
                    }}
                  >
                    <Move size={18} strokeWidth={2} aria-hidden />
                    <span>Reposition background</span>
                  </button>
                </HudTip>
              </div>
            ) : (
              <>
                <div className="w-full border-b border-border [&>div]:flex [&>div]:w-full">
                  <HudTip tip="Save this framing to your background settings">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left font-display text-xs font-bold uppercase tracking-widest text-accent transition-colors duration-100 hover:bg-surface-strong active:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-inset"
                      onClick={() => {
                        commitUserBackgroundReposition();
                        setUserBgContextMenu(null);
                      }}
                    >
                      <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
                      <span>Set position</span>
                    </button>
                  </HudTip>
                </div>
                <div className="w-full [&>div]:flex [&>div]:w-full">
                  <HudTip tip="Exit without saving changes to the saved framing">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left font-display text-xs font-bold uppercase tracking-widest text-muted transition-colors duration-100 hover:bg-surface-strong hover:text-text active:bg-surface2 active:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:ring-inset"
                      onClick={() => {
                        cancelUserBackgroundReposition();
                        setUserBgContextMenu(null);
                      }}
                    >
                      <CircleX size={18} strokeWidth={2} aria-hidden />
                      <span>Cancel repositioning</span>
                    </button>
                  </HudTip>
                </div>
              </>
            )}
          </div>
        ) : null}

        {userBgRepositionMode && s.backgroundKind === "image" && visibleUserBackground.dataUrl ? (
          <div
            className="pointer-events-auto fixed bottom-6 left-1/2 z-[99] flex max-w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-stretch gap-3 border-2 border-accent bg-elevated px-4 py-3 shadow-[4px_4px_0_0_var(--color-shadow-hard)] sm:flex-row sm:items-center"
            role="status"
            aria-live="polite"
          >
            <p className="m-0 text-center font-display text-xs font-bold uppercase leading-snug tracking-widest text-accent sm:text-left">
              Repositioning background — hold the mouse button and drag to preview framing; release
              returns to the saved view until you set it. Double-click centers the next preview.
              Press Escape to cancel.
            </p>
            <div className="flex shrink-0 flex-wrap justify-center gap-2 sm:justify-end">
              <HudTip tip="Save this framing to your background settings">
                <button
                  type="button"
                  className="btn primary sm has-icon"
                  onClick={() => {
                    commitUserBackgroundReposition();
                  }}
                >
                  <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
                  <span>Set position</span>
                </button>
              </HudTip>
              <HudTip tip="Exit without saving changes to the saved framing">
                <button
                  type="button"
                  className="btn ghost sm has-icon"
                  onClick={() => {
                    cancelUserBackgroundReposition();
                  }}
                >
                  <CircleX size={18} strokeWidth={2} aria-hidden />
                  <span>Cancel</span>
                </button>
              </HudTip>
            </div>
          </div>
        ) : null}

        {s.widgets.humorBanner && bannerLine ? (
          <div className="humor-banner">
            <span>{bannerLine}</span>
          </div>
        ) : null}

        <main className="hud-main">
          <div ref={hudCanvasRef} className="hud-canvas">
            <HudPlacementProvider>
              <div
                role="presentation"
                className={[
                  "absolute inset-0 z-[1]",
                  !s.hudLayoutLocked &&
                  ((s.backgroundKind === "image" && visibleUserBackground.dataUrl) ||
                    (s.backgroundKind === "bing" && bingPaintUrl))
                    ? "pointer-events-auto touch-none"
                    : "pointer-events-none",
                  userBackgroundWallpaperPanDraggable ? "cursor-move" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPointerDown={onBackgroundPanPointerDown}
                onPointerMove={onBackgroundPanPointerMove}
                onPointerUp={finishBackgroundPan}
                onPointerCancel={finishBackgroundPan}
                onDoubleClick={onBackgroundPanDoubleClick}
                onContextMenu={onUserBackgroundContextMenu}
              />
              <HudLayoutMetricsSync
                canvasRef={hudCanvasRef}
                enabled={!s.hudLayoutChaotic && !s.hudLayoutLocked}
              />
              <HudAutoRepositionSync
                canvasRef={hudCanvasRef}
                hudAutoRepositionEnabled={isHudAutoRepositionEnabled(s)}
                widgets={s.widgets}
                hudPanelPositions={effectiveHudPanelPositions}
                notePanels={effectiveNotePanels}
                pluginDeckVisible={s.importedPlugins.some((p) => p.enabled)}
                notesListPanelVisible={notesListPanelEffectiveVisible}
                onLayout={applyAutoHudLayout}
              />
              <HudCanvasGrid visible={!s.hudLayoutChaotic && !s.hudLayoutLocked} />
              {s.widgets.todo ? (
                <DraggableHudPanel
                  key="todo"
                  panelId="todo"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.todo}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("todo", pos)}
                >
                  <TodoWidget
                    items={s.todos}
                    onChange={(todos) => void persist((cur) => ({ ...cur, todos }))}
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.clock ? (
                <DraggableHudPanel
                  key="clock"
                  panelId="clock"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.clock}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("clock", pos)}
                >
                  <ClockWidget
                    locale={hudNumberLocale}
                    hourFormat={s.clockHourFormat}
                    onSelectHourFormat={(clockHourFormat) =>
                      void persist((cur) => ({ ...cur, clockHourFormat }))
                    }
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.tabGuilt ? (
                <DraggableHudPanel
                  key="tabGuilt"
                  panelId="tabGuilt"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.tabGuilt}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("tabGuilt", pos)}
                >
                  <TabGuilt
                    permissionsEpoch={permissionsEpoch}
                    onOpenTabsSettings={openTabsSettingsSection}
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.weather ? (
                <DraggableHudPanel
                  key="weather"
                  panelId="weather"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.weather}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("weather", pos)}
                >
                  <WeatherWidget
                    lat={s.weatherLat}
                    lon={s.weatherLon}
                    showGeoAccuracyHint={!s.weatherGeoAdjusted}
                    onOpenWeatherSettings={openWeatherSettingsSection}
                    effectiveTemperatureUnit={effectiveWeatherTemperatureUnit}
                    displayLocale={hudNumberLocale}
                    onSelectExplicitTemperatureUnit={(weatherTemperatureUnit) =>
                      void persist((cur) => ({
                        ...cur,
                        weatherTemperatureUnitAuto: false,
                        weatherTemperatureUnit,
                      }))
                    }
                    lakesEmbedEnabled={s.weatherLakesEmbedEnabled}
                    panelView={s.weatherPanelView}
                    onSelectPanelView={(weatherPanelView) =>
                      void persist((cur) => ({ ...cur, weatherPanelView }))
                    }
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.crypto ? (
                <DraggableHudPanel
                  key="crypto"
                  panelId="crypto"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.crypto}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("crypto", pos)}
                >
                  <CryptoPricesWidget
                    chartDays={s.cryptoChartDays}
                    humorEnabled={s.humorEnabled}
                    humorIntensity={s.humorIntensity}
                    displayLocale={hudNumberLocale}
                    onSelectChartDays={(cryptoChartDays) =>
                      void persist((cur) => ({ ...cur, cryptoChartDays }))
                    }
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.speedTest ? (
                <DraggableHudPanel
                  key="speedTest"
                  panelId="speedTest"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.speedTest}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("speedTest", pos)}
                >
                  <SpeedTestWidget displayLocale={hudNumberLocale} />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.aiChat ? (
                <DraggableHudPanel
                  key="aiChat"
                  panelId="aiChat"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.aiChat}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("aiChat", pos)}
                >
                  <AiChatPanel
                    baseUrl={s.openaiBaseUrl}
                    model={s.openaiModel}
                    openaiApiKey={s.openaiApiKey}
                    geminiApiKey={s.geminiApiKey}
                    onSelectProvider={(preset) => {
                      const next = BYO_AI_PROVIDER_PRESETS[preset];
                      void persist((cur) => ({
                        ...cur,
                        openaiBaseUrl: next.baseUrl,
                        openaiModel: next.model,
                      }));
                    }}
                    onOpenByoAiSettings={openByoAiSettingsSection}
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.topSites ? (
                <DraggableHudPanel
                  key="topSites"
                  panelId="topSites"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.topSites}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("topSites", pos)}
                >
                  <TopSitesWidget
                    permissionsEpoch={permissionsEpoch}
                    onOpenTopSitesSettings={openTopSitesSettingsSection}
                  />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.bookmarksStrip ? (
                <DraggableHudPanel
                  key="bookmarksStrip"
                  panelId="bookmarksStrip"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.bookmarksStrip}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("bookmarksStrip", pos)}
                >
                  <BookmarksWidget
                    permissionsEpoch={permissionsEpoch}
                    onOpenBookmarksSettings={openBookmarksSettingsSection}
                  />
                </DraggableHudPanel>
              ) : null}
              {s.importedPlugins.some((p) => p.enabled) ? (
                <DraggableHudPanel
                  key="pluginDeck"
                  panelId="pluginDeck"
                  canvasRef={hudCanvasRef}
                  position={effectiveHudPanelPositions.pluginDeck}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  onCommit={(pos) => commitHudPanel("pluginDeck", pos)}
                >
                  <PluginDeck plugins={s.importedPlugins} debug={s.debugPluginSource} />
                </DraggableHudPanel>
              ) : null}
              {s.widgets.notes ? (
                <>
                  <StickyNoteLayer
                    canvasRef={hudCanvasRef}
                    notes={s.notes}
                    notePanels={effectiveNotePanels}
                    onCommitPosition={(noteId, position) =>
                      commitStickyNotePosition(noteId, position)
                    }
                    onMarkInactive={(noteId) => setNoteActive(noteId, false)}
                    onTogglePin={(noteId) =>
                      void persist((cur) => {
                        const displayKey = displayLayoutKeyRef.current;
                        const effectivePanels = resolveNotePanelsForDisplay(
                          cur.notePanels,
                          cur.notePanelsByDisplay,
                          displayKey,
                        );
                        return {
                          ...cur,
                          notePanelsByDisplay: patchNotePanelsForDisplay(
                            cur.notePanelsByDisplay,
                            displayKey,
                            effectivePanels.map((p) =>
                              p.noteId === noteId ? { ...p, pinned: !p.pinned } : p,
                            ),
                          ),
                        };
                      })
                    }
                    onToggleNotesList={toggleNotesListPanel}
                    notesListPanelVisible={notesListPanelEffectiveVisible}
                    onUpdateNote={(noteId, patch) =>
                      void persist((cur) => {
                        const now = Date.now();
                        let changed = false;
                        const nextNotes = cur.notes.map((n) => {
                          if (n.id !== noteId) return n;
                          const merged = applyNotePersistPatch(n, patch, now);
                          if (!merged) return n;
                          changed = true;
                          return merged;
                        });
                        if (!changed) return cur;
                        return { ...cur, notes: nextNotes };
                      })
                    }
                    onDeleteNote={(noteId) =>
                      void persist((cur) => {
                        const target = cur.notes.find((n) => n.id === noteId);
                        if (!target || !isNoteDeleteAllowed(target)) return cur;
                        if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
                          relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                        }
                        return {
                          ...cur,
                          notes: cur.notes.filter((n) => n.id !== noteId),
                          notePanels: cur.notePanels.filter((p) => p.noteId !== noteId),
                          notePanelsByDisplay: removeNoteFromAllDisplays(
                            cur.notePanelsByDisplay,
                            noteId,
                          ),
                        };
                      })
                    }
                  />
                  {notesListPanelEffectiveVisible ? (
                    <DraggableHudPanel
                      key="notes-master"
                      panelId="notes"
                      canvasRef={hudCanvasRef}
                      position={effectiveHudPanelPositions.notes}
                      chaotic={s.hudLayoutChaotic}
                      locked={s.hudLayoutLocked}
                      zIndexBase={10}
                      onCommit={(pos) => commitHudPanel("notes", pos)}
                    >
                      <NotesMasterList
                        notes={s.notes}
                        notePanels={effectiveNotePanels}
                        onSetNoteActive={setNoteActive}
                        onCreateNote={({ id, tags }) =>
                          void persist((cur) => {
                            const now = Date.now();
                            return {
                              ...cur,
                              notes: [
                                {
                                  id,
                                  name: "",
                                  tags,
                                  text: "",
                                  locked: false,
                                  createdAt: now,
                                  updatedAt: now,
                                },
                                ...cur.notes,
                              ],
                            };
                          })
                        }
                        onUpdateNote={(noteId, patch) =>
                          void persist((cur) => {
                            const now = Date.now();
                            let changed = false;
                            const nextNotes = cur.notes.map((n) => {
                              if (n.id !== noteId) return n;
                              const merged = applyNotePersistPatch(n, patch, now);
                              if (!merged) return n;
                              changed = true;
                              return merged;
                            });
                            if (!changed) return cur;
                            return { ...cur, notes: nextNotes };
                          })
                        }
                        onDeleteNote={(noteId) =>
                          void persist((cur) => {
                            const target = cur.notes.find((n) => n.id === noteId);
                            if (!target || !isNoteDeleteAllowed(target)) return cur;
                            if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
                              relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                            }
                            return {
                              ...cur,
                              notes: cur.notes.filter((n) => n.id !== noteId),
                              notePanels: cur.notePanels.filter((p) => p.noteId !== noteId),
                              notePanelsByDisplay: removeNoteFromAllDisplays(
                                cur.notePanelsByDisplay,
                                noteId,
                              ),
                            };
                          })
                        }
                        onHideListPanel={() =>
                          void persist((cur) => ({ ...cur, notesListPanelVisible: false }))
                        }
                        canHideListPanel={hasVisibleStickyNotes}
                      />
                    </DraggableHudPanel>
                  ) : null}
                </>
              ) : null}
            </HudPlacementProvider>
          </div>
        </main>

        {s.backgroundKind === "bing" && bingPaintUrl && bingWallpaperCaption ? (
          <p
            className="bing-wallpaper-caption pointer-events-none fixed bottom-14 right-4 z-[42] max-w-[min(28rem,calc(100vw-2rem))] text-right text-sm leading-snug"
            aria-live="polite"
          >
            {bingWallpaperCaption}
          </p>
        ) : null}

        <footer className="footer muted sm">
          <div className="row wrap gap-3">
            {supportActions.map((action) => (
              <button
                key={`${action.url}-${action.label}`}
                type="button"
                className="linkish"
                onClick={() => openExternal(action.url)}
                aria-label={`Open ${action.label} in a new tab`}
              >
                {action.label}
              </button>
            ))}
            <span aria-label={`Tabocalypse version ${extensionVersion}`}>v{extensionVersion}</span>
          </div>
        </footer>
      </div>
    </HudToastProvider>
  );
}

export default App as React.FC<{ initialSettings: ISettings }>;

/** How often to re-query the current window tab count so the panel stays accurate. */
const TAB_GUILT_POLL_MS = 2000;

function TabGuilt({
  permissionsEpoch,
  onOpenTabsSettings,
}: {
  permissionsEpoch: number;
  onOpenTabsSettings: () => void;
}) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const tabsApi = browser.tabs;
    if (!tabsApi?.query) {
      setN(null);
      return;
    }
    let cancelled = false;
    const refresh = (): void => {
      void tabsApi
        .query({ currentWindow: true })
        .then((t) => {
          if (!cancelled) setN(t.length);
        })
        .catch(() => {
          if (!cancelled) setN(null);
        });
    };
    refresh();
    const id = window.setInterval(refresh, TAB_GUILT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [permissionsEpoch]);
  if (n === null)
    return (
      <section className="card">
        <HudPanelTitle>Tab guilt</HudPanelTitle>
        <HudPanelBody>
          <p className="muted">
            Tab guilt needs browser permission. Open{" "}
            <HudTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenTabsSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Tab guilt"
              >
                Settings &gt; Optional permissions
              </button>
            </HudTip>{" "}
            and enable Tab guilt (tabs).
          </p>
        </HudPanelBody>
      </section>
    );
  const msg =
    n < 8
      ? "Reasonable tab footprint. Suspiciously responsible."
      : "Tab count entering folklore territory.";
  return (
    <section className="card">
      <HudPanelTitle>Tab guilt</HudPanelTitle>
      <HudPanelBody>
        <p className="tab-count">{n} tabs in this window.</p>
        <p className="muted">{msg}</p>
      </HudPanelBody>
    </section>
  );
}
