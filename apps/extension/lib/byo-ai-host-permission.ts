import browser from "webextension-polyfill";
import { byoAiHostOriginPattern, byoAiHostPermissionHostname } from "./byo-ai-base-url";

/**
 * Ensures the extension may fetch the user-configured BYO host.
 * Requires matching `optional_host_permissions` in `wxt.config.ts`.
 */
export async function ensureByoAiHostPermission(
  baseUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pattern = byoAiHostOriginPattern(baseUrl);
  if (!pattern) {
    return { ok: false, error: "Enter a valid base URL (https:// or http://)." };
  }
  const hostname = byoAiHostPermissionHostname(baseUrl);
  try {
    const granted = await browser.permissions.contains({ origins: [pattern] });
    if (granted) return { ok: true };
    const ok = await browser.permissions.request({ origins: [pattern] });
    if (!ok) {
      return {
        ok: false,
        error: hostname ? `Host permission denied for ${hostname}.` : "Host permission denied.",
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
