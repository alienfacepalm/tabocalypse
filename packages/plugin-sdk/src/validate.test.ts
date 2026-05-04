import { describe, expect, it } from "vitest";
import { validatePluginJsonText } from "./validate";

const minimalValid = `{
  "schemaVersion": 1,
  "id": "test_plugin",
  "name": "Test",
  "version": "1.0.0",
  "widgets": [
    {
      "id": "w1",
      "type": "StaticText",
      "props": { "text": "hello" }
    }
  ]
}`;

describe("validatePluginJsonText", () => {
  it("rejects invalid JSON", () => {
    const r = validatePluginJsonText("{");
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("Invalid JSON");
  });

  it("rejects wrong schemaVersion", () => {
    const r = validatePluginJsonText(
      JSON.stringify({
        schemaVersion: 2,
        id: "x",
        name: "n",
        version: "1",
        widgets: [],
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("accepts a minimal valid plugin", () => {
    const r = validatePluginJsonText(minimalValid);
    expect(r.ok).toBe(true);
    expect(r.plugin?.id).toBe("test_plugin");
    expect(r.plugin?.widgets).toHaveLength(1);
    expect(r.plugin?.widgets[0]?.type).toBe("StaticText");
  });

  it("rejects unknown widget types", () => {
    const r = validatePluginJsonText(
      JSON.stringify({
        schemaVersion: 1,
        id: "x",
        name: "n",
        version: "1",
        widgets: [{ id: "a", type: "EvilEval", props: {} }],
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("widgets[0]"))).toBe(true);
  });

  it("rejects disallowed permissions", () => {
    const r = validatePluginJsonText(
      JSON.stringify({
        schemaVersion: 1,
        id: "x",
        name: "n",
        version: "1",
        permissionsRequested: ["network"],
        widgets: [{ id: "w1", type: "StaticText", props: { text: "t" } }],
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("permissionsRequested"))).toBe(true);
  });

  it('accepts permissionsRequested ["none"]', () => {
    const r = validatePluginJsonText(
      JSON.stringify({
        schemaVersion: 1,
        id: "x",
        name: "n",
        version: "1",
        permissionsRequested: ["none"],
        widgets: [{ id: "w1", type: "StaticText", props: { text: "t" } }],
      }),
    );
    expect(r.ok).toBe(true);
  });
});
