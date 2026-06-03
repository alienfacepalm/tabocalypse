export type THudToastVariant = "error" | "warn" | "info" | "success";

export type THudToastPresentation = {
  className: string;
  style: { top?: string; left?: string; right?: string; bottom?: string };
};

const VARIANT_CLASSES: Record<THudToastVariant, string> = {
  error: "toast toast-error",
  warn: "toast toast-warn",
  info: "toast toast-info",
  success: "toast toast-success",
};

const ALL_VARIANTS: THudToastVariant[] = ["error", "warn", "info", "success"];

/** Small deterministic hash from toast id (stable for the lifetime of one toast). */
export function hashHudToastSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function resolveHudToastPresentation(
  id: string,
  variant: THudToastVariant,
  chaotic: boolean,
  stackIndex: number,
): THudToastPresentation {
  if (!chaotic) {
    const offset = stackIndex * 4.5;
    return {
      className: VARIANT_CLASSES[variant],
      style: {
        bottom: `${3.5 + offset}rem`,
        right: "1rem",
      },
    };
  }

  const h = hashHudToastSeed(id);
  const wrongVariant = ALL_VARIANTS[(h + 1 + ALL_VARIANTS.indexOf(variant)) % ALL_VARIANTS.length];
  const topPct = 6 + (h % 72);
  const leftPct = 4 + ((h >>> 8) % 78);

  return {
    className: VARIANT_CLASSES[wrongVariant],
    style: {
      top: `${topPct}%`,
      left: `${leftPct}%`,
      right: "auto",
      bottom: "auto",
    },
  };
}
