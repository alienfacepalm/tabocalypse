import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import {
  coerceBalancedNewsCountry,
  coerceBalancedNewsCountryFromStorage,
  inferBalancedNewsCountryFromNavigator,
  peapixCountryToFqnCountry,
  type TBalancedNewsCountry,
} from "./balanced-news-country";
import type { TPeapixBingCountry } from "../bing-wallpaper-country";
import type { IHudGeoLocation } from "../hud-geo-location";

export interface IResolveBalancedNewsRegionInput {
  balancedNewsCountryAuto: boolean;
  balancedNewsCountry: TPeapixBingCountry;
  balancedNewsUseDeviceGeo: boolean;
  hudGeo: IHudGeoLocation;
}

interface IOpenMeteoReverseGeocodeRow {
  country_code?: unknown;
}

interface IOpenMeteoReverseGeocodePayload {
  results?: unknown;
}

function countryFromOpenMeteoCode(code: unknown): TBalancedNewsCountry | null {
  if (typeof code !== "string" || code.trim().length !== 2) return null;
  return coerceBalancedNewsCountry(code.trim().toUpperCase(), "US");
}

export async function reverseGeocodeCountryFromCoords(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<TBalancedNewsCountry | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&language=en`;
  const data = (await privilegedExtensionFetchJson(url, signal)) as IOpenMeteoReverseGeocodePayload;
  const results = Array.isArray(data.results) ? data.results : [];
  const first = results[0] as IOpenMeteoReverseGeocodeRow | undefined;
  if (!first) return null;
  return countryFromOpenMeteoCode(first.country_code);
}

/** Resolves the FreeQuickNews `country` parameter from settings and optional device geo. */
export async function resolveBalancedNewsCountry(
  input: IResolveBalancedNewsRegionInput,
  signal?: AbortSignal,
): Promise<TBalancedNewsCountry> {
  if (!input.balancedNewsCountryAuto) {
    return coerceBalancedNewsCountryFromStorage(
      input.balancedNewsCountry,
      inferBalancedNewsCountryFromNavigator(),
    );
  }

  if (input.balancedNewsUseDeviceGeo && input.hudGeo.geoAdjusted) {
    const fromCoords = await reverseGeocodeCountryFromCoords(
      input.hudGeo.lat,
      input.hudGeo.lon,
      signal,
    );
    if (fromCoords) return fromCoords;
  }

  return inferBalancedNewsCountryFromNavigator();
}

export function resolveBalancedNewsCountrySync(
  input: IResolveBalancedNewsRegionInput,
): TBalancedNewsCountry {
  if (!input.balancedNewsCountryAuto) {
    return peapixCountryToFqnCountry(input.balancedNewsCountry);
  }
  return inferBalancedNewsCountryFromNavigator();
}
