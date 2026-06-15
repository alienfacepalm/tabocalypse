import { describe, expect, it, vi } from "vitest";
import { runOneShotHudGeolocation } from "./hud-geolocation";

describe("runOneShotHudGeolocation", () => {
  it("reports unavailable when geolocation is missing", async () => {
    const onOutcome = vi.fn();
    runOneShotHudGeolocation(undefined, onOutcome);
    await Promise.resolve();
    expect(onOutcome).toHaveBeenCalledTimes(1);
    expect(onOutcome).toHaveBeenCalledWith({ kind: "unavailable" });
  });

  it("delegates to getCurrentPosition and maps success", () => {
    const samplePosition = {
      coords: {
        latitude: 12.34,
        longitude: 56.78,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 0,
    } as GeolocationPosition;

    const getCurrentPosition = vi.fn((onSuccess: PositionCallback) => {
      onSuccess(samplePosition);
    });

    const geo = {
      getCurrentPosition,
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    } as unknown as Geolocation;

    const onOutcome = vi.fn();
    runOneShotHudGeolocation(geo, onOutcome);

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(onOutcome).toHaveBeenCalledTimes(1);
    expect(onOutcome).toHaveBeenCalledWith({
      kind: "ok",
      latitude: 12.34,
      longitude: 56.78,
    });
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("maps errors to denied", () => {
    const getCurrentPosition = vi.fn((_ok: PositionCallback, onError?: PositionErrorCallback) => {
      onError?.({ code: 1, message: "denied" } as GeolocationPositionError);
    });

    const geo = {
      getCurrentPosition,
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    } as unknown as Geolocation;

    const onOutcome = vi.fn();
    runOneShotHudGeolocation(geo, onOutcome);
    expect(onOutcome).toHaveBeenCalledTimes(1);
    expect(onOutcome).toHaveBeenCalledWith({ kind: "denied" });
  });
});
