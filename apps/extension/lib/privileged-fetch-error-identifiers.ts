export const PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE =
  "runtime.sendMessage is unavailable." as const;

export const PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND =
  "URL is not allowlisted for privileged extension fetch." as const;
export const PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND =
  "URL not allowlisted for privileged fetch." as const;

export const PRIV_FETCH_BACKGROUND_NO_RESPONSE = "Tabocalypse background did not respond." as const;

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
