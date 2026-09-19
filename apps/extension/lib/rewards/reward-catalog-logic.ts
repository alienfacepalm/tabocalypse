import type { IImportedPlugin, IPluginWidget } from "@tabocalypse/plugin-sdk";
import { validatePluginJsonText } from "@tabocalypse/plugin-sdk";
import type { IXpLedger } from "../xp/xp-ledger-logic";

/**
 * A v1 plugin manifest as bundled in the reward catalog. Structurally compatible with the SDK's
 * `IRawPluginJson`; when the signed envelope (`tabocalypse-signed-pack/1`) ships this object
 * becomes its `payload` and the unlock flow stays the same.
 */
export interface IRewardPluginManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  author?: string;
  widgets: IPluginWidget[];
  permissionsRequested: ["none"];
}

export interface IRewardCatalogEntry {
  /** Equals `plugin.id`; must start with {@link REWARD_PLUGIN_ID_PREFIX}. */
  id: string;
  title: string;
  description: string;
  costXp: number;
  plugin: IRewardPluginManifest;
}

export type TRewardState = "locked" | "unlocked" | "installed";

/** Reward plugins are ordinary imported plugins recognised by id prefix plus catalog membership. */
export const REWARD_PLUGIN_ID_PREFIX = "reward-";

export function findRewardCatalogEntry(
  catalog: readonly IRewardCatalogEntry[],
  id: string,
): IRewardCatalogEntry | undefined {
  return catalog.find((entry) => entry.id === id);
}

export function isRewardPluginId(
  catalog: readonly IRewardCatalogEntry[],
  pluginId: string,
): boolean {
  return (
    pluginId.startsWith(REWARD_PLUGIN_ID_PREFIX) &&
    findRewardCatalogEntry(catalog, pluginId) != null
  );
}

/** Validates through the SDK like any import; throws only if a bundled entry is malformed. */
export function buildRewardPlugin(entry: IRewardCatalogEntry, now: number): IImportedPlugin {
  const result = validatePluginJsonText(JSON.stringify(entry.plugin));
  if (!result.ok || !result.plugin) {
    throw new Error(`Reward "${entry.id}" is not a valid plugin: ${result.errors.join("; ")}`);
  }
  return { ...result.plugin, enabled: true, importedAt: now };
}

export function resolveRewardState(
  entry: IRewardCatalogEntry,
  ledger: IXpLedger,
  importedPlugins: readonly IImportedPlugin[],
): TRewardState {
  if (importedPlugins.some((p) => p.id === entry.id)) return "installed";
  if (ledger.unlockedRewardIds.includes(entry.id)) return "unlocked";
  return "locked";
}

/** Splits stored plugins into user imports and catalog rewards, preserving order. */
export function partitionImportedPlugins(
  catalog: readonly IRewardCatalogEntry[],
  plugins: readonly IImportedPlugin[],
): { user: IImportedPlugin[]; rewards: IImportedPlugin[] } {
  const user: IImportedPlugin[] = [];
  const rewards: IImportedPlugin[] = [];
  for (const plugin of plugins) {
    if (isRewardPluginId(catalog, plugin.id)) rewards.push(plugin);
    else user.push(plugin);
  }
  return { user, rewards };
}
