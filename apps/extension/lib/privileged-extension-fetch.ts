import browser from "webextension-polyfill";

/** Narrow `globalThis.chrome` without referencing an unbound `chrome` identifier (ESLint). */
interface IChromeRuntimeShim {
  id?: string;
  lastError?: { message?: string };
  sendMessage?: (message: unknown, responseCallback?: (response: unknown) => void) => unknown;
}

interface IGlobalWithOptionalChrome {
  chrome?: { runtime?: IChromeRuntimeShim };
  /** `webextension-polyfill` also attaches here; the imported `browser` can lag `globalThis` in some hosts. */
  browser?: { runtime?: IChromeRuntimeShim };
}

function getChromeRuntime(): IChromeRuntimeShim | undefined {
  return (globalThis as IGlobalWithOptionalChrome).chrome?.runtime;
}

function getGlobalBrowserExtensionRuntime(): IChromeRuntimeShim | undefined {
  return (globalThis as IGlobalWithOptionalChrome).browser?.runtime;
}

/** New-tab and other extension HTML documents use these schemes (not `http:`). */
function isPrivilegedFetchExtensionSurface(): boolean {
  try {
    if (typeof globalThis.location?.protocol !== "string") return false;
    const p = globalThis.location.protocol;
    return p === "chrome-extension:" || p === "moz-extension:" || p === "safari-web-extension:";
  } catch {
    return false;
  }
}

/**
 * Extension ID may appear on `chrome.runtime` even when `webextension-polyfill`’s
 * `browser.runtime.id` is missing in some Chromium/Edge builds — falling back to
 * in-page `fetch()` then hits CORS on `chrome-extension://` origins.
 */
function getExtensionRuntimeId(): string | undefined {
  try {
    const fromBrowser =
      typeof browser !== "undefined" && typeof browser.runtime?.id === "string"
        ? browser.runtime.id
        : undefined;
    if (fromBrowser) return fromBrowser;
    const fromChrome = getChromeRuntime()?.id;
    return typeof fromChrome === "string" && fromChrome.length > 0 ? fromChrome : undefined;
  } catch {
    return undefined;
  }
}

function hasExtensionSendMessage(): boolean {
  try {
    // Prefer Chromium `chrome.runtime` first: Edge/Chrome new-tab pages occasionally
    // expose a `browser.runtime` object without a working `sendMessage` during boot,
    // which would otherwise force in-page `fetch()` and hit CORS on extension origins.
    if (typeof getChromeRuntime()?.sendMessage === "function") return true;
    if (typeof browser !== "undefined" && typeof browser.runtime?.sendMessage === "function") {
      return true;
    }
    return typeof getGlobalBrowserExtensionRuntime()?.sendMessage === "function";
  } catch {
    return false;
  }
}

export const PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE =
  "runtime.sendMessage is unavailable." as const;

export const PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND =
  "URL is not allowlisted for privileged extension fetch." as const;
export const PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND =
  "URL not allowlisted for privileged fetch." as const;

/** Shown when the background worker is older than the new-tab bundle (common after local dev updates). */
export const PRIV_FETCH_RELOAD_EXTENSION_HINT =
  "Reload Tabocalypse on chrome://extensions (or edge://extensions), then open a new tab and try again." as const;

/** Foreground throw when messaging succeeded but the service worker returned no payload. */
export const PRIV_FETCH_BACKGROUND_NO_RESPONSE = "Tabocalypse background did not respond." as const;

/** Chromium `runtime.lastError` when the service worker never answered `sendMessage`. */
export const CHROME_MESSAGE_PORT_CLOSED_ERROR =
  "The message port closed before a response was received." as const;

function normalizeRuntimeMessagingError(message: string): Error {
  if (
    message === CHROME_MESSAGE_PORT_CLOSED_ERROR ||
    message.includes("message port closed before a response")
  ) {
    return new Error(PRIV_FETCH_BACKGROUND_NO_RESPONSE);
  }
  return new Error(message);
}

/**
 * Native `chrome.runtime.sendMessage` uses a callback unless called with no callback
 * on builds that return a Promise. Polyfilled `browser.runtime.sendMessage` is Promise-based.
 */
