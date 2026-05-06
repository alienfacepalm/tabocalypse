export type TWeatherGeolocationOutcome =
  | { kind: "ok"; latitude: number; longitude: number }
  | { kind: "denied" }
  | { kind: "unavailable" };

/** Single `getCurrentPosition` call — does not subscribe to ongoing updates. */
export function runOneShotWeatherGeolocation(
  geolocation: Geolocation | undefined,
  onOutcome: (outcome: TWeatherGeolocationOutcome) => void,
): void {
  if (!geolocation) {
    queueMicrotask(() => {
      onOutcome({ kind: "unavailable" });
    });
    return;
  }

  geolocation.getCurrentPosition(
    (position) => {
      onOutcome({
        kind: "ok",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    () => {
      onOutcome({ kind: "denied" });
    },
  );
}
