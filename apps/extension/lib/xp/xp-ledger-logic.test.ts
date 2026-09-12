import { describe, expect, it } from "vitest";
import {
  awardXp,
  coerceXpLedger,
  emptyXpLedger,
  isRewardUnlocked,
  recordDailyPlay,
  unlockReward,
  type IXpLedger,
} from "./xp-ledger-logic";

function ledgerWith(over: Partial<IXpLedger>): IXpLedger {
  return { ...emptyXpLedger(), ...over };
}

describe("coerceXpLedger", () => {
  it("returns an empty ledger for anything that is not an object", () => {
    expect(coerceXpLedger(undefined)).toEqual(emptyXpLedger());
    expect(coerceXpLedger("nope")).toEqual(emptyXpLedger());
    expect(coerceXpLedger([1, 2])).toEqual(emptyXpLedger());
  });

  it("clamps numbers, caps balance at lifetime, dedupes ids, and validates the date", () => {
    expect(
      coerceXpLedger({
        balanceXp: 99.9,
        lifetimeXp: 50,
        streakDays: -3,
        lastPlayedDate: "yesterday",
        unlockedRewardIds: ["a", 7, "a", "b"],
        extra: true,
      }),
    ).toEqual({
      version: 1,
      balanceXp: 50,
      lifetimeXp: 50,
      streakDays: 0,
      lastPlayedDate: null,
      unlockedRewardIds: ["a", "b"],
    });
  });

  it("keeps a valid ledger intact", () => {
    const valid = ledgerWith({
      balanceXp: 20,
      lifetimeXp: 70,
      streakDays: 4,
      lastPlayedDate: "2026-09-10",
      unlockedRewardIds: ["reward-x"],
    });
    expect(coerceXpLedger(valid)).toEqual(valid);
  });
});

describe("awardXp", () => {
  it("adds to balance and lifetime", () => {
    expect(awardXp(emptyXpLedger(), 10)).toMatchObject({ balanceXp: 10, lifetimeXp: 10 });
  });

  it("ignores non-positive or non-finite amounts", () => {
    const ledger = emptyXpLedger();
    expect(awardXp(ledger, 0)).toBe(ledger);
    expect(awardXp(ledger, -5)).toBe(ledger);
    expect(awardXp(ledger, Number.NaN)).toBe(ledger);
  });
});

describe("recordDailyPlay", () => {
  it("starts a streak on the first play", () => {
    expect(recordDailyPlay(emptyXpLedger(), "2026-06-11")).toMatchObject({
      streakDays: 1,
      lastPlayedDate: "2026-06-11",
    });
  });

  it("extends the streak on consecutive days and resets after a gap", () => {
    const yesterday = ledgerWith({ streakDays: 2, lastPlayedDate: "2026-06-10" });
    expect(recordDailyPlay(yesterday, "2026-06-11").streakDays).toBe(3);
    const stale = ledgerWith({ streakDays: 9, lastPlayedDate: "2026-06-01" });
    expect(recordDailyPlay(stale, "2026-06-11").streakDays).toBe(1);
  });

  it("is idempotent within a day", () => {
    const today = ledgerWith({ streakDays: 2, lastPlayedDate: "2026-06-11" });
    expect(recordDailyPlay(today, "2026-06-11")).toBe(today);
  });
});

describe("unlockReward", () => {
  it("spends XP and records the id", () => {
    const result = unlockReward(ledgerWith({ balanceXp: 50, lifetimeXp: 50 }), "reward-a", 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spentXp).toBe(30);
    expect(result.alreadyUnlocked).toBe(false);
    expect(result.ledger.balanceXp).toBe(20);
    expect(result.ledger.lifetimeXp).toBe(50);
    expect(isRewardUnlocked(result.ledger, "reward-a")).toBe(true);
  });

  it("refuses when the balance is short and leaves the ledger untouched", () => {
    const ledger = ledgerWith({ balanceXp: 10, lifetimeXp: 10 });
    const result = unlockReward(ledger, "reward-a", 30);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("insufficient");
    expect(result.missingXp).toBe(20);
    expect(result.ledger).toBe(ledger);
  });

  it("is free the second time", () => {
    const ledger = ledgerWith({ balanceXp: 0, lifetimeXp: 30, unlockedRewardIds: ["reward-a"] });
    const result = unlockReward(ledger, "reward-a", 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spentXp).toBe(0);
    expect(result.alreadyUnlocked).toBe(true);
    expect(result.ledger).toBe(ledger);
  });

  it("treats a non-positive cost as free", () => {
    const result = unlockReward(emptyXpLedger(), "reward-free", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spentXp).toBe(0);
    expect(result.ledger.unlockedRewardIds).toEqual(["reward-free"]);
  });
});