function promisifyRuntimeSendMessage(
  run: IChromeRuntimeShim,
  message: unknown,
  preferChromeCallbackApi: boolean,
): Promise<unknown> {
  const sm = run.sendMessage;
  if (typeof sm !== "function") {
    return Promise.reject(new Error(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE));
  }

  if (!preferChromeCallbackApi) {
    return Promise.resolve(sm.call(run, message));
  }

  return new Promise<unknown>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      fn();
    };

    try {
      const maybePromise = sm.call(run, message, (response: unknown) => {
        finish(() => {
          const err = run.lastError;
          if (err?.message) reject(normalizeRuntimeMessagingError(err.message));
          else resolve(response);
        });
      });
      if (maybePromise != null && typeof (maybePromise as Promise<unknown>).then === "function") {
        void (maybePromise as Promise<unknown>).then(
          (response) => finish(() => resolve(response)),
          (e: unknown) =>
            finish(() => {
              const message = e instanceof Error ? e.message : String(e);
              reject(normalizeRuntimeMessagingError(message));
            }),
        );
      }
    } catch (e: unknown) {
      finish(() => {
        reject(e instanceof Error ? e : new Error(String(e)));
      });
    }
  });
}

/** Prefer Chromium `chrome.runtime` first — mirrors {@link privilegedExtensionFetchJson}. */
export async function extensionRuntimeSendMessage<T>(message: unknown): Promise<T> {
  const chromeRun = getChromeRuntime();
  if (typeof chromeRun?.sendMessage === "function") {
    return (await promisifyRuntimeSendMessage(chromeRun, message, true)) as T;
  }
  const polyfillRuntimes = [
    typeof browser !== "undefined" ? (browser.runtime as IChromeRuntimeShim) : undefined,
    getGlobalBrowserExtensionRuntime(),
  ];
  for (const run of polyfillRuntimes) {
    if (typeof run?.sendMessage === "function") {
      return (await promisifyRuntimeSendMessage(run, message, false)) as T;
    }
  }
  throw new Error(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE);
}

/**
 * HTTPS hostnames allowed for background privileged fetch.
 * Must stay aligned with `host_permissions` in `wxt.config.ts`.
 */
export const PRIVILEGED_EXTENSION_FETCH_ALLOWED_HOSTS = [
  "peapix.com",
  "img.peapix.com",
  "api.open-meteo.com",
  "geocoding-api.open-meteo.com",
  "freequicknews.com",
  "api.coingecko.com",
  "green2.kingcounty.gov",
  "www.unsuck-it.com",
  "duckduckgo.com",
  "suggestqueries.google.com",
  "api.bing.com",
] as const;

export function normalizePrivilegedExtensionFetchUrl(url: string): string {
  return new URL(url.trim()).href;
}

export const TABOCALYPSE_PRIV_FETCH_JSON = "tabocalypse/privilegedFetchJson" as const;
export const TABOCALYPSE_PRIV_FETCH_BYTES = "tabocalypse/privilegedFetchBytes" as const;
export const TABOCALYPSE_PRIV_FETCH_TEXT = "tabocalypse/privilegedFetchText" as const;

export type TPrivilegedFetchJsonRequest = {
  type: typeof TABOCALYPSE_PRIV_FETCH_JSON;
  url: string;
  headers?: Record<string, string>;
};

export type TPrivilegedFetchBytesRequest = {
  type: typeof TABOCALYPSE_PRIV_FETCH_BYTES;
  url: string;
};

export type TPrivilegedFetchTextRequest = {
  type: typeof TABOCALYPSE_PRIV_FETCH_TEXT;
  url: string;
  headers?: Record<string, string>;
};

export type TPrivilegedFetchJsonResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type TPrivilegedFetchBytesResponse =
  | { ok: true; base64: string; mime: string }
  | { ok: false; error: string };

export type TPrivilegedFetchTextResponse =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function isPrivilegedExtensionFetchUrlAllowed(url: string): boolean {
  try {
    const normalized = normalizePrivilegedExtensionFetchUrl(url);
    const u = new URL(normalized);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return PRIVILEGED_EXTENSION_FETCH_ALLOWED_HOSTS.some((allowed) => allowed === host);
  } catch {
    return false;
  }
}

/** Matches foreground throws and background `privilegedFetch*` error strings. */
export function isPrivilegedFetchAllowlistError(message: string): boolean {
  return (
    message === PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND ||
    message === PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND
  );
}

/** Matches stale service worker / runtime messaging failures that a reload usually fixes. */
export function isPrivilegedFetchBackgroundUnavailableError(message: string): boolean {
  return (
    message === PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE ||
    message === PRIV_FETCH_BACKGROUND_NO_RESPONSE
  );
}

/** Whether UI should show the extension reload hint below a privileged-fetch error. */
export function shouldShowPrivilegedFetchReloadHint(message: string): boolean {
  return (
    isPrivilegedFetchAllowlistError(message) || isPrivilegedFetchBackgroundUnavailableError(message)
  );
}

function assertPrivilegedFetchResponse(response: unknown): asserts response is { ok: boolean } {
  if (response == null || typeof response !== "object" || !("ok" in response)) {
    throw new Error(PRIV_FETCH_BACKGROUND_NO_RESPONSE);
  }
}

