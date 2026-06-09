import type { TFqnBiasLabel, TNewsPerspective } from "./balanced-news-types";

/** Collapse FreeQuickNews five-point bias into Left / Center / Right columns. */
export function mapBiasToPerspective(bias: TFqnBiasLabel): TNewsPerspective | null {
  switch (bias) {
    case "left":
    case "left-center":
      return "left";
    case "center":
      return "center";
    case "right":
    case "right-center":
      return "right";
    default:
      return null;
  }
}

export function coerceFqnBiasLabel(raw: unknown): TFqnBiasLabel {
  if (typeof raw !== "string") return "unknown";
  const v = raw.trim().toLowerCase();
  if (
    v === "left" ||
    v === "left-center" ||
    v === "center" ||
    v === "right-center" ||
    v === "right"
  ) {
    return v;
  }
  return "unknown";
}
