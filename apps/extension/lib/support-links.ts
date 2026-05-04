import browser from "webextension-polyfill";
import { parseConfiguredSupportLinks, type ISupportAction } from "./parse-configured-support-links";

export type { ISupportAction, TSupportLinkKind } from "./parse-configured-support-links";
export { parseConfiguredSupportLinks } from "./parse-configured-support-links";

/**
 * Build-time URLs — set in `.env` (see [.env.example](.env.example)).
 * WXT exposes env vars prefixed with `WXT_` to the client.
 */
export const SUPPORT = {
  donateUrl:
    (import.meta as ImportMeta & { env: Record<string, string> }).env.WXT_TABOCALYPSE_DONATE_URL ??
    "",
  featureUrl:
    (import.meta as ImportMeta & { env: Record<string, string> }).env.WXT_TABOCALYPSE_FEATURE_URL ??
    "",
  githubUrl:
    (import.meta as ImportMeta & { env: Record<string, string> }).env.WXT_TABOCALYPSE_GITHUB_URL ??
    "",
} as const;

const env = (import.meta as ImportMeta & { env: Record<string, string> }).env;

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function actionsFromLegacy(): ISupportAction[] {
  const out: ISupportAction[] = [];
  if (SUPPORT.featureUrl && isHttpUrl(SUPPORT.featureUrl)) {
    out.push({ label: "Suggest a feature", url: SUPPORT.featureUrl, kind: "feedback" });
  }
  if (SUPPORT.donateUrl && isHttpUrl(SUPPORT.donateUrl)) {
    out.push({ label: "Donate", url: SUPPORT.donateUrl, kind: "donate" });
  }
  if (SUPPORT.githubUrl && isHttpUrl(SUPPORT.githubUrl)) {
    out.push({ label: "GitHub", url: SUPPORT.githubUrl, kind: "source" });
  }
  return out;
}

/**
 * Build-time actions: `WXT_TABOCALYPSE_SUPPORT_LINKS` JSON array wins when set; otherwise the three
 * legacy URL env vars are used.
 */
export function getSupportActions(): ISupportAction[] {
  const raw = env.WXT_TABOCALYPSE_SUPPORT_LINKS;
  if (raw === undefined || String(raw).trim() === "") {
    return actionsFromLegacy();
  }
  const parsed = parseConfiguredSupportLinks(String(raw));
  if (parsed === null) {
    return actionsFromLegacy();
  }
  return parsed;
}

export function openExternal(url: string): void {
  if (!url || !isHttpUrl(url)) return;
  void browser.tabs.create({ url });
}
