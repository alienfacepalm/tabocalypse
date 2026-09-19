import { isIsoDateString, previousIsoDateLocal } from "../local-iso-date";

/**
 * Device-local XP ledger (`tabocalypseXpLedger`). A game gate for bundled rewards, not an
 * entitlement: it never leaves this device, is not exported with settings, and has no
 * relationship to the planned signed license token.
 */
export interface IXpLedger {
  version: 1;
  /** Spendable balance. */
  balanceXp: number;
  /** Earned ever; never decreases. */
  lifetimeXp: number;
  streakDays: number;
  /** Local ISO date of the last completed play, or null before the first. */
  lastPlayedDate: string | null;
  /** Catalog ids already paid for; reinstalling one is free. */
  unlockedRewardIds: string[];
}

export type TUnlockRewardResult =
  | { ok: true; ledger: IXpLedger; spentXp: number; alreadyUnlocked: boolean }
  | { ok: false; reason: "insufficient"; ledger: IXpLedger; missingXp: number };

export function emptyXpLedger(): IXpLedger {
  return {
    version: 1,
    balanceXp: 0,
    lifetimeXp: 0,
    streakDays: 0,
    lastPlayedDate: null,
    unlockedRewardIds: [],
  };
}

function nonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

/** Never throws; anything malformed collapses to a safe value. */
export function coerceXpLedger(raw: unknown): IXpLedger {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return emptyXpLedger();
  const row = raw as Record<string, unknown>;
  const lifetimeXp = nonNegativeInt(row.lifetimeXp);
  const balanceXp = Math.min(nonNegativeInt(row.balanceXp), lifetimeXp);
  const unlockedRewardIds = Array.isArray(row.unlockedRewardIds)
    ? [...new Set(row.unlockedRewardIds.filter((id): id is string => typeof id === "string"))]
    : [];
  return {
    version: 1,
    balanceXp,
    lifetimeXp,
    streakDays: nonNegativeInt(row.streakDays),
    lastPlayedDate: isIsoDateString(row.lastPlayedDate) ? row.lastPlayedDate : null,
    unlockedRewardIds,
  };
}

/** Adds XP to balance and lifetime; a non-positive amount returns the same reference. */
export function awardXp(ledger: IXpLedger, amountXp: number): IXpLedger {
  if (!Number.isFinite(amountXp) || amountXp <= 0) return ledger;
  const amount = Math.floor(amountXp);
  return {
    ...ledger,
    balanceXp: ledger.balanceXp + amount,
    lifetimeXp: ledger.lifetimeXp + amount,
  };
}

/** Streak bookkeeping for a completed day; same-day calls return the same reference. */
export function recordDailyPlay(ledger: IXpLedger, todayIso: string): IXpLedger {
  if (ledger.lastPlayedDate === todayIso) return ledger;
  const continued = ledger.lastPlayedDate === previousIsoDateLocal(todayIso);
  return {
    ...ledger,
    lastPlayedDate: todayIso,
    streakDays: continued ? ledger.streakDays + 1 : 1,
  };
}

export function isRewardUnlocked(ledger: IXpLedger, rewardId: string): boolean {
  return ledger.unlockedRewardIds.includes(rewardId);
}

/** Spends XP once per reward id; already-unlocked ids cost nothing and return the same ledger. */
export function unlockReward(
  ledger: IXpLedger,
  rewardId: string,
  costXp: number,
): TUnlockRewardResult {
  if (isRewardUnlocked(ledger, rewardId)) {
    return { ok: true, ledger, spentXp: 0, alreadyUnlocked: true };
  }
  const cost = Number.isFinite(costXp) && costXp > 0 ? Math.floor(costXp) : 0;
  if (ledger.balanceXp < cost) {
    return { ok: false, reason: "insufficient", ledger, missingXp: cost - ledger.balanceXp };
  }
  return {
    ok: true,
    ledger: {
      ...ledger,
      balanceXp: ledger.balanceXp - cost,
      unlockedRewardIds: [...ledger.unlockedRewardIds, rewardId],
    },
    spentXp: cost,
    alreadyUnlocked: false,
  };
}
