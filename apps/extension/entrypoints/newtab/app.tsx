import browser from "webextension-polyfill";
import {
  Bookmark,
  Braces,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Download,
  ExternalLink,
  Flame,
  FolderUp,
  Heart,
  Image,
  ImagePlus,
  Images,
  LayoutGrid,
  Layers,
  LocateFixed,
  Lock as LucideLock,
  MessageSquare,
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
import { testOpenAiCompatible } from "../../lib/ai-test";
import { DraggableHudPanel } from "../../components/draggable-hud-panel";
import { UserBackgroundGallery } from "../../components/user-background-gallery";
import { HudPanelBody, HudPanelTitle } from "../../components/hud-panel-drag-context";
import { HudColorInput } from "../../components/hud-color-input";
import { HudTip } from "../../components/hud-tip";
import { ClockWidget } from "../../components/clock-widget";
import { BookmarksWidget, TopSitesWidget } from "../../components/links-widget";
import { NotesWidget } from "../../components/notes-widget";
import { PluginDeck } from "../../components/plugin-views";
import { SearchWidget } from "../../components/search-widget";
import { TodoWidget } from "../../components/todo-widget";
import { WeatherWidget } from "../../components/built-in/weather-widget";
import { WEATHER_TEMPERATURE_UNITS, WEATHER_UNIT_LABELS } from "../../lib/weather/weather-units";
import { settingsBackgroundGradientCss } from "../../lib/background-gradient-css";
import {
  applyPreset,
  BACKGROUND_ROTATE_MINUTES_MAX,
  BACKGROUND_ROTATE_MINUTES_MIN,
  coerceBackgroundGradientAngleDeg,
  coerceBackgroundGradientCenterPct,
  coerceBackgroundGradientShape,
  coerceBackgroundRotateMinutes,
  coerceClockHourFormat,
  coerceHumorBuiltinVoice,
  DEFAULT_BACKGROUND_ROTATE_MINUTES,
  defaultSettings,
  type IHudPanelPosition,
  type ISettings,
  isTabocalypseSettingsStorageChange,
  newNoteId,
  type IUserBackgroundImage,
  loadSettings,
  mergeWidgets,
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
import { getSupportActions, openExternal, type TSupportLinkKind } from "../../lib/support-links";
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
import {
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperUrl,
} from "../../lib/fetch-bing-wallpaper";
import { privilegedExtensionFetchBytes } from "../../lib/privileged-extension-fetch";
import { defaultAlarmWhenLocal, formatDatetimeLocalFromDate } from "../../lib/alarm-datetime";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import { clampHudScalar, DEFAULT_HUD_PANEL_POSITIONS } from "../../lib/hud-layout";
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

function applyReactStyle(target: HTMLElement, style: React.CSSProperties): void {
  const t = target.style as unknown as Record<string, string>;
  for (const k of Object.keys(style) as (keyof React.CSSProperties)[]) {
    const v = style[k];
    if (v === undefined) continue;
    if (typeof v === "number") t[String(k)] = String(v);
    else t[String(k)] = String(v);
  }
}

function SupportLinkIcon({ kind }: { kind: TSupportLinkKind }) {
  const iconProps = { size: 18, strokeWidth: 2, "aria-hidden": true as const };
  switch (kind) {
    case "feedback":
      return <MessageSquare {...iconProps} />;
    case "donate":
      return <Heart {...iconProps} />;
    case "source":
      return <Braces {...iconProps} />;
    default:
      return <ExternalLink {...iconProps} />;
  }
}

function App({ initialSettings }: { initialSettings: ISettings }): React.JSX.Element {
  const [settings, setSettings] = useState<ISettings>(initialSettings);
  const [openSettings, setOpenSettings] = useState(() => !initialSettings.hasSeenSettingsIntro);
  const [warnSpicy, setWarnSpicy] = useState(false);
  const [pendingIntensity, setPendingIntensity] = useState<THumorIntensity | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [pluginValidateLog, setPluginValidateLog] = useState<string>("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [bingChosenUrl, setBingChosenUrl] = useState<string | null>(null);
  const [bingPaintUrl, setBingPaintUrl] = useState<string | null>(null);
  const [bingFetchErr, setBingFetchErr] = useState<string | null>(null);
  const [bingImageLoadErr, setBingImageLoadErr] = useState<string | null>(null);
  const [bingRefreshing, setBingRefreshing] = useState(false);
  const [userChosenUrl, setUserChosenUrl] = useState<string | null>(null);
  /** Upload row used for framing / pan (stable while a given photo is visible). */
  const [userBackgroundDisplayId, setUserBackgroundDisplayId] = useState<string | null>(null);
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
  const [geoStatus, setGeoStatus] = useState<"detecting" | "denied" | "unavailable" | null>(null);
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
  const latestSettingsRef = useRef<ISettings>(initialSettings);
  const persistChainRef = useRef<Promise<void>>(Promise.resolve());
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
  }, [userBackgroundDisplayId, settings.backgroundKind]);

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
    void loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const onStorageChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" && areaName !== "sync") return;
      if (!isTabocalypseSettingsStorageChange(changes, areaName)) return;
      void loadSettings().then((next) => {
        latestSettingsRef.current = next;
        setSettings(next);
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

  useEffect(() => {
    const kind = settings?.backgroundKind;
    if (kind !== "bing") {
      setBingChosenUrl(null);
      setBingPaintUrl((prev) => {
        revokeObjectUrlMaybe(prev);
        return null;
      });
      setBingFetchErr(null);
      setBingImageLoadErr(null);
      setBingRefreshing(false);
      return;
    }
    const rotate = settings?.backgroundRotate ?? false;
    const bingRotateMs = Math.max(
      60_000,
      (settings?.backgroundRotateMinutesBing ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
    );
    let cancelled = false;
    const listAbort = new AbortController();
    setBingChosenUrl(null);
    setBingPaintUrl((prev) => {
      revokeObjectUrlMaybe(prev);
      return null;
    });
    setBingFetchErr(null);
    setBingImageLoadErr(null);
    setBingRefreshing(false);
    void fetchBingWallpaperImageUrls(listAbort.signal)
      .then((urls) => {
        if (cancelled) return;
        if (urls.length === 0) {
          setBingFetchErr("No images returned.");
          return;
        }
        setBingChosenUrl(
          rotate
            ? pickRotatingBingWallpaperUrl(urls, Date.now(), bingRotateMs)
            : pickDailyBingWallpaperUrl(urls),
        );
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
      void fetchBingWallpaperImageUrls()
        .then((urls) => {
          if (cancelled) return;
          if (urls.length === 0) {
            setBingFetchErr("No images returned.");
            return;
          }
          setBingFetchErr(null);
          setBingChosenUrl(pickRotatingBingWallpaperUrl(urls, Date.now(), step));
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
  }, [settings?.backgroundKind, settings?.backgroundRotate, settings?.backgroundRotateMinutesBing]);

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
      setUserBackgroundDisplayId(null);
      return;
    }
    const applyUserBackground = (): void => {
      const c = latestSettingsRef.current;
      const userMs = Math.max(
        60_000,
        (c.backgroundRotateMinutesUser ?? DEFAULT_BACKGROUND_ROTATE_MINUTES) * 60_000,
      );
      const resolved = resolveUserBackgroundImage(
        c.userBackgroundImages,
        c.userBackgroundActiveId,
        c.backgroundRotate,
        userMs,
      );
      setUserChosenUrl(resolved?.dataUrl ?? null);
      setUserBackgroundDisplayId(resolved?.id ?? null);
    };
    applyUserBackground();
    if (!settings.backgroundRotate) return;
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
      setImportErr(null);
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const persist = useCallback(
    (next: TSettingsUpdater): Promise<void> => {
      const run = async () => {
        clearMyLinesDebouncedSaveTimer();
        const current = latestSettingsRef.current;
        const resolved = typeof next === "function" ? next(current) : next;
        latestSettingsRef.current = resolved;
        setSettings(resolved);
        try {
          await saveSettings(resolved);
          setImportErr(null);
        } catch (e: unknown) {
          setImportErr(e instanceof Error ? e.message : String(e));
        }
      };

      persistChainRef.current = persistChainRef.current.then(run).catch((e: unknown) => {
        setImportErr(e instanceof Error ? e.message : String(e));
      });
      return persistChainRef.current;
    },
    [clearMyLinesDebouncedSaveTimer],
  );

  const acknowledgeSettingsIntro = useCallback(() => {
    void persist((cur) =>
      cur.hasSeenSettingsIntro ? cur : { ...cur, hasSeenSettingsIntro: true },
    );
  }, [persist]);

  const closeSettingsModal = useCallback(() => {
    setOpenSettings(false);
    const cur = latestSettingsRef.current;
    if (!cur.hasSeenSettingsIntro) {
      void persist((next) =>
        next.hasSeenSettingsIntro ? next : { ...next, hasSeenSettingsIntro: true },
      );
    }
  }, [persist]);

  useEffect(() => {
    if (!settings.weatherAutoGeo) {
      setGeoStatus(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      void persist((cur) => ({ ...cur, weatherAutoGeo: false }));
      return;
    }
    let cancelled = false;
    setGeoStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setGeoStatus(null);
        void persist((cur) => ({
          ...cur,
          weatherLat: pos.coords.latitude,
          weatherLon: pos.coords.longitude,
        }));
      },
      () => {
        if (cancelled) return;
        setGeoStatus("denied");
        void persist((cur) => ({ ...cur, weatherAutoGeo: false }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [persist, settings.weatherAutoGeo]);

  const hudCanvasRef = useRef<HTMLDivElement | null>(null);
  /** When opening a pinned note temporarily unlocks HUD, dragging that note prompts to re-lock. */
  const relockPromptNoteIdAfterAutoHudUnlockRef = useRef<string | null>(null);

  const commitHudPanel = useCallback(
    (id: THudPanelId, pos: IHudPanelPosition) => {
      void persist((cur) => ({
        ...cur,
        hudPanelPositions: { ...cur.hudPanelPositions, [id]: pos },
      }));
    },
    [persist],
  );

  const commitNotePanel = useCallback(
    (noteId: string, pos: IHudPanelPosition) => {
      const snapshot = latestSettingsRef.current;
      const prev = snapshot.notePanels.find((p) => p.noteId === noteId)?.position;
      const moved =
        prev != null &&
        (prev.xPct !== pos.xPct ||
          prev.yPct !== pos.yPct ||
          prev.widthPx !== pos.widthPx ||
          prev.heightPx !== pos.heightPx);

      void (async () => {
        await persist((cur) => ({
          ...cur,
          notePanels: cur.notePanels.map((p) =>
            p.noteId === noteId ? { ...p, position: pos } : p,
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
    } catch {
      // Ignore: API unavailable in non-extension contexts.
    }
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
          .then(() => saveLatestToDisk())
          .catch((e: unknown) => {
            setImportErr(e instanceof Error ? e.message : String(e));
          });
      }, 300);
    },
    [saveLatestToDisk],
  );

  const humorCtx: IHumorContext = useMemo(
    () => ({
      humorEnabled: settings.humorEnabled,
      humorIntensity: settings.humorIntensity,
      humorBuiltinVoice: settings.humorBuiltinVoice,
      enabledBuiltinPackIds: settings.humorBuiltinPackIds,
      importedPacks: settings.importedPacks,
      myLines: settings.myLines,
      locale: navigator.language,
    }),
    [settings],
  );

  const backgroundPositionStr = useMemo(() => {
    if (
      bgPanLive &&
      bgPanLive.kind === "user" &&
      settings.backgroundKind === "image" &&
      userBackgroundDisplayId &&
      bgPanLive.id === userBackgroundDisplayId
    ) {
      return `${bgPanLive.positionXPct}% ${bgPanLive.positionYPct}%`;
    }
    if (settings.backgroundKind === "bing" && bingChosenUrl) {
      const f = settings.bingWallpaperFramings[bingChosenUrl];
      if (f) return `${f.positionXPct}% ${f.positionYPct}%`;
    }
    if (settings.backgroundKind === "image" && userBackgroundDisplayId) {
      const im = settings.userBackgroundImages.find((row) => row.id === userBackgroundDisplayId);
      if (im) return `${im.positionXPct}% ${im.positionYPct}%`;
    }
    return "50% 50%";
  }, [
    bgPanLive,
    settings.backgroundKind,
    settings.bingWallpaperFramings,
    settings.userBackgroundImages,
    bingChosenUrl,
    userBackgroundDisplayId,
  ]);

  const shellStyle = useMemo(
    () =>
      backgroundStyle(settings, {
        // Only paint Bing from a same-origin blob URL. Raw Peapix HTTPS URLs in CSS
        // can trigger cross-origin loads from the extension page (CORS / fetch noise).
        bingImageUrl: bingPaintUrl,
        userImageUrl: userChosenUrl,
        backgroundPosition: backgroundPositionStr,
      }),
    [settings, bingPaintUrl, userChosenUrl, backgroundPositionStr],
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
  }, [humorCtx]);

  const s = settings;

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
    if (s.backgroundKind !== "image" || !userChosenUrl || !userBgRepositionMode) return false;
    const id = userBackgroundDisplayId;
    if (!id) return false;
    return s.userBackgroundImages.some((row) => row.id === id);
  }, [
    s.hudLayoutLocked,
    s.backgroundKind,
    s.userBackgroundImages,
    userChosenUrl,
    userBgRepositionMode,
    userBackgroundDisplayId,
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
    setImportErr(null);
    const dataUrls: string[] = [];
    for (const f of picked) {
      try {
        const url = await compressImageFileToDataUrl(f, {
          maxBytes: BG_MAX,
          maxEdgePx: BG_MAX_EDGE_PX,
        });
        dataUrls.push(url);
      } catch (e: unknown) {
        setImportErr(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    const existingBytes = latestSettingsRef.current.userBackgroundImages.reduce(
      (n, im) => n + estimateDataUrlBytes(im.dataUrl),
      0,
    );
    const newBytes = dataUrls.reduce((n, u) => n + estimateDataUrlBytes(u), 0);
    if (existingBytes + newBytes > BG_TOTAL_MAX) {
      setImportErr(
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
      if (s.backgroundKind === "image" && userChosenUrl) {
        if (!userBgRepositionMode) return;
        const id = userBackgroundDisplayId;
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
    [s, userChosenUrl, userBackgroundDisplayId, userBgRepositionMode, userBgRepositionDraft],
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
    if (s.backgroundKind === "image" && userBackgroundDisplayId) {
      if (userBgRepositionMode) {
        setUserBgRepositionDraft({ positionXPct: 50, positionYPct: 50 });
        return;
      }
      const id = userBackgroundDisplayId;
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
    userBackgroundDisplayId,
    userBgRepositionMode,
    bingChosenUrl,
    persist,
  ]);

  const commitUserBackgroundReposition = useCallback(() => {
    const id = userBackgroundDisplayId;
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
  }, [userBackgroundDisplayId, s.backgroundKind, userBgRepositionDraft, persist]);

  const cancelUserBackgroundReposition = useCallback(() => {
    setUserBgRepositionMode(false);
    setUserBgRepositionDraft(null);
  }, []);

  const onUserBackgroundContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (s.hudLayoutLocked) return;
      if (s.backgroundKind !== "image" || !userChosenUrl) return;
      e.preventDefault();
      const pad = 8;
      const approxW = 220;
      const approxH = 120;
      const x = Math.min(e.clientX, window.innerWidth - approxW - pad);
      const y = Math.min(e.clientY, window.innerHeight - approxH - pad);
      setUserBgContextMenu({ clientX: Math.max(pad, x), clientY: Math.max(pad, y) });
    },
    [s.hudLayoutLocked, s.backgroundKind, userChosenUrl],
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
    if (!s.openaiApiKey) {
      setAiResult("Add an API key first.");
      return;
    }
    if (s.openaiBaseUrl.includes("api.openai.com")) {
      const granted = await browser.permissions.contains({
        origins: ["https://api.openai.com/*"],
      });
      if (!granted) {
        const ok = await browser.permissions.request({
          origins: ["https://api.openai.com/*"],
        });
        if (!ok) {
          setAiResult("Host permission denied for api.openai.com");
          return;
        }
      }
    }
    const r = await testOpenAiCompatible({
      apiKey: s.openaiApiKey,
      baseUrl: s.openaiBaseUrl,
    });
    setAiResult(r.ok ? r.reply : r.error);
  };

  const importPackFile = async (file: File) => {
    setImportErr(null);
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
      setImportErr(e instanceof Error ? e.message : String(e));
    }
  };

  const importPluginFile = async (file: File) => {
    setImportErr(null);
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
    <div className="shell">
      <div className="glitch-overlay" aria-hidden />
      {openSettings ? (
        <div className="modal-backdrop" role="presentation" onClick={closeSettingsModal}>
          <div
            className="modal settings-modal"
            role="dialog"
            aria-label="Settings"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <h2>Settings</h2>
              <button type="button" className="btn ghost has-icon" onClick={closeSettingsModal}>
                <X size={18} strokeWidth={2} aria-hidden />
                <span>Close</span>
              </button>
            </header>
            <div className="modal-body">
              {!s.hasSeenSettingsIntro ? (
                <section
                  className="settings-welcome"
                  role="region"
                  aria-label="Welcome to Tabocalypse"
                >
                  <h3 className="settings-welcome-title">Welcome to Tabocalypse</h3>
                  <p className="settings-welcome-lead">
                    This new tab is a small HUD you control: turn widgets on or off, pick a theme
                    and background, tune the humor strip, import plugins, and more—all from this
                    panel.
                  </p>
                  <p className="settings-welcome-note">
                    Open settings anytime from the gear button in the header. Your choices stay on
                    this device unless you use browser sync.
                  </p>
                  <button type="button" className="btn primary" onClick={acknowledgeSettingsIntro}>
                    Got it
                  </button>
                </section>
              ) : null}
              <div className="settings-accordion">
                <details className="acc-item" open>
                  <summary className="acc-summary">
                    <span className="acc-title">Presets</span>
                  </summary>
                  <div className="acc-body">
                    <p className="muted sm mb-2">
                      Applies right away. Adjusts jokes, the humor strip, and some widget toggles.
                      Theme, background, and the rest of Appearance are unchanged.
                    </p>
                    <div className="row wrap">
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("focus", cur))}
                      >
                        <Target size={18} strokeWidth={2} aria-hidden />
                        <span>Focus</span>
                      </button>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("balanced", cur))}
                      >
                        <Scale size={18} strokeWidth={2} aria-hidden />
                        <span>Balanced</span>
                      </button>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("chaos", cur))}
                      >
                        <Flame size={18} strokeWidth={2} aria-hidden />
                        <span>Chaos</span>
                      </button>
                    </div>
                    <div className="muted sm mt-3 flex flex-col gap-1.5">
                      <p className="m-0">
                        <span className="text-text">Focus</span>
                        {" — "}
                        Turns jokes off, hides the humor strip, and switches Search and Clock on.
                        Other widgets keep their current toggles.
                      </p>
                      <p className="m-0">
                        <span className="text-text">Balanced</span>
                        {" — "}
                        Mild jokes and the humor strip on. Widget toggles merge defaults with yours.
                      </p>
                      <p className="m-0">
                        <span className="text-text">Chaos</span>
                        {" — "}
                        Spicier jokes and the humor strip on. Other widget toggles stay as they are.
                      </p>
                    </div>
                  </div>
                </details>

                <details className="acc-item">
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
                          className={s.themeMode === mode ? "btn primary has-icon" : "btn has-icon"}
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
                          onClick={() => void persist((cur) => ({ ...cur, themePalette: palette }))}
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

                <details className="acc-item">
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

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Panel layout</span>
                  </summary>
                  <div className="acc-body">
                    <p className="muted sm mb-2">
                      Drag panels by the grip in each header. Use the top bar for quick layout lock
                      and chaotic mode.
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
                    <button
                      type="button"
                      className="btn has-icon mt-3"
                      onClick={() =>
                        void persist((cur) => ({
                          ...cur,
                          hudPanelPositions: { ...DEFAULT_HUD_PANEL_POSITIONS },
                        }))
                      }
                    >
                      <LayoutGrid size={18} strokeWidth={2} aria-hidden />
                      <span>Reset panel positions</span>
                    </button>
                  </div>
                </details>

                <details className="acc-item">
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
                        below. Your lines and imported packs still mix in.
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
                      Your own lines (one per line) are mixed with the packs you enable — same pool
                      as the banner and the clock roast. Saved locally as you type.
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

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Search engine</span>
                  </summary>
                  <div className="acc-body">
                    <select
                      value={s.searchEngine}
                      onChange={(e) => {
                        const engine = e.target.value as ISettings["searchEngine"];
                        void persist((cur) => ({ ...cur, searchEngine: engine }));
                      }}
                    >
                      <option value="ddg">DuckDuckGo</option>
                      <option value="google">Google</option>
                      <option value="bing">Bing</option>
                    </select>
                  </div>
                </details>

                <details className="acc-item">
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
                        onClick={() => void persist((cur) => ({ ...cur, backgroundKind: "solid" }))}
                      >
                        <Square size={18} strokeWidth={2} aria-hidden />
                        <span>Solid</span>
                      </button>
                      <button
                        type="button"
                        className={
                          s.backgroundKind === "gradient" ? "btn primary has-icon" : "btn has-icon"
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
                              s.backgroundKind === "image" ? "btn primary has-icon" : "btn has-icon"
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
                                  userBackgroundActiveId: primary?.id ?? cur.userBackgroundActiveId,
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
                        onClick={() => void persist((cur) => ({ ...cur, backgroundKind: "bing" }))}
                      >
                        <Images size={18} strokeWidth={2} aria-hidden />
                        <span>Bing spotlight</span>
                      </button>
                    </div>

                    <label className="check-row mt-3">
                      <input
                        type="checkbox"
                        checked={s.backgroundRotate}
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
                        <input
                          type="number"
                          min={BACKGROUND_ROTATE_MINUTES_MIN}
                          max={BACKGROUND_ROTATE_MINUTES_MAX}
                          className="mt-1 w-full max-w-[8rem]"
                          value={s.backgroundRotateMinutesBing}
                          onChange={(e) => {
                            const n = coerceBackgroundRotateMinutes(
                              Number(e.target.value),
                              s.backgroundRotateMinutesBing,
                            );
                            void persist((cur) => ({ ...cur, backgroundRotateMinutesBing: n }));
                          }}
                          aria-label="Minutes between Bing spotlight images when rotation is on"
                        />
                      </label>
                      <label className="block">
                        <span className="muted sm">Uploads: minutes between photos</span>
                        <input
                          type="number"
                          min={BACKGROUND_ROTATE_MINUTES_MIN}
                          max={BACKGROUND_ROTATE_MINUTES_MAX}
                          className="mt-1 w-full max-w-[8rem]"
                          value={s.backgroundRotateMinutesUser}
                          onChange={(e) => {
                            const n = coerceBackgroundRotateMinutes(
                              Number(e.target.value),
                              s.backgroundRotateMinutesUser,
                            );
                            void persist((cur) => ({ ...cur, backgroundRotateMinutesUser: n }));
                          }}
                          aria-label="Minutes between uploaded photos when rotation is on"
                        />
                      </label>
                    </div>
                    <p className="muted sm">
                      Timers run while this tab stays open. Minimum {BACKGROUND_ROTATE_MINUTES_MIN}{" "}
                      minute; default {DEFAULT_BACKGROUND_ROTATE_MINUTES} minutes; maximum{" "}
                      {Math.floor(BACKGROUND_ROTATE_MINUTES_MAX / 60)} hours.
                    </p>
                    <p className="muted sm">
                      Local uploads are resized and compressed in your browser before saving (about{" "}
                      {BG_MAX_LABEL} stored per image, about {BG_TOTAL_LABEL} total per
                      multi-select). Large originals are shrunk to fit extension storage.
                    </p>
                    <p className="muted sm">
                      Unlock panel layout, then use Reposition background on an uploaded photo
                      (right click the wallpaper) to drag and preview framing; double-click empty
                      space on the new tab to re-center the current Bing or uploaded wallpaper. Each
                      Bing image and each saved photo remembers its own focal point.
                    </p>

                    {s.backgroundKind === "image" ? (
                      <UserBackgroundGallery
                        images={s.userBackgroundImages}
                        activeId={s.userBackgroundActiveId}
                        backgroundRotate={s.backgroundRotate}
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
                                    <label className="sr-only" htmlFor="tabocalypse-bg-grad-cx-num">
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
                                    <label className="sr-only" htmlFor="tabocalypse-bg-grad-cy-num">
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

                <section className="settings-block">
                  <h3>Weather location</h3>
                  {s.weatherAutoGeo ? (
                    <p className="muted sm mb-2">
                      Auto-detect is on — coordinates refresh each new tab. Disable it in Optional
                      permissions below to enter manually.
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
                          void persist((cur) => ({ ...cur, weatherLat: v }));
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
                          void persist((cur) => ({ ...cur, weatherLon: v }));
                        }}
                      />
                    </label>
                  </div>
                  <p className="muted sm mb-2 mt-4">Temperature units</p>
                  <div className="row wrap" role="group" aria-label="Temperature units">
                    {WEATHER_TEMPERATURE_UNITS.map((u) => (
                      <HudTip
                        key={u}
                        tip={
                          u === "celsius"
                            ? "Switch forecast and readings to Celsius"
                            : "Switch forecast and readings to Fahrenheit"
                        }
                      >
                        <button
                          type="button"
                          className={s.weatherTemperatureUnit === u ? "btn primary" : "btn"}
                          onClick={() =>
                            void persist((cur) => ({ ...cur, weatherTemperatureUnit: u }))
                          }
                        >
                          {WEATHER_UNIT_LABELS[u]}
                        </button>
                      </HudTip>
                    ))}
                  </div>
                </section>

                <section className="settings-block">
                  <h3>Optional permissions</h3>
                  <div className="row wrap">
                    <button
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
                      type="button"
                      className="btn has-icon"
                      aria-label={
                        optionalApiPerms.tabs
                          ? "Disable Tab guilt (tabs) permission"
                          : "Enable Tab guilt (tabs) permission"
                      }
                      onClick={async () => {
                        if (optionalApiPerms.tabs) {
                          const ok = await browser.permissions.remove({ permissions: ["tabs"] });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, tabGuilt: false },
                            }));
                          }
                        } else {
                          const ok = await browser.permissions.request({ permissions: ["tabs"] });
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
                    <button
                      type="button"
                      className="btn has-icon"
                      disabled={geoStatus === "detecting"}
                      aria-label={
                        s.weatherAutoGeo
                          ? "Disable auto-detect location"
                          : "Enable auto-detect location"
                      }
                      onClick={() => {
                        if (s.weatherAutoGeo) {
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
                          ? "Detecting…"
                          : s.weatherAutoGeo
                            ? "Disable Location (geo)"
                            : "Enable Location (geo)"}
                      </span>
                    </button>
                  </div>
                  {geoStatus === "denied" ? (
                    <p className="muted sm mt-1" style={{ color: "var(--color-danger)" }}>
                      Location permission denied. Allow location access in your browser and try
                      again, or enter coordinates manually in Weather location.
                    </p>
                  ) : null}
                  {geoStatus === "unavailable" ? (
                    <p className="muted sm mt-1" style={{ color: "var(--color-danger)" }}>
                      Geolocation is not available in this browser.
                    </p>
                  ) : null}
                </section>

                <section className="settings-block">
                  <h3>Alarm (notification)</h3>
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
                                {reminderLine ? <span className="ml-2">{reminderLine}</span> : null}
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
                </section>

                <section className="settings-block">
                  <h3>BYO AI (OpenAI-compatible)</h3>
                  <p className="muted sm">
                    You pay your provider. Nothing is sent without your key.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void runByoAiTest();
                    }}
                  >
                    <input
                      placeholder="API key"
                      type="password"
                      autoComplete="off"
                      value={s.openaiApiKey}
                      onChange={(e) => {
                        const v = e.target.value;
                        void persist((cur) => ({ ...cur, openaiApiKey: v }));
                      }}
                      className="w-full"
                    />
                    <input
                      placeholder="Base URL"
                      value={s.openaiBaseUrl}
                      onChange={(e) => {
                        const v = e.target.value;
                        void persist((cur) => ({ ...cur, openaiBaseUrl: v }));
                      }}
                      className="mt-2 w-full"
                    />
                    <button type="submit" className="btn has-icon mt-2">
                      <Sparkles size={18} strokeWidth={2} aria-hidden />
                      <span>Test chat completion</span>
                    </button>
                  </form>
                  {aiResult ? <pre className="ai-out">{aiResult}</pre> : null}
                </section>

                <section className="settings-block">
                  <h3>Import pack (.zip with pack.json or .json)</h3>
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
                </section>

                <section className="settings-block">
                  <h3>Import declarative plugin (tabocalypse-plugin.json)</h3>
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
                  <textarea readOnly rows={3} className="mt-2 w-full" value={pluginValidateLog} />
                </section>

                <section className="settings-block">
                  <h3>Manage imports</h3>
                  <p className="muted sm">Packs</p>
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
                  <p className="muted sm">Plugins</p>
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
                </section>

                <section className="settings-block">
                  <h3>Debug</h3>
                  <label className="check-row">
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
                </section>

                <section className="settings-block">
                  <h3>Data</h3>
                  <button type="button" className="btn has-icon" onClick={exportSettingsJson}>
                    <Download size={18} strokeWidth={2} aria-hidden />
                    <span>Export settings JSON</span>
                  </button>
                  <label className="btn has-icon ml-2">
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
                            const parsed = JSON.parse(String(reader.result)) as Partial<ISettings>;
                            const d = defaultSettings();
                            const importThemeMode = coerceThemeMode(parsed.themeMode, d.themeMode);
                            const importGradFallback = themeGradientStops(importThemeMode);
                            const merged: ISettings = {
                              ...d,
                              ...parsed,
                              version: 1,
                              widgets: mergeWidgets(
                                parsed.widgets as Partial<Record<string, unknown>> | undefined,
                              ),
                              themeMode: importThemeMode,
                              themePalette: coerceThemePalette(parsed.themePalette, d.themePalette),
                              themeCustomAccent: coerceThemeHex(
                                parsed.themeCustomAccent,
                                d.themeCustomAccent,
                              ),
                              themeCustomAccent2: coerceThemeHex(
                                parsed.themeCustomAccent2,
                                d.themeCustomAccent2,
                              ),
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
                              humorBuiltinVoice: coerceHumorBuiltinVoice(
                                parsed as {
                                  humorBuiltinVoice?: unknown;
                                  humorGenZMode?: unknown;
                                },
                              ),
                              hasSeenSettingsIntro:
                                typeof parsed.hasSeenSettingsIntro === "boolean"
                                  ? parsed.hasSeenSettingsIntro
                                  : true,
                            };
                            void persist(merged);
                          } catch {
                            setImportErr("Invalid settings JSON");
                          }
                        };
                        reader.readAsText(f);
                      }}
                    />
                  </label>
                </section>

                <section className="settings-block support-block">
                  <h3>Feedback and support</h3>
                  <p className="muted sm">
                    Opens the site you pick in a new tab. Donations and tips go through third-party
                    pages — Tabocalypse does not process payments.
                  </p>
                  {supportActions.length > 0 ? (
                    <form
                      className="support-actions-form"
                      onSubmit={(event) => event.preventDefault()}
                      noValidate
                    >
                      <fieldset className="m-0 border-0 p-0">
                        <legend className="sr-only">Feedback and optional support links</legend>
                        {supportActions.map((action) => (
                          <div key={action.url + action.label} className="support-action-row">
                            <span className="support-action-label">{action.label}</span>
                            <HudTip tip="Open this link in a new browser tab">
                              <button
                                type="button"
                                className="btn primary has-icon sm"
                                onClick={() => openExternal(action.url)}
                                aria-label={`Open ${action.label} in a new tab`}
                              >
                                <SupportLinkIcon kind={action.kind} />
                                <span>Open</span>
                              </button>
                            </HudTip>
                          </div>
                        ))}
                      </fieldset>
                    </form>
                  ) : (
                    <p className="muted sm">No links are configured yet.</p>
                  )}
                  <p className="muted sm">
                    Set <code>WXT_TABOCALYPSE_SUPPORT_LINKS</code> to a JSON array of{" "}
                    <code>label</code>, <code>url</code>, and optional <code>kind</code> (
                    <code>feedback</code>, <code>donate</code>, <code>source</code>,{" "}
                    <code>link</code>), or set <code>WXT_TABOCALYPSE_FEATURE_URL</code>,{" "}
                    <code>WXT_TABOCALYPSE_DONATE_URL</code>, and{" "}
                    <code>WXT_TABOCALYPSE_GITHUB_URL</code> in <code>.env</code>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warnSpicy ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal small flex flex-col gap-4 p-6"
            role="dialog"
            aria-label="Content notice"
          >
            <h2>Turn it up?</h2>
            <p>
              Spicy and unhinged modes may include swearing or abrasive humor in curated packs. You
              are responsible for imported content.
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
              <button type="button" className="btn primary has-icon" onClick={() => confirmSpicy()}>
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
        {s.widgets.search ? <SearchWidget engine={s.searchEngine} variant="header" /> : null}
        <div className="flex shrink-0 items-center gap-2">
          <HudTip
            tip={
              s.hudLayoutChaotic
                ? "Turn on grid snap so panels align to the layout grid"
                : "Turn on free-form layout so panels ignore the snap grid"
            }
          >
            <button
              type="button"
              className={s.hudLayoutChaotic ? "btn primary icon-only" : "btn ghost icon-only"}
              aria-pressed={s.hudLayoutChaotic}
              aria-label={
                s.hudLayoutChaotic
                  ? "Chaotic layout on; press to snap panels to a grid"
                  : "Snap to grid on; press for free-form layout"
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
            tip={
              s.hudLayoutLocked
                ? "Unlock so you can drag HUD panels to new positions"
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
          <HudTip tip="Open Tabocalypse settings">
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

      {importErr ? <div className="toast err">{importErr}</div> : null}

      {userBgContextMenu ? (
        <div
          ref={userBgContextMenuRef}
          role="menu"
          aria-label="Background photo"
          className="fixed z-[100] flex min-w-[13rem] flex-col border-2 border-accent bg-modal py-1 shadow-[4px_4px_0_0_var(--color-shadow-hard)]"
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

      {userBgRepositionMode && s.backgroundKind === "image" && userChosenUrl ? (
        <div
          className="pointer-events-auto fixed bottom-6 left-1/2 z-[99] flex max-w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-stretch gap-3 border-2 border-accent bg-modal px-4 py-3 shadow-[4px_4px_0_0_var(--color-shadow-hard)] sm:flex-row sm:items-center"
          role="status"
          aria-live="polite"
        >
          <p className="m-0 text-center font-display text-xs font-bold uppercase leading-snug tracking-widest text-accent sm:text-left">
            Repositioning background — hold the mouse button and drag to preview framing; release
            returns to the saved view until you set it. Double-click centers the next preview. Press
            Escape to cancel.
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
          <div
            role="presentation"
            className={[
              "absolute inset-0 z-[1]",
              !s.hudLayoutLocked &&
              ((s.backgroundKind === "image" && userChosenUrl) ||
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
          {s.widgets.todo ? (
            <DraggableHudPanel
              key="todo"
              panelId="todo"
              canvasRef={hudCanvasRef}
              position={s.hudPanelPositions.todo}
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
              position={s.hudPanelPositions.clock}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("clock", pos)}
            >
              <ClockWidget
                hourFormat={s.clockHourFormat}
                onHourFormatChange={(clockHourFormat) =>
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
              position={s.hudPanelPositions.tabGuilt}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("tabGuilt", pos)}
            >
              <TabGuilt />
            </DraggableHudPanel>
          ) : null}
          {s.widgets.weather ? (
            <DraggableHudPanel
              key="weather"
              panelId="weather"
              canvasRef={hudCanvasRef}
              position={s.hudPanelPositions.weather}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("weather", pos)}
            >
              <WeatherWidget
                lat={s.weatherLat}
                lon={s.weatherLon}
                temperatureUnit={s.weatherTemperatureUnit}
                onTemperatureUnitChange={(weatherTemperatureUnit) =>
                  void persist((cur) => ({ ...cur, weatherTemperatureUnit }))
                }
              />
            </DraggableHudPanel>
          ) : null}
          {s.widgets.topSites ? (
            <DraggableHudPanel
              key="topSites"
              panelId="topSites"
              canvasRef={hudCanvasRef}
              position={s.hudPanelPositions.topSites}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("topSites", pos)}
            >
              <TopSitesWidget />
            </DraggableHudPanel>
          ) : null}
          {s.widgets.bookmarksStrip ? (
            <DraggableHudPanel
              key="bookmarksStrip"
              panelId="bookmarksStrip"
              canvasRef={hudCanvasRef}
              position={s.hudPanelPositions.bookmarksStrip}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("bookmarksStrip", pos)}
            >
              <BookmarksWidget />
            </DraggableHudPanel>
          ) : null}
          {s.importedPlugins.some((p) => p.enabled) ? (
            <DraggableHudPanel
              key="pluginDeck"
              panelId="pluginDeck"
              canvasRef={hudCanvasRef}
              position={s.hudPanelPositions.pluginDeck}
              chaotic={s.hudLayoutChaotic}
              locked={s.hudLayoutLocked}
              onCommit={(pos) => commitHudPanel("pluginDeck", pos)}
            >
              <PluginDeck plugins={s.importedPlugins} debug={s.debugPluginSource} />
            </DraggableHudPanel>
          ) : null}
          {s.widgets.notes ? (
            <>
              {s.notePanels.map((np) => (
                <DraggableHudPanel
                  key={`notes-open-${np.noteId}`}
                  panelId="notes"
                  canvasRef={hudCanvasRef}
                  position={np.position}
                  chaotic={s.hudLayoutChaotic}
                  locked={s.hudLayoutLocked}
                  zIndexBase={52}
                  onCommit={(pos) => commitNotePanel(np.noteId, pos)}
                >
                  <NotesWidget
                    variant="panel"
                    panelElasticHeight={typeof np.position.heightPx !== "number"}
                    notes={s.notes}
                    panelNoteId={np.noteId}
                    onUpdateNote={(noteId, patch) =>
                      void persist((cur) => ({
                        ...cur,
                        notes: cur.notes.map((n) =>
                          n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n,
                        ),
                      }))
                    }
                    onDeleteNote={(noteId) =>
                      void persist((cur) => {
                        if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
                          relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                        }
                        return {
                          ...cur,
                          notes: cur.notes.filter((n) => n.id !== noteId),
                          notePanels: cur.notePanels.filter((p) => p.noteId !== noteId),
                        };
                      })
                    }
                    onClosePanel={() =>
                      void persist((cur) => {
                        if (relockPromptNoteIdAfterAutoHudUnlockRef.current === np.noteId) {
                          relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                        }
                        return {
                          ...cur,
                          notePanels: cur.notePanels.filter((p) => p.noteId !== np.noteId),
                        };
                      })
                    }
                  />
                </DraggableHudPanel>
              ))}
              <DraggableHudPanel
                key="notes-master"
                panelId="notes"
                canvasRef={hudCanvasRef}
                position={s.hudPanelPositions.notes}
                chaotic={s.hudLayoutChaotic}
                locked={s.hudLayoutLocked}
                zIndexBase={10}
                onCommit={(pos) => commitHudPanel("notes", pos)}
              >
                <NotesWidget
                  variant="switcher"
                  notes={s.notes}
                  notePanels={s.notePanels}
                  onToggleNotePanel={(noteId) =>
                    void persist((cur) => {
                      if (cur.notePanels.some((p) => p.noteId === noteId)) {
                        if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
                          relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                        }
                        return {
                          ...cur,
                          notePanels: cur.notePanels.filter((p) => p.noteId !== noteId),
                        };
                      }
                      let hudLayoutLockedNext = cur.hudLayoutLocked;
                      if (cur.hudLayoutLocked) {
                        relockPromptNoteIdAfterAutoHudUnlockRef.current = noteId;
                        hudLayoutLockedNext = false;
                      }
                      const anchor = cur.hudPanelPositions.notes;
                      const stagger = cur.notePanels.length * 5;
                      const position: IHudPanelPosition = {
                        xPct: clampHudScalar(anchor.xPct + stagger, 0, 86),
                        yPct: clampHudScalar(anchor.yPct + 18 + stagger, 0, 78),
                      };
                      if (typeof anchor.widthPx === "number" && anchor.widthPx > 0) {
                        position.widthPx = anchor.widthPx;
                      }
                      if (typeof anchor.heightPx === "number" && anchor.heightPx > 0) {
                        position.heightPx = anchor.heightPx;
                      }
                      return {
                        ...cur,
                        hudLayoutLocked: hudLayoutLockedNext,
                        notePanels: [...cur.notePanels, { noteId, position }],
                      };
                    })
                  }
                  onCreateNote={({ name, tags }) =>
                    void persist((cur) => {
                      const id = newNoteId();
                      const now = Date.now();
                      let hudLayoutLockedNext = cur.hudLayoutLocked;
                      if (cur.hudLayoutLocked) {
                        relockPromptNoteIdAfterAutoHudUnlockRef.current = id;
                        hudLayoutLockedNext = false;
                      }
                      const anchor = cur.hudPanelPositions.notes;
                      const stagger = cur.notePanels.length * 5;
                      const position: IHudPanelPosition = {
                        xPct: clampHudScalar(anchor.xPct + stagger, 0, 86),
                        yPct: clampHudScalar(anchor.yPct + 18 + stagger, 0, 78),
                      };
                      if (typeof anchor.widthPx === "number" && anchor.widthPx > 0) {
                        position.widthPx = anchor.widthPx;
                      }
                      if (typeof anchor.heightPx === "number" && anchor.heightPx > 0) {
                        position.heightPx = anchor.heightPx;
                      }
                      return {
                        ...cur,
                        hudLayoutLocked: hudLayoutLockedNext,
                        notes: [
                          {
                            id,
                            name,
                            tags,
                            text: "",
                            createdAt: now,
                            updatedAt: now,
                          },
                          ...cur.notes,
                        ],
                        notePanels: [...cur.notePanels, { noteId: id, position }],
                      };
                    })
                  }
                  onUpdateNote={(noteId, patch) =>
                    void persist((cur) => ({
                      ...cur,
                      notes: cur.notes.map((n) =>
                        n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n,
                      ),
                    }))
                  }
                  onDeleteNote={(noteId) =>
                    void persist((cur) => {
                      if (relockPromptNoteIdAfterAutoHudUnlockRef.current === noteId) {
                        relockPromptNoteIdAfterAutoHudUnlockRef.current = null;
                      }
                      return {
                        ...cur,
                        notes: cur.notes.filter((n) => n.id !== noteId),
                        notePanels: cur.notePanels.filter((p) => p.noteId !== noteId),
                      };
                    })
                  }
                />
              </DraggableHudPanel>
            </>
          ) : null}
        </div>
      </main>

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
  );
}

export default App as React.FC<{ initialSettings: ISettings }>;

/** How often to re-query the current window tab count so the panel stays accurate. */
const TAB_GUILT_POLL_MS = 2000;

function TabGuilt() {
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
  }, []);
  if (n === null)
    return (
      <section className="card">
        <HudPanelTitle>Tab guilt</HudPanelTitle>
        <HudPanelBody>
          <p className="muted">Grant tabs permission in settings.</p>
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
