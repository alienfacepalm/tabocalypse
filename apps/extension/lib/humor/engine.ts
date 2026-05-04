import type { THumorIntensity } from "../settings";
import type { IImportedUserPack } from "../settings";
import { BUILTIN_PACKS } from "./builtin-packs";
import { passesBuiltinHardFilter } from "./filter";

const RANK: Record<THumorIntensity, number> = {
  off: 0,
  mild: 1,
  spicy: 2,
  unhinged: 3,
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface IHumorContext {
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  enabledBuiltinPackIds: string[];
  importedPacks: IImportedUserPack[];
  myLines: string[];
  locale: string;
}

export function dailySeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function builtinPackAllowed(user: THumorIntensity, packMax: THumorIntensity): boolean {
  if (user === "off") return false;
  return RANK[packMax] <= RANK[user];
}

export function pickDailyLine(ctx: IHumorContext): string | null {
  if (!ctx.humorEnabled || ctx.humorIntensity === "off") return null;

  const candidates: string[] = [];

  for (const pack of BUILTIN_PACKS) {
    if (!ctx.enabledBuiltinPackIds.includes(pack.id)) continue;
    if (!builtinPackAllowed(ctx.humorIntensity, pack.maxIntensity)) continue;
    for (const line of pack.lines) {
      if (passesBuiltinHardFilter(line)) candidates.push(line);
    }
  }

  for (const p of ctx.importedPacks) {
    if (!p.enabled) continue;
    for (const m of p.messages) {
      if (m.trim()) candidates.push(m.trim());
    }
  }

  for (const m of ctx.myLines) {
    if (m.trim()) candidates.push(m.trim());
  }

  if (candidates.length === 0) return null;

  const idx = hashString(`${dailySeed()}|${ctx.locale}|${candidates.length}`) % candidates.length;
  return candidates[idx] ?? null;
}

export function randomRoast(ctx: IHumorContext): string | null {
  const line = pickDailyLine(ctx);
  if (line) return line;
  return "Humor packs disabled. Chaos respects consent.";
}
