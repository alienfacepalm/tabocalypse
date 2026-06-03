import type { THumorBuiltinVoice, THumorIntensity } from "../settings";
import type { IImportedUserPack } from "../settings";
import { GEN_Z_PACK_ID, UNSUCK_CLASSICS_PACK_ID } from "./builtin-packs";
import { getResolvedBuiltinPacks } from "./resolved-builtin-packs";
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

function voiceLockedPackId(voice: THumorBuiltinVoice): string | null {
  if (voice === "gen_z") return GEN_Z_PACK_ID;
  if (voice === "unsuck_classics") return UNSUCK_CLASSICS_PACK_ID;
  return null;
}

export interface IHumorContext {
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  /**
   * Built-in line pools: `default` uses `enabledBuiltinPackIds`; specialty voices lock to one pack.
   * When `humorIncludeUnsuckClassics` is true, classic jargon lines are merged unless that voice is already classic jargon only.
   */
  humorBuiltinVoice: THumorBuiltinVoice;
  /** When true, adds the Classic jargon pack to the built-in pool alongside the primary voice / pack toggles (humor on). */
  humorIncludeUnsuckClassics: boolean;
  enabledBuiltinPackIds: string[];
  importedPacks: IImportedUserPack[];
  myLines: string[];
  locale: string;
}

function activeBuiltinPackIds(ctx: IHumorContext): Set<string> {
  const lockedId = voiceLockedPackId(ctx.humorBuiltinVoice);
  const ids = new Set<string>();
  if (lockedId) {
    ids.add(lockedId);
  } else {
    for (const id of ctx.enabledBuiltinPackIds) {
      ids.add(id);
    }
  }
  if (ctx.humorIncludeUnsuckClassics && !ids.has(UNSUCK_CLASSICS_PACK_ID)) {
    ids.add(UNSUCK_CLASSICS_PACK_ID);
  }
  return ids;
}

/** Seed that changes every `minutesBucket` minutes (default 5). */
export function timeBucketSeed(minutesBucket = 5): string {
  const bucket = Math.floor(Date.now() / (minutesBucket * 60_000));
  return `tb-${bucket}`;
}

function builtinPackAllowed(user: THumorIntensity, packMax: THumorIntensity): boolean {
  if (user === "off") return false;
  return RANK[packMax] <= RANK[user];
}

export function pickDailyLine(ctx: IHumorContext): string | null {
  if (!ctx.humorEnabled || ctx.humorIntensity === "off") return null;

  const candidates: string[] = [];

  const packIds = activeBuiltinPackIds(ctx);
  for (const pack of getResolvedBuiltinPacks()) {
    if (!packIds.has(pack.id)) continue;
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

  const idx =
    hashString(`${timeBucketSeed()}|${ctx.locale}|${candidates.length}`) % candidates.length;
  return candidates[idx] ?? null;
}

export function randomRoast(ctx: IHumorContext): string | null {
  const line = pickDailyLine(ctx);
  if (line) return line;
  return "Humor packs disabled. Chaos respects consent.";
}
