import { useEffect, useState } from "react";
import { emptyXpLedger, type IXpLedger } from "./xp-ledger-logic";
import { loadXpLedger, subscribeXpLedger } from "./xp-ledger-store";

/** Live view of the device-local XP ledger; updates when any tab writes it. */
export function useXpLedger(): IXpLedger {
  const [ledger, setLedger] = useState<IXpLedger>(() => emptyXpLedger());
  useEffect(() => {
    let cancelled = false;
    void loadXpLedger().then((loaded) => {
      if (!cancelled) setLedger(loaded);
    });
    const unsubscribe = subscribeXpLedger((next) => {
      if (!cancelled) setLedger(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return ledger;
}
