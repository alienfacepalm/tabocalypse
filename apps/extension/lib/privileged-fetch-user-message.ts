import {
  isPrivilegedFetchAllowlistError,
  isPrivilegedFetchBackgroundUnavailableError,
} from "./privileged-fetch-error-identifiers";

export interface IPrivilegedFetchUserMessage {
  userMessage: string;
  showReloadHint: boolean;
  showTechnicalDetail: boolean;
  technicalDetail: string | null;
}

const ALLOWLIST_USER_MESSAGE =
  "Tabocalypse needs a quick reload to use this online feature. Update to the latest build if you just installed from source, then reload the extension.";

const BACKGROUND_UNAVAILABLE_USER_MESSAGE =
  "Tabocalypse could not reach its background worker. Reload the extension, then open a new tab and try again.";

const GENERIC_FETCH_USER_MESSAGE =
  "This online feature could not load right now. Try again in a moment.";

/** Map privileged-fetch internal errors to plain-language UI copy. */
export function resolvePrivilegedFetchUserMessage(error: string): IPrivilegedFetchUserMessage {
  const trimmed = error.trim();
  if (!trimmed) {
    return {
      userMessage: GENERIC_FETCH_USER_MESSAGE,
      showReloadHint: false,
      showTechnicalDetail: false,
      technicalDetail: null,
    };
  }

  if (isPrivilegedFetchAllowlistError(trimmed)) {
    return {
      userMessage: ALLOWLIST_USER_MESSAGE,
      showReloadHint: true,
      showTechnicalDetail: false,
      technicalDetail: null,
    };
  }

  if (isPrivilegedFetchBackgroundUnavailableError(trimmed)) {
    return {
      userMessage: BACKGROUND_UNAVAILABLE_USER_MESSAGE,
      showReloadHint: true,
      showTechnicalDetail: false,
      technicalDetail: null,
    };
  }

  const isHttpStatus = /^HTTP \d{3}$/.test(trimmed);
  const isLikelyUserActionable =
    trimmed.includes("Network error") ||
    trimmed.includes("Rate or quota") ||
    trimmed.includes("Authentication failed") ||
    trimmed.includes("Access denied") ||
    trimmed.includes("Invalid API key") ||
    trimmed.includes("host permission") ||
    trimmed.includes("Request failed") ||
    trimmed.includes("Provider server error") ||
    trimmed.includes("could not load") ||
    trimmed.includes("Could not load") ||
    trimmed.includes("Bad weather payload");

  return {
    userMessage: isLikelyUserActionable ? trimmed : GENERIC_FETCH_USER_MESSAGE,
    showReloadHint: false,
    showTechnicalDetail: !isLikelyUserActionable && !isHttpStatus,
    technicalDetail: !isLikelyUserActionable ? trimmed : null,
  };
}
