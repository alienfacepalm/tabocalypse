import { getLikelyRegionFromNavigator } from "../locale-units";
import { PEAPIX_BING_COUNTRY_OPTIONS, type TPeapixBingCountry } from "../bing-wallpaper-country";
import type { TBalancedNewsCategory } from "./balanced-news-types";

/** ISO 3166-1 alpha-2 codes exposed in Settings (uppercase for FreeQuickNews). */
export const BALANCED_NEWS_COUNTRY_OPTIONS = [
  "US",
  "GB",
  "DE",
  "FR",
  "JP",
  "AU",
  "CA",
  "IN",
  "BR",
  "IT",
  "ES",
  "MX",
  "CN",
  "KR",
  "NL",
] as const;

export type TBalancedNewsCountry = (typeof BALANCED_NEWS_COUNTRY_OPTIONS)[number];

const BALANCED_NEWS_COUNTRY_SET = new Set<string>(BALANCED_NEWS_COUNTRY_OPTIONS);

const PEAPIX_TO_FQN: Record<TPeapixBingCountry, TBalancedNewsCountry> = {
  us: "US",
  uk: "GB",
  de: "DE",
  fr: "FR",
  jp: "JP",
  au: "AU",
  ca: "CA",
  in: "IN",
  br: "BR",
  it: "IT",
  es: "ES",
  mx: "MX",
  cn: "CN",
  kr: "KR",
  nl: "NL",
};

const REGION_TO_FQN: Record<string, TBalancedNewsCountry> = {
  US: "US",
  GB: "GB",
  UK: "GB",
  DE: "DE",
  FR: "FR",
  JP: "JP",
  AU: "AU",
  CA: "CA",
  IN: "IN",
  BR: "BR",
  IT: "IT",
  ES: "ES",
  MX: "MX",
  CN: "CN",
  KR: "KR",
  NL: "NL",
};

export function peapixCountryToFqnCountry(code: TPeapixBingCountry): TBalancedNewsCountry {
  return PEAPIX_TO_FQN[code];
}

export function coerceBalancedNewsCountry(
  raw: unknown,
  fallback: TBalancedNewsCountry,
): TBalancedNewsCountry {
  if (typeof raw !== "string") return fallback;
  const upper = raw.trim().toUpperCase();
  return BALANCED_NEWS_COUNTRY_SET.has(upper) ? (upper as TBalancedNewsCountry) : fallback;
}

export function inferBalancedNewsCountryFromNavigator(): TBalancedNewsCountry {
  const region = getLikelyRegionFromNavigator()?.toUpperCase();
  if (region && region in REGION_TO_FQN) {
    return REGION_TO_FQN[region]!;
  }
  return "US";
}

export function balancedNewsCountryStorageValue(country: TBalancedNewsCountry): TPeapixBingCountry {
  const lower = country.toLowerCase();
  if (lower === "gb") return "uk";
  return PEAPIX_BING_COUNTRY_OPTIONS.find((c) => c === lower) ?? "us";
}

export function coerceBalancedNewsCountryFromStorage(
  raw: unknown,
  fallback: TBalancedNewsCountry,
): TBalancedNewsCountry {
  if (typeof raw !== "string") return fallback;
  const lower = raw.trim().toLowerCase();
  if (lower === "uk") return "GB";
  const upper = lower.toUpperCase();
  return coerceBalancedNewsCountry(upper, fallback);
}

const POLITICS_COUNTRIES = new Set<TBalancedNewsCountry>(["US", "CA"]);

export function defaultBalancedNewsCategoryForCountry(
  country: TBalancedNewsCountry,
): TBalancedNewsCategory {
  return POLITICS_COUNTRIES.has(country) ? "politics" : "world";
}

export const BALANCED_NEWS_CATEGORY_OPTIONS: readonly TBalancedNewsCategory[] = [
  "politics",
  "world",
  "tech",
  "business",
  "health",
  "ai",
];

export function coerceBalancedNewsCategory(
  raw: unknown,
  fallback: TBalancedNewsCategory,
): TBalancedNewsCategory {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim().toLowerCase() as TBalancedNewsCategory;
  return BALANCED_NEWS_CATEGORY_OPTIONS.includes(v) ? v : fallback;
}

export function coerceBalancedNewsTopicCount(raw: unknown, fallback: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.min(10, Math.max(3, Math.round(raw)));
}
