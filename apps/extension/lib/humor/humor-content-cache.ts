import browser from "webextension-polyfill";
import {
  privilegedExtensionFetchBytes,
  privilegedExtensionFetchJson,
} from "../privileged-extension-fetch";
import { passesBuiltinHardFilter } from "./filter";
import {
  getHumorContentCacheSnapshot,
  setHumorContentCacheSnapshot,
  type IHumorContentCache,
} from "./humor-content-memory";
import { parseUnsuckClassicsHtml, UNSUCK_CLASSICS_SOURCE_URL } from "./unsuck-classics-parse";

export type { IHumorContentCache } from "./humor-content-memory";
export { getHumorContentCacheSnapshot } from "./humor-content-memory";

const CACHE_STORAGE_KEY = "tabocalypseHumorContentV1";
/** Refresh built-in humor corpora at most once per week. */
export const HUMOR_CONTENT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const env = (import.meta as ImportMeta & { env: Record<string, string> }).env;

function builtinHumorPacksUrl(): string {
  return (env.WXT_TABOCALYPSE_BUILTIN_HUMOR_PACKS_URL ?? "").trim();
}

interface IRemoteHumorPacksJson {
  version?: number;
  packs?: unknown;
}

function filterLines(lines: readonly string[]): string[] {
  return lines.map((l) => l.trim()).filter((l) => l.length > 0 && passesBuiltinHardFilter(l));
}

function parseRemotePackLines(raw: unknown): Record<string, string[]> | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as IRemoteHumorPacksJson;
  if (body.version !== 1 || !Array.isArray(body.packs)) return null;
  const out: Record<string, string[]> = {};
  for (const item of body.packs) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id || !Array.isArray(row.lines)) continue;
    const lines = filterLines(row.lines.filter((line): line is string => typeof line === "string"));
    if (lines.length > 0) out[id] = lines;
  }
  return Object.keys(out).length > 0 ? out : null;
}

async function loadCacheFromStorage(): Promise<IHumorContentCache> {
  const r = await browser.storage.local.get(CACHE_STORAGE_KEY);
  const raw = r[CACHE_STORAGE_KEY] as IHumorContentCache | undefined;
  if (!raw || typeof raw !== "object") return {};
  return raw;
}

async function persistCache(cache: IHumorContentCache): Promise<void> {
  setHumorContentCacheSnapshot(cache);
  await browser.storage.local.set({ [CACHE_STORAGE_KEY]: cache });
}

async function fetchUnsuckClassicsLines(signal?: AbortSignal): Promise<string[]> {
  const { bytes } = await privilegedExtensionFetchBytes(UNSUCK_CLASSICS_SOURCE_URL, signal);
  const html = new TextDecoder("utf-8").decode(bytes);
  return parseUnsuckClassicsHtml(html);
}

async function fetchRemotePackLines(
  signal?: AbortSignal,
): Promise<Record<string, string[]> | null> {
  const url = builtinHumorPacksUrl();
  if (!url) return null;
  const data = await privilegedExtensionFetchJson(url, signal);
  return parseRemotePackLines(data);
}

function needsUnsuckRefresh(cache: IHumorContentCache, now: number, force: boolean): boolean {
  if (force) return true;
  const at = cache.unsuckFetchedAt;
  if (!cache.unsuckLines?.length || typeof at !== "number") return true;
  return now - at >= HUMOR_CONTENT_REFRESH_TTL_MS;
}

function needsPacksRefresh(cache: IHumorContentCache, now: number, force: boolean): boolean {
  if (!builtinHumorPacksUrl()) return false;
  if (force) return true;
  const at = cache.packsFetchedAt;
  if (!cache.packLinesById || typeof at !== "number") return true;
  return now - at >= HUMOR_CONTENT_REFRESH_TTL_MS;
}

export interface IRefreshHumorContentResult {
  updated: boolean;
  unsuckOk: boolean;
  packsOk: boolean;
  error?: string;
}

/** Loads disk cache into memory; call once on new-tab boot. */
export async function initHumorContentCache(): Promise<void> {
  setHumorContentCacheSnapshot(await loadCacheFromStorage());
}

/**
 * Refreshes humor corpora from the network when TTL elapsed or `force` is true.
 * Bundled lines remain the fallback when a fetch fails.
 */
export async function refreshHumorContentIfStale(options?: {
  force?: boolean;
  signal?: AbortSignal;
}): Promise<IRefreshHumorContentResult> {
  const force = options?.force === true;
  const now = Date.now();
  let cache = getHumorContentCacheSnapshot();
  if (!cache.unsuckFetchedAt && !cache.packsFetchedAt) {
    cache = await loadCacheFromStorage();
    setHumorContentCacheSnapshot(cache);
  }

  let updated = false;
  let unsuckOk = Boolean(cache.unsuckLines?.length);
  let packsOk = Boolean(cache.packLinesById && Object.keys(cache.packLinesById).length > 0);
  const errors: string[] = [];

  if (needsUnsuckRefresh(cache, now, force)) {
    try {
      const lines = await fetchUnsuckClassicsLines(options?.signal);
      cache = {
        ...cache,
        unsuckLines: lines,
        unsuckFetchedAt: now,
      };
      updated = true;
      unsuckOk = true;
    } catch (e: unknown) {
      unsuckOk = Boolean(cache.unsuckLines?.length);
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (needsPacksRefresh(cache, now, force)) {
    try {
      const packLinesById = await fetchRemotePackLines(options?.signal);
      if (packLinesById) {
        cache = {
          ...cache,
          packLinesById,
          packsFetchedAt: now,
        };
        updated = true;
        packsOk = true;
      }
    } catch (e: unknown) {
      packsOk = Boolean(cache.packLinesById && Object.keys(cache.packLinesById).length > 0);
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (updated) {
    await persistCache(cache);
  }

  return {
    updated,
    unsuckOk,
    packsOk,
    ...(errors.length > 0 ? { error: errors.join("; ") } : {}),
  };
}

/** For settings UI: last successful refresh timestamp (ms) across unsuck + remote packs. */
export function humorContentLastRefreshedAt(cache: IHumorContentCache): number | null {
  const times = [cache.unsuckFetchedAt, cache.packsFetchedAt].filter(
    (t): t is number => typeof t === "number" && Number.isFinite(t),
  );
  if (times.length === 0) return null;
  return Math.max(...times);
}
