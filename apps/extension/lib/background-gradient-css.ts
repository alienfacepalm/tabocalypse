import type { ISettings } from "./settings";

/** CSS `background` / `background-image` value for the user-configured two-color gradient. */
export function settingsBackgroundGradientCss(s: ISettings): string {
  const c1 = s.backgroundSolid;
  const c2 = s.backgroundGradientEnd;
  if (s.backgroundGradientShape === "radial") {
    const x = s.backgroundGradientCenterXPct;
    const y = s.backgroundGradientCenterYPct;
    return `radial-gradient(circle at ${x}% ${y}%, ${c1}, ${c2})`;
  }
  return `linear-gradient(${s.backgroundGradientAngleDeg}deg, ${c1} 0%, ${c2} 100%)`;
}
