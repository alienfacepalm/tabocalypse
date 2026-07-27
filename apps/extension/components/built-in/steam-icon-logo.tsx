/**
 * Steam® mark (Wikimedia Commons “Steam icon logo.svg”).
 * Trademark of Valve Corporation — used at owner request with attribution; remove if Valve objects.
 * Source: https://commons.wikimedia.org/wiki/File:Steam_icon_logo.svg
 */
import browser from "webextension-polyfill";
import React from "react";

const STEAM_ICON_LOGO_PATH = "steam-icon-logo.svg";
const STEAM_WEB_API_KEY_EXAMPLE_PATH = "steam-web-api-key-example.png";

export function steamIconLogoUrl(): string {
  try {
    return browser.runtime.getURL(STEAM_ICON_LOGO_PATH);
  } catch {
    return `/${STEAM_ICON_LOGO_PATH}`;
  }
}

/** Redacted Steam Web API key page screenshot (Domain Name: localhost). */
export function steamWebApiKeyExampleUrl(): string {
  try {
    return browser.runtime.getURL(STEAM_WEB_API_KEY_EXAMPLE_PATH);
  } catch {
    return `/${STEAM_WEB_API_KEY_EXAMPLE_PATH}`;
  }
}

export function SteamIconLogo({
  size = 20,
  className = "",
  title = "Steam®",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={steamIconLogoUrl()}
      alt=""
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
      title={title}
      aria-hidden
    />
  );
}
