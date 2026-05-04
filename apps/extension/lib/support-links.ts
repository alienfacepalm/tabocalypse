import browser from "webextension-polyfill";

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

export function openExternal(url: string): void {
  if (!url || !/^https?:\/\//i.test(url)) return;
  void browser.tabs.create({ url });
}
