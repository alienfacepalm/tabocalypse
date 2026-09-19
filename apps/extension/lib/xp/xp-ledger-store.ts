import browser from "webextension-polyfill";
import {
  coerceXpLedger,
  unlockReward,
  type IXpLedger,
  type TUnlockRewardResult,
} from "./xp-ledger-logic";

/** Standalone `storage.local` key (device-only; never part of the settings slices or export). */
export const XP_LEDGER_STORAGE_KEY = "tabocalypseXpLedger";

type TStorageChangeListener = Parameters<typeof browser.storage.onChanged.addListener>[0];

export async function loadXpLedger(): Promise<IXpLedger> {
  const raw = await browser.storage.local.get(XP_LEDGER_STORAGE_KEY);
  return coerceXpLedger(raw[XP_LEDGER_STORAGE_KEY]);
}

/** Reads the ledger fresh from storage, spends XP once, and writes only when something changed. */
export async function unlockRewardInLedger(
  rewardId: string,
  costXp: number,
): Promise<TUnlockRewardResult> {
  const prev = await loadXpLedger();
  const result = unlockReward(prev, rewardId, costXp);
  if (result.ok && result.ledger !== prev) {
    await browser.storage.local.set({ [XP_LEDGER_STORAGE_KEY]: result.ledger });
  }
  return result;
}

/** Fires for ledger writes from any new-tab instance (the settings hydration path ignores this key). */
export function subscribeXpLedger(onChange: (ledger: IXpLedger) => void): () => void {
  const listener: TStorageChangeListener = (changes, areaName) => {
    if (areaName !== "local") return;
    const change = changes[XP_LEDGER_STORAGE_KEY];
    if (!change) return;
    onChange(coerceXpLedger(change.newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
