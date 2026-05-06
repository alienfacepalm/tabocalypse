/**
 * Sample colors from a wallpaper (Bing blob URL or user data URL) for HUD accents.
 * Primary favors the lower image area (typical foreground); secondary favors the upper band (e.g. sky).
 */

import { coerceThemeHex, DEFAULT_THEME_CUSTOM_ACCENT, DEFAULT_THEME_CUSTOM_ACCENT2 } from "./theme";

const SAMPLE_W = 72;
const SAMPLE_H = 54;

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function hueDiff(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

function toHex6(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.min(255, Math.max(0, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Auto HUD (wallpaper accent matching): maps sampled pixels to stored accents. Lightens by halving
 * distance-to-white on the lightness axis so dark photo colors do not read as muddy HUD accents.
 */
function boostWallpaperSampleForHud(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  const s2 = Math.min(1, Math.max(0.4, s * 1.08));
  const lLifted = 1 - (1 - l) * 0.5;
  const l2 = Math.min(0.82, Math.max(0.38, lLifted));
  const o = hslToRgb(h, s2, l2);
  return coerceThemeHex(toHex6(o.r, o.g, o.b), DEFAULT_THEME_CUSTOM_ACCENT);
}

type TMutableBucket = { count: number; rSum: number; gSum: number; bSum: number };

type TSampledColor = { count: number; r: number; g: number; b: number };

/** Pixels with y in [yMinPx, yMaxPx). */
function saturatedBucketsInRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  yMinPx: number,
  yMaxPx: number,
  chromaMin: number,
  lumMin: number,
  lumMax: number,
): TSampledColor[] {
  const buckets = new Map<string, TMutableBucket>();
  const stepX = Math.max(1, Math.floor(width / 48));
  const stepY = Math.max(1, Math.floor(height / 36));

  const y0 = Math.max(0, Math.min(yMinPx, height));
  const y1 = Math.max(y0, Math.min(yMaxPx, height));

  for (let y = y0; y < y1; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = data[i + 3] ?? 255;
      if (a < 128) continue;

      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const chroma = mx - mn;
      if (chroma < chromaMin) continue;

      const lum = (mx + mn) / (2 * 255);
      if (lum < lumMin || lum > lumMax) continue;

      const key = `${r >> 5},${g >> 5},${b >> 5}`;
      const ex = buckets.get(key);
      if (ex) {
        ex.count += 1;
        ex.rSum += r;
        ex.gSum += g;
        ex.bSum += b;
      } else {
        buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
      }
    }
  }

  const list = [...buckets.values()].map((bk) => {
    const r = Math.round(bk.rSum / bk.count);
    const g = Math.round(bk.gSum / bk.count);
    const b = Math.round(bk.bSum / bk.count);
    return { count: bk.count, r, g, b };
  });

  list.sort((a, b) => b.count - a.count);
  return list;
}

function pickSecondaryFromTopBand(
  topList: readonly TSampledColor[],
  hPrimary: { h: number; s: number; l: number },
  primaryRgb: TSampledColor,
): TSampledColor | null {
  if (topList.length === 0) return null;

  const minHueSep = 0.1;
  /** Prefer a non-gray sky/minor hue distinct from the main accent. */
  const byHueFirst = topList.find((c) => {
    if (c.r === primaryRgb.r && c.g === primaryRgb.g && c.b === primaryRgb.b) return false;
    const ht = rgbToHsl(c.r, c.g, c.b);
    return hueDiff(hPrimary.h, ht.h) >= minHueSep;
  });
  if (byHueFirst) return byHueFirst;

  let best: TSampledColor | null = null;
  let bestScore = -1;
  for (const c of topList) {
    if (c.r === primaryRgb.r && c.g === primaryRgb.g && c.b === primaryRgb.b) continue;
    const ht = rgbToHsl(c.r, c.g, c.b);
    const sep = hueDiff(hPrimary.h, ht.h);
    const score = c.count * (0.15 + sep);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * Picks HUD accent pair from downscaled RGBA: **primary** favors the lower portion of the image
 * (typical foreground / ground) and **secondary** favors the upper band (typical sky), with a full-image
 * fallback when regions lack saturated pixels.
 */
export function pickWallpaperAccentsFromRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { accent: string; accent2: string } | null {
  const globalList = saturatedBucketsInRegion(data, width, height, 0, height, 18, 0.06, 0.94);
  if (globalList.length === 0) return null;

  const lowerStart = Math.floor(height * 0.47);
  const lowerList = saturatedBucketsInRegion(
    data,
    width,
    height,
    lowerStart,
    height,
    18,
    0.06,
    0.94,
  );

  const upperEnd = Math.max(1, Math.ceil(height * 0.39));
  const topList = saturatedBucketsInRegion(data, width, height, 0, upperEnd, 12, 0.07, 0.97);

  const primary = lowerList[0] ?? globalList[0]!;
  const h1 = rgbToHsl(primary.r, primary.g, primary.b);

  const minShare = Math.max(2, Math.floor(globalList[0]!.count * 0.07));
  const topPick = pickSecondaryFromTopBand(topList, h1, primary);
  let r2: number;
  let g2: number;
  let b2: number;

  if (topPick) {
    ({ r: r2, g: g2, b: b2 } = topPick);
  } else {
    const secondHit = globalList.find((c) => {
      if (c.r === primary.r && c.g === primary.g && c.b === primary.b) return false;
      const h2 = rgbToHsl(c.r, c.g, c.b);
      return hueDiff(h1.h, h2.h) >= 0.12 && c.count >= minShare;
    });
    if (secondHit) {
      ({ r: r2, g: g2, b: b2 } = secondHit);
    } else {
      const split = hslToRgb((h1.h + 0.38) % 1, Math.min(0.95, h1.s + 0.12), h1.l);
      r2 = Math.round(split.r);
      g2 = Math.round(split.g);
      b2 = Math.round(split.b);
    }
  }

  const accent = boostWallpaperSampleForHud(primary.r, primary.g, primary.b);
  const accent2 = coerceThemeHex(
    boostWallpaperSampleForHud(r2, g2, b2),
    DEFAULT_THEME_CUSTOM_ACCENT2,
  );

  if (accent === accent2) {
    const split = hslToRgb((h1.h + 0.5) % 1, 0.75, 0.52);
    return {
      accent,
      accent2: coerceThemeHex(
        boostWallpaperSampleForHud(Math.round(split.r), Math.round(split.g), Math.round(split.b)),
        DEFAULT_THEME_CUSTOM_ACCENT2,
      ),
    };
  }

  return { accent, accent2 };
}

export function extractWallpaperAccentsFromImageUrl(
  src: string,
): Promise<{ accent: string; accent2: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_W;
        canvas.height = SAMPLE_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
        const imageData = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
        resolve(pickWallpaperAccentsFromRgba(imageData.data, SAMPLE_W, SAMPLE_H));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
