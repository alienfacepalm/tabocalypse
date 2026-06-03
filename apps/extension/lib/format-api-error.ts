/** Turn provider HTTP bodies into short, user-facing messages (BYO AI, no publisher backend). */

function messageFromErrorObject(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.error != null && typeof row.error === "object") {
    const nested = row.error as Record<string, unknown>;
    if (typeof nested.message === "string" && nested.message.trim().length > 0) {
      return nested.message.trim();
    }
  }
  if (typeof row.message === "string" && row.message.trim().length > 0) {
    return row.message.trim();
  }
  if (typeof row.detail === "string" && row.detail.trim().length > 0) {
    return row.detail.trim();
  }
  return null;
}

export function extractApiErrorMessage(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  try {
    const data: unknown = JSON.parse(trimmed);
    if (Array.isArray(data)) {
      for (const item of data) {
        const msg = messageFromErrorObject(item);
        if (msg) return msg;
      }
      return null;
    }
    return messageFromErrorObject(data);
  } catch {
    if (trimmed.length > 0 && trimmed.length <= 400 && !trimmed.startsWith("{")) {
      return trimmed;
    }
    return null;
  }
}

function truncateDetail(detail: string, max = 160): string {
  return detail.length > max ? `${detail.slice(0, max - 1)}…` : detail;
}

/** User-facing 429 message from {@link formatHttpApiError}. */
export const RATE_OR_QUOTA_LIMIT_MESSAGE =
  "Rate or quota limit reached. Wait a bit or check billing on your provider account.";

export function isRateOrQuotaLimitError(message: string): boolean {
  return message.trim() === RATE_OR_QUOTA_LIMIT_MESSAGE;
}

export function formatHttpApiError(status: number, body: string): string {
  const detailRaw = extractApiErrorMessage(body);
  const detail = detailRaw ? truncateDetail(detailRaw) : null;

  switch (status) {
    case 401:
      return detail
        ? `Authentication failed: ${detail}`
        : "Invalid API key. Check Settings > BYO AI.";
    case 403:
      return detail
        ? `Access denied: ${detail}`
        : "Access denied. Your API key may not be allowed to use this model.";
    case 429:
      return RATE_OR_QUOTA_LIMIT_MESSAGE;
    case 400:
      return detail
        ? `Request rejected: ${detail}`
        : "The provider rejected this request. Check your model and settings.";
    case 404:
      return "Endpoint or model not found. Check Settings > BYO AI base URL and model.";
    case 408:
      return "The provider took too long to respond. Try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Provider server error. Try again in a moment.";
    default:
      return detail ? `Request failed (${status}): ${detail}` : `Request failed (HTTP ${status}).`;
  }
}

export function formatNetworkError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Network error. Check your connection or host permission in Settings > Optional permissions.";
  }
  if (lower.includes("aborted") || lower.includes("abort")) {
    return "Request was cancelled.";
  }
  return message;
}
