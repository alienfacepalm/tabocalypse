import { getLikelyRegionFromNavigator } from "./locale-units";

/** Peapix `country` query values we expose in Settings (lowercase). */
export const PEAPIX_BING_COUNTRY_OPTIONS = [
  "us",
  "uk",
  "de",
  "fr",
  "jp",
  "au",
  "ca",
  "in",
  "br",
  "it",
  "es",
  "mx",
  "cn",
  "kr",
  "nl",
] as const;

export type TPeapixBingCountry = (typeof PEAPIX_BING_COUNTRY_OPTIONS)[number];

const PEAPIX_BING_COUNTRY_SET = new Set<string>(PEAPIX_BING_COUNTRY_OPTIONS);

/** ISO 3166-1 alpha-2 region → Peapix Bing feed country code. */
const REGION_TO_PEAPIX: Record<string, TPeapixBingCountry> = {
  US: "us",
  GB: "uk",
  UK: "uk",
  DE: "de",
  FR: "fr",
  JP: "jp",
  AU: "au",
  CA: "ca",
  IN: "in",
  BR: "br",
  IT: "it",
  ES: "es",
  MX: "mx",
  CN: "cn",
  KR: "kr",
  NL: "nl",
};

export function coercePeapixBingCountry(
  raw: unknown,
  fallback: TPeapixBingCountry,
): TPeapixBingCountry {
  if (typeof raw !== "string") return fallback;
  const code = raw.trim().toLowerCase();
  return PEAPIX_BING_COUNTRY_SET.has(code) ? (code as TPeapixBingCountry) : fallback;
}

export function inferPeapixBingCountryFromNavigator(): TPeapixBingCountry {
  const region = getLikelyRegionFromNavigator()?.toUpperCase();
  if (region && region in REGION_TO_PEAPIX) {
    return REGION_TO_PEAPIX[region]!;
  }
  return "us";
}

export function peapixBingFeedUrl(country: TPeapixBingCountry): string {
  return `https://peapix.com/bing/feed?country=${country}`;
}

export function resolveEffectivePeapixBingCountry(input: {
  bingWallpaperCountryAuto: boolean;
  bingWallpaperCountry: TPeapixBingCountry;
}): TPeapixBingCountry {
  return input.bingWallpaperCountryAuto
    ? inferPeapixBingCountryFromNavigator()
    : input.bingWallpaperCountry;
}
