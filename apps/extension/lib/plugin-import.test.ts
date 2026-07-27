import { describe, expect, it } from "vitest";
import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import { coerceImportedPlugins, mergeImportedPlugin, removeImportedPlugin } from "./plugin-import";

function makePlugin(overrides: Partial<IImportedPlugin> = {}): IImportedPlugin {
  return {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    enabled: true,
    schemaVersion: 1,
    widgets: [{ id: "w1", type: "StaticText", props: { text: "hi" } }],
    importedAt: Date.now(),
    ...overrides,
  };
}

describe("coerceImportedPlugins", () => {
  it("keeps valid plugins and drops malformed widgets", () => {
    const raw = [
      makePlugin({ id: "good" }),
      {
        id: "mixed",
        name: "Mixed",
        version: "1",
        enabled: true,
        schemaVersion: 1,
        widgets: [
          { id: "ok", type: "StaticText", props: { text: "keep me" } },
          { id: "bad", type: "LinkGrid", props: {} },
        ],
        importedAt: 1,
      },
    ];
    const out = coerceImportedPlugins(raw);
    expect(out.map((p) => p.id)).toEqual(["good", "mixed"]);
    expect(out.find((p) => p.id === "mixed")?.widgets).toEqual([
      { id: "ok", type: "StaticText", props: { text: "keep me" } },
    ]);
  });

  it("returns empty for non-arrays", () => {
    expect(coerceImportedPlugins(null)).toEqual([]);
    expect(coerceImportedPlugins({})).toEqual([]);
  });
});

describe("mergeImportedPlugin", () => {
  it("appends a new plugin to an empty list", () => {
    const plugin = makePlugin({ id: "p1" });
    const result = mergeImportedPlugin([], plugin);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("p1");
  });

  it("appends a new plugin when no existing plugin has the same id", () => {
    const existing = [makePlugin({ id: "p1" })];
    const incoming = makePlugin({ id: "p2" });
    const result = mergeImportedPlugin(existing, incoming);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("replaces an existing plugin with the same id", () => {
    const existing = [makePlugin({ id: "p1", version: "1.0.0" })];
    const incoming = makePlugin({ id: "p1", version: "2.0.0" });
    const result = mergeImportedPlugin(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0]?.version).toBe("2.0.0");
  });

  it("preserves order of other plugins when replacing", () => {
    const existing = [makePlugin({ id: "p1" }), makePlugin({ id: "p2" }), makePlugin({ id: "p3" })];
    const incoming = makePlugin({ id: "p2", version: "9.0.0" });
    const result = mergeImportedPlugin(existing, incoming);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3", "p2"]);
    expect(result.find((p) => p.id === "p2")?.version).toBe("9.0.0");
  });

  it("does not mutate the original array", () => {
    const existing = [makePlugin({ id: "p1" })];
    const copy = [...existing];
    mergeImportedPlugin(existing, makePlugin({ id: "p1", version: "2.0.0" }));
    expect(existing).toEqual(copy);
  });
});

describe("removeImportedPlugin", () => {
  it("removes a plugin by id", () => {
    const existing = [makePlugin({ id: "p1" }), makePlugin({ id: "p2" })];
    const result = removeImportedPlugin(existing, "p1");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("p2");
  });

  it("returns same-length array when id not found", () => {
    const existing = [makePlugin({ id: "p1" })];
    const result = removeImportedPlugin(existing, "nonexistent");
    expect(result).toHaveLength(1);
  });

  it("returns empty array when removing from single-item list", () => {
    const existing = [makePlugin({ id: "p1" })];
    const result = removeImportedPlugin(existing, "p1");
    expect(result).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const existing = [makePlugin({ id: "p1" }), makePlugin({ id: "p2" })];
    const copy = [...existing];
    removeImportedPlugin(existing, "p1");
    expect(existing).toEqual(copy);
  });
});
