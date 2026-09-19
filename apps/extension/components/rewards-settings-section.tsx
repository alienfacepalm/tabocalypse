import React, { useState } from "react";
import { mergeImportedPlugin } from "../lib/plugin-import";
import { REWARD_CATALOG } from "../lib/rewards/reward-catalog";
import {
  buildRewardPlugin,
  resolveRewardState,
  type IRewardCatalogEntry,
} from "../lib/rewards/reward-catalog-logic";
import { useXpLedger } from "../lib/xp/use-xp-ledger";
import { unlockRewardInLedger } from "../lib/xp/xp-ledger-store";
import { PanelTip, usePanelPersist, usePanelSettings, usePanelToast } from "./panel-sdk";

/**
 * Settings › Rewards: spend device-local quiz XP on bundled reward widgets. Unlocking writes the
 * ledger first, then installs the reward as an ordinary imported plugin; a failed install leaves
 * the reward unlocked so the retry is free.
 */
export function RewardsSettingsSection({
  quizWidgetOn,
  onOpenWidgetsSettings,
  onOpenManageImports,
}: {
  quizWidgetOn: boolean;
  onOpenWidgetsSettings: () => void;
  onOpenManageImports: () => void;
}): React.JSX.Element {
  const s = usePanelSettings();
  const persist = usePanelPersist();
  const { showToast } = usePanelToast();
  const ledger = useXpLedger();
  const [busyId, setBusyId] = useState<string | null>(null);

  const unlock = async (entry: IRewardCatalogEntry): Promise<void> => {
    setBusyId(entry.id);
    try {
      const result = await unlockRewardInLedger(entry.id, entry.costXp);
      if (!result.ok) {
        showToast({
          message: `Need ${result.missingXp} more XP to unlock "${entry.title}".`,
          variant: "warn",
        });
        return;
      }
      const plugin = buildRewardPlugin(entry, Date.now());
      const saved = await persist((cur) => ({
        ...cur,
        importedPlugins: mergeImportedPlugin(cur.importedPlugins, plugin),
      }));
      if (!saved) {
        showToast({
          message: `Could not install "${entry.title}". It stays unlocked, so try Install again.`,
          variant: "error",
        });
        return;
      }
      showToast({
        message: result.alreadyUnlocked
          ? `Reinstalled "${entry.title}" (already unlocked).`
          : `Unlocked "${entry.title}" for ${result.spentXp} XP.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Could not install that reward.",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <p className="muted sm mb-1 mt-0">
        {ledger.balanceXp} XP available · {ledger.lifetimeXp} earned · {ledger.streakDays}-day
        streak
      </p>
      <p className="muted sm mb-3 mt-0">
        Earn XP in the Daily quiz widget. Rewards install as plugin widgets on this device. No
        account; nothing is sent anywhere.
      </p>
      {!quizWidgetOn ? (
        <button type="button" className="linkish mb-3 text-xs" onClick={onOpenWidgetsSettings}>
          Turn on the Daily quiz widget
        </button>
      ) : null}
      <ul className="reward-list">
        {REWARD_CATALOG.map((entry) => {
          const state = resolveRewardState(entry, ledger, s.importedPlugins);
          const affordable = ledger.balanceXp >= entry.costXp;
          const busy = busyId !== null;
          const tip =
            state === "unlocked"
              ? "Already unlocked; installing again costs nothing"
              : affordable
                ? `Spend ${entry.costXp} XP and add this widget to the plugin deck`
                : `Need ${entry.costXp - ledger.balanceXp} more XP`;
          return (
            <li key={entry.id} className="reward-row">
              <div className="min-w-0 flex-1">
                <p className="m-0 font-medium">{entry.title}</p>
                <p className="muted sm m-0">{entry.description}</p>
              </div>
              <span className="reward-cost">
                {state === "locked"
                  ? `${entry.costXp} XP`
                  : state === "unlocked"
                    ? "Unlocked"
                    : "Installed"}
              </span>
              {state === "installed" ? (
                <button type="button" className="linkish text-xs" onClick={onOpenManageImports}>
                  Manage
                </button>
              ) : (
                <PanelTip tip={tip}>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={busy || (state === "locked" && !affordable)}
                    onClick={() => void unlock(entry)}
                  >
                    {state === "unlocked" ? "Install (free)" : "Unlock"}
                  </button>
                </PanelTip>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
