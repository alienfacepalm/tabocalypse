import type { THumorIntensity, TPresetKey, TWidgetKey } from "./settings";
import { timeBucketSeed } from "./humor/engine";

export interface ISystemStatusContext {
  /** Settings > Personality preset — drives header status line behavior. */
  preset: TPresetKey;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  enabledWidgetCount: number;
  noteCount: number;
  openTodoCount: number;
  lightTheme: boolean;
}

const GENERIC_TELEMETRY: readonly string[] = [
  "INTEGRITY: COMPROMISED",
  "KERNEL_PANIC: POSTPONED",
  "GUILT_BUFFER: OVERFLOW",
  "SANITY_CHECK: SKIPPED",
  "UPTIME: REGRETTABLE",
  "TAB_LOAD: UNBOUNDED",
  "SURFACE: HOSTILE",
  "SYNC: IMAGINARY",
  "PATCH_LEVEL: INSUFFICIENT",
  "USER_FAULT: PROBABLE",
  "COHERENCE: OPTIONAL",
  "BACKUP_PLAN: NONE",
  "PRIORITY: LOW",
  "FOCUS: NOT_FOUND",
  "MEMORY: LEAKING",
];

const CHAOTIC_TELEMETRY: readonly string[] = [
  "GRID_SNAP: DISABLED",
  "LAYOUT: CHAOTIC",
  "ALIGNMENT: REJECTED",
  "PANEL_PHYSICS: OFF",
  "COORD_SPACE: DRUNK",
];

const HUMOR_OFF_TELEMETRY: readonly string[] = [
  "HUMOR_SUBSYSTEM: OFFLINE",
  "SNARK_DAEMON: STOPPED",
  "ROAST_ENGINE: IDLE",
];

const LIGHT_THEME_TELEMETRY: readonly string[] = [
  "VOID_BLACK: BYPASSED",
  "CAMOUFLAGE: ENABLED",
  "GLARE_SHIELD: ACTIVE",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function countEnabledWidgets(widgets: Record<TWidgetKey, boolean>): number {
  let n = 0;
  for (const key of Object.keys(widgets) as TWidgetKey[]) {
    if (widgets[key]) n += 1;
  }
  return n;
}

export function buildSystemStatusTelemetryPool(ctx: ISystemStatusContext): string[] {
  return [...GENERIC_TELEMETRY, ...contextualTelemetry(ctx)];
}

function contextualTelemetry(ctx: ISystemStatusContext): string[] {
  const out: string[] = [];

  if (ctx.preset === "chaos") out.push(...CHAOTIC_TELEMETRY);
  if (!ctx.humorEnabled || ctx.humorIntensity === "off") out.push(...HUMOR_OFF_TELEMETRY);
  if (ctx.lightTheme) out.push(...LIGHT_THEME_TELEMETRY);

  if (ctx.enabledWidgetCount >= 8) {
    out.push(`HUD_NODES: ${ctx.enabledWidgetCount}`);
    out.push("SURFACE_AREA: DENSE");
  } else if (ctx.enabledWidgetCount <= 2) {
    out.push("HUD_NODES: SPARSE");
    out.push("MINIMALISM: SUSPECT");
  }

  if (ctx.noteCount >= 5) out.push(`SCRAP_COUNT: ${ctx.noteCount}`);
  if (ctx.openTodoCount >= 4) out.push(`OPEN_LOOPS: ${ctx.openTodoCount}`);

  return out;
}

/** Rotating HUD telemetry beside the fixed SYSTEM_STABLE: FALSE anchor (Chaos preset only). */
export function resolveSystemStatusTelemetry(ctx: ISystemStatusContext): string {
  if (ctx.preset !== "chaos") return "";
  const pool = buildSystemStatusTelemetryPool(ctx);
  const idx = hashString(`${timeBucketSeed(3)}|${pool.length}|chaos`) % pool.length;
  return pool[idx] ?? GENERIC_TELEMETRY[0]!;
}

const GLITCH_FALSE_VARIANTS: readonly string[] = [
  "F4L53",
  "FALS3",
  "FA1SE",
  "F@LSE",
  "FALSE?",
  "FAL5E",
  "FA|SE",
  "F4L$E",
  "UNSTABLE",
  "FAL—E",
  "F∆LSE",
  "NOT_OK",
];

/** Brief corrupted spellings for chaotic scramble animation. */
export function pickGlitchFalseVariant(seed: number): string {
  return GLITCH_FALSE_VARIANTS[seed % GLITCH_FALSE_VARIANTS.length] ?? "F4L53";
}