/** Used by the service worker to return binary bodies over `runtime.sendMessage`. */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function raceAbort<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  let detach: (() => void) | undefined;
  const aborted = new Promise<never>((_, rej) => {
    const onAbort = (): void => {
      rej(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
    detach = () => signal.removeEventListener("abort", onAbort);
  });
  try {
    return await Promise.race([promise, aborted]);
  } finally {
    detach?.();
  }
}

export function useBackgroundPrivilegedFetch(): boolean {
  try {
    if (!hasExtensionSendMessage()) return false;
    if (isPrivilegedFetchExtensionSurface()) return true;
    return Boolean(getExtensionRuntimeId());
  } catch {
    return false;
  }
}

/** In-page fetch is unsafe on extension pages (CORS); only use off-extension surfaces. */
function shouldUseForegroundPrivilegedFetch(): boolean {
  if (isPrivilegedFetchExtensionSurface()) return false;
  return !useBackgroundPrivilegedFetch();
}

function resolvePrivilegedFetchUrlInput(url: string): string {
  try {
    return normalizePrivilegedExtensionFetchUrl(url);
  } catch {
    return url;
  }
}

function assertAllowlistedPrivilegedFetchUrl(url: string): string {
  const normalizedUrl = resolvePrivilegedFetchUrlInput(url);
  if (!isPrivilegedExtensionFetchUrlAllowed(normalizedUrl)) {
    throw new Error(PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND);
  }
  return normalizedUrl;
}

async function finishPrivilegedBackgroundFetch<T extends { ok: boolean; error?: string }>(
  message: unknown,
  signal: AbortSignal | undefined,
): Promise<T & { ok: true }> {
  const raced = await raceAbort(extensionRuntimeSendMessage<T>(message), signal);
  assertPrivilegedFetchResponse(raced);
  if (!raced.ok) throw new Error(raced.error);
  return raced as T & { ok: true };
}

export async function privilegedExtensionFetchJson(
  url: string,
  signal?: AbortSignal,
  headers?: Record<string, string>,
): Promise<unknown> {
  const normalizedUrl = assertAllowlistedPrivilegedFetchUrl(url);
  if (shouldUseForegroundPrivilegedFetch()) {
    const res = await fetch(normalizedUrl, {
      signal,
      credentials: "omit",
      cache: "no-store",
      ...(headers ? { headers } : {}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<unknown>;
  }
  if (!hasExtensionSendMessage()) {
    throw new Error(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE);
  }
  const response = await finishPrivilegedBackgroundFetch<TPrivilegedFetchJsonResponse>(
    {
      type: TABOCALYPSE_PRIV_FETCH_JSON,
      url: normalizedUrl,
      ...(headers ? { headers } : {}),
    } satisfies TPrivilegedFetchJsonRequest,
    signal,
  );
  return response.data;
}

export async function privilegedExtensionFetchText(
  url: string,
  signal?: AbortSignal,
  headers?: Record<string, string>,
): Promise<string> {
  const normalizedUrl = assertAllowlistedPrivilegedFetchUrl(url);
  if (shouldUseForegroundPrivilegedFetch()) {
    const res = await fetch(normalizedUrl, {
      signal,
      credentials: "omit",
      cache: "no-store",
      ...(headers ? { headers } : {}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  if (!hasExtensionSendMessage()) {
    throw new Error(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE);
  }
  const response = await finishPrivilegedBackgroundFetch<TPrivilegedFetchTextResponse>(
    {
      type: TABOCALYPSE_PRIV_FETCH_TEXT,
      url: normalizedUrl,
      ...(headers ? { headers } : {}),
    } satisfies TPrivilegedFetchTextRequest,
    signal,
  );
  return response.text;
}

export async function privilegedExtensionFetchBytes(
  url: string,
  signal?: AbortSignal,
): Promise<{ mime: string; bytes: ArrayBuffer }> {
  const normalizedUrl = assertAllowlistedPrivilegedFetchUrl(url);
  if (shouldUseForegroundPrivilegedFetch()) {
    const res = await fetch(normalizedUrl, { signal, credentials: "omit", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mime = res.headers.get("content-type") ?? "application/octet-stream";
    const bytes = await res.arrayBuffer();
    return { mime, bytes };
  }
  if (!hasExtensionSendMessage()) {
    throw new Error(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE);
  }
  const response = await finishPrivilegedBackgroundFetch<TPrivilegedFetchBytesResponse>(
    {
      type: TABOCALYPSE_PRIV_FETCH_BYTES,
      url: normalizedUrl,
    } satisfies TPrivilegedFetchBytesRequest,
    signal,
  );
  const bytes = base64ToArrayBuffer(response.base64);
  return { mime: response.mime, bytes };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out.buffer;
}
