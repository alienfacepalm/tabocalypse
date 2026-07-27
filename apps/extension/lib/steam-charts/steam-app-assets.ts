/**
 * Public Steam store capsule CDN URLs for an app id.
 * These are game store assets (not the Steam corporate trademark logo).
 * Prefer small capsules in dense HUD lists.
 */
export function steamAppCapsuleSmUrl(appId: number): string {
  const id = Math.floor(appId);
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_sm_120.jpg`;
}

/** Wider store header — fallback when the small capsule is missing. */
export function steamAppHeaderUrl(appId: number): string {
  const id = Math.floor(appId);
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

export function steamStoreAppUrl(appId: number): string {
  const id = Math.floor(appId);
  return `https://store.steampowered.com/app/${id}`;
}

/** Valve attribution required when referring to Steam® trademarks. */
export const STEAM_VALVE_ATTRIBUTION =
  "© Valve Corporation. Steam and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.";
