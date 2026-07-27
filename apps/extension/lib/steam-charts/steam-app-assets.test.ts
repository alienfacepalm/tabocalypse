import { describe, expect, it } from "vitest";
import {
  STEAM_VALVE_ATTRIBUTION,
  steamAppCapsuleSmUrl,
  steamAppHeaderUrl,
  steamStoreAppUrl,
} from "./steam-app-assets";

describe("steam-app-assets", () => {
  it("builds CDN and store URLs for an app id", () => {
    expect(steamAppCapsuleSmUrl(730)).toBe(
      "https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_sm_120.jpg",
    );
    expect(steamAppHeaderUrl(570)).toBe(
      "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
    );
    expect(steamStoreAppUrl(440)).toBe("https://store.steampowered.com/app/440");
  });

  it("keeps Valve trademark attribution text", () => {
    expect(STEAM_VALVE_ATTRIBUTION).toMatch(/Valve Corporation/);
    expect(STEAM_VALVE_ATTRIBUTION).toMatch(/Steam/);
  });
});
