import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import { validatePluginJsonText } from "@tabocalypse/plugin-sdk";
import { describe, expect, it } from "vitest";
import { emptyXpLedger } from "../xp/xp-ledger-logic";
import { REWARD_CATALOG } from "./reward-catalog";
import {
  REWARD_PLUGIN_ID_PREFIX,
  buildRewardPlugin,
  findRewardCatalogEntry,
  isRewardPluginId,
  partitionImportedPlugins,
  resolveRewardState,
} from "./reward-catalog-logic";

const ALLOWED_WIDGET_TYPES = new Set(["StaticText", "RotatingQuotes", "LinkGrid"]);

function plugin(id: string): IImportedPlugin {
  return {
    id,
    name: id,
    version: "1",
    enabled: true,
    schemaVersion: 1,
    widgets: [],
    importedAt: 0,
  };
}

describe("REWARD_CATALOG", () => {
  it("contains only valid, warning-free v1 plugins with stable reward ids", () => {
    const ids = new Set<string>();
    for (const entry of REWARD_CATALOG) {
      expect(entry.id.startsWith(REWARD_PLUGIN_ID_PREFIX)).toBe(true);
      expect(entry.id).toBe(entry.plugin.id);
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(Number.isInteger(entry.costXp) && entry.costXp > 0).toBe(true);
      expect(entry.plugin.permissionsRequested).toEqual(["none"]);
      for (const w of entry.plugin.widgets) expect(ALLOWED_WIDGET_TYPES.has(w.type)).toBe(true);

      const result = validatePluginJsonText(JSON.stringify(entry.plugin));
      expect(result.ok).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.plugin?.id).toBe(entry.id);
      expect(result.plugin?.widgets).toHaveLength(entry.plugin.widgets.length);
    }
  });

  it("uses https links without tracking parameters", () => {
    for (const entry of REWARD_CATALOG) {
      for (const w of entry.plugin.widgets) {
        if (w.type !== "LinkGrid") continue;
        const links = w.props.links as { url: string }[];
        for (const link of links) {
          expect(link.url.startsWith("https://")).toBe(true);
          expect(link.url).not.toMatch(/utm_|ref=|affiliate/i);
        }
      }
    }
  });

  it("is priced so the cheapest reward is reachable on day one", () => {
    const cheapest = Math.min(...REWARD_CATALOG.map((e) => e.costXp));
    expect(cheapest).toBeLessThanOrEqual(35);
  });
});

describe("buildRewardPlugin", () => {
  it("returns an enabled plugin stamped with the install time", () => {
    const entry = REWARD_CATALOG[0];
    expect(entry).toBeDefined();
    if (!entry) return;
    const built = buildRewardPlugin(entry, 1234);
    expect(built.id).toBe(entry.id);
    expect(built.enabled).toBe(true);
    expect(built.importedAt).toBe(1234);
  });

  it("throws for a malformed entry", () => {
    expect(() =>
      buildRewardPlugin(
        {
          id: "reward-bad",
          title: "Bad",
          description: "",
          costXp: 1,
          plugin: {
            schemaVersion: 1,
            id: "reward-bad",
            name: "",
            version: "1",
            widgets: [],
            permissionsRequested: ["none"],
          },
        },
        0,
      ),
    ).toThrow(/reward-bad/);
  });
});

describe("resolveRewardState", () => {
  it("prefers installed over unlocked over locked", () => {
    const entry = REWARD_CATALOG[0];
    expect(entry).toBeDefined();
    if (!entry) return;
    const ledger = emptyXpLedger();
    expect(resolveRewardState(entry, ledger, [])).toBe("locked");
    const unlocked = { ...ledger, unlockedRewardIds: [entry.id] };
    expect(resolveRewardState(entry, unlocked, [])).toBe("unlocked");
    expect(resolveRewardState(entry, unlocked, [plugin(entry.id)])).toBe("installed");
    expect(resolveRewardState(entry, ledger, [plugin(entry.id)])).toBe("installed");
  });
});

describe("isRewardPluginId / partitionImportedPlugins", () => {
  it("requires the prefix and catalog membership", () => {
    const first = REWARD_CATALOG[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(isRewardPluginId(REWARD_CATALOG, first.id)).toBe(true);
    expect(isRewardPluginId(REWARD_CATALOG, "reward-not-in-catalog")).toBe(false);
    expect(isRewardPluginId(REWARD_CATALOG, "my-plugin")).toBe(false);
    expect(findRewardCatalogEntry(REWARD_CATALOG, "nope")).toBeUndefined();
  });

  it("splits plugins while preserving order", () => {
    const first = REWARD_CATALOG[0];
    expect(first).toBeDefined();
    if (!first) return;
    const list = [plugin("a"), plugin(first.id), plugin("reward-not-in-catalog"), plugin("b")];
    const { user, rewards } = partitionImportedPlugins(REWARD_CATALOG, list);
    expect(user.map((p) => p.id)).toEqual(["a", "reward-not-in-catalog", "b"]);
    expect(rewards.map((p) => p.id)).toEqual([first.id]);
  });
});
