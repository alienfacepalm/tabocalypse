export interface ICompressBackgroundImageOptions {
  maxBytes: number;
  maxEdgePx: number;
}

/** Approximate decoded size of a `data:*;base64,...` URL. */
export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return new TextEncoder().encode(dataUrl).length;
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, "");
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

export function computeScaledDimensions(
  width: number,
  height: number,
  maxEdgePx: number,
): { width: number; height: number } {
  const w0 = Math.max(1, Math.floor(width));
  const h0 = Math.max(1, Math.floor(height));
  const maxE = Math.max(1, Math.floor(maxEdgePx));
  const m = Math.max(w0, h0);
  if (m <= maxE) return { width: w0, height: h0 };
  const scale = maxE / m;
  return {
    width: Math.max(1, Math.round(w0 * scale)),
    height: Math.max(1, Math.round(h0 * scale)),
  };
}

function lossyDataUrlFromCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
  preferWebp: boolean,
): string {
  if (preferWebp) {
    const s = canvas.toDataURL("image/webp", quality);
    if (s.startsWith("data:image/webp,")) return s;
  }
  return canvas.toDataURL("image/jpeg", quality);
}

function probeWebpExport(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  return lossyDataUrlFromCanvas(c, 0.5, true).startsWith("data:image/webp,");
}

let cachedWebp: boolean | null = null;

function prefersWebp(): boolean {
  if (cachedWebp === null) cachedWebp = probeWebpExport();
  return cachedWebp;
}

/**
 * Decodes an image file, scales it down on-device, and re-encodes as WebP or JPEG until the
 * resulting data URL is within `maxBytes`.
 */
export async function compressImageFileToDataUrl(
  file: File,
  options: ICompressBackgroundImageOptions,
): Promise<string> {
  const { maxBytes, maxEdgePx } = options;
  if (!file.type.startsWith("image/")) {
    throw new Error("Backgrounds must be image files.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image format could not be decoded in the browser.");
  }

  try {
    let maxEdge = Math.min(Math.max(1, maxEdgePx), 3840);
    const minEdge = 480;
    const preferWebp = prefersWebp();
    const stepQ = 0.045;

    for (let edgeRound = 0; edgeRound < 14 && maxEdge >= minEdge; edgeRound++) {
      const { width: dw, height: dh } = computeScaledDimensions(
        bitmap.width,
        bitmap.height,
        maxEdge,
      );
      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not prepare image canvas.");
      ctx.drawImage(bitmap, 0, 0, dw, dh);

      for (let q = 0.92; q >= 0.36 - 1e-9; q -= stepQ) {
        const dataUrl = lossyDataUrlFromCanvas(canvas, q, preferWebp);
        if (estimateDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
      }

      maxEdge = Math.floor(maxEdge * 0.78);
    }

    throw new Error(
      `Could not compress "${file.name}" enough to fit local storage. Try a smaller or simpler image.`,
    );
  } finally {
    bitmap.close();
  }
}
