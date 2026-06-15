import { privilegedExtensionFetchJson } from "./privileged-extension-fetch";

interface IOpenMeteoTimezonePayload {
  timezone?: unknown;
}

/** Resolves an IANA timezone for HUD coordinates via Open-Meteo (same provider as Weather). */
export async function resolveTimezoneFromCoords(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("timezone", "auto");

  const data = (await privilegedExtensionFetchJson(
    url.toString(),
    signal,
  )) as IOpenMeteoTimezonePayload;
  if (typeof data.timezone !== "string") return null;
  const trimmed = data.timezone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readNavigatorTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
