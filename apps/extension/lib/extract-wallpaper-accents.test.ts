import { describe, expect, it } from "vitest";
import { pickWallpaperAccentsFromRgba } from "./extract-wallpaper-accents";

describe("pickWallpaperAccentsFromRgba", () => {
  it("returns null when every pixel is near-neutral gray", () => {
    const w = 12;
    const h = 12;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 120;
      data[i + 1] = 118;
      data[i + 2] = 122;
      data[i + 3] = 255;
    }
    expect(pickWallpaperAccentsFromRgba(data, w, h)).toBeNull();
  });

  it("extracts two distinct accents from a red and blue split", () => {
    const w = 16;
    const h = 16;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const left = x < w / 2;
        if (left) {
          data[i] = 220;
          data[i + 1] = 20;
          data[i + 2] = 40;
        } else {
          data[i] = 20;
          data[i + 1] = 60;
          data[i + 2] = 220;
        }
        data[i + 3] = 255;
      }
    }
    const out = pickWallpaperAccentsFromRgba(data, w, h);
    expect(out).not.toBeNull();
    expect(out!.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(out!.accent2).toMatch(/^#[0-9a-f]{6}$/);
    expect(out!.accent).not.toBe(out!.accent2);
  });

  it("favors lower half for primary and upper band for secondary (e.g. ground + sky)", () => {
    const w = 24;
    const h = 24;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const sky = y < Math.floor(h * 0.37);
        if (sky) {
          data[i] = 120;
          data[i + 1] = 185;
          data[i + 2] = 245;
        } else {
          data[i] = 145;
          data[i + 1] = 95;
          data[i + 2] = 55;
        }
        data[i + 3] = 255;
      }
    }
    const out = pickWallpaperAccentsFromRgba(data, w, h);
    expect(out).not.toBeNull();

    const parse = (hex: string): { r: number; g: number; b: number } => {
      const s = hex.slice(1);
      return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16),
      };
    };

    const a = parse(out!.accent);
    const a2 = parse(out!.accent2);
    // Ground brown should win primary (more red than blue); sky blue wins secondary (blue dominates).
    expect(a.r + a.g).toBeGreaterThan(a.b);
    expect(a2.b).toBeGreaterThan(a2.r);
  });
});
