import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      sync: { get: vi.fn(), set: vi.fn() },
      local: { get: vi.fn(), set: vi.fn() },
    },
  },
}));

const { coerceNotes, coerceNotePanels, migrateLegacyNotesTextIntoNotes } =
  await import("./settings");

describe("coerceNotes", () => {
  it("returns empty array for non-array input", () => {
    expect(coerceNotes(null)).toEqual([]);
    expect(coerceNotes(undefined)).toEqual([]);
    expect(coerceNotes("hello")).toEqual([]);
    expect(coerceNotes(42)).toEqual([]);
    expect(coerceNotes({})).toEqual([]);
  });

  it("returns empty array for empty array", () => {
    expect(coerceNotes([])).toEqual([]);
  });

  it("skips items without a valid id", () => {
    const result = coerceNotes([
      { id: "", name: "A", text: "x" },
      { id: "   ", name: "B", text: "y" },
      { name: "C", text: "z" },
      { id: 42, name: "D", text: "w" },
    ]);
    expect(result).toEqual([]);
  });

  it("coerces a valid note with all fields", () => {
    const input = [
      { id: "n1", name: "Work", tags: ["tag1"], text: "hello", createdAt: 1000, updatedAt: 2000 },
    ];
    const result = coerceNotes(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "n1",
      name: "Work",
      tags: ["tag1"],
      text: "hello",
      createdAt: 1000,
      updatedAt: 2000,
    });
  });

  it("defaults missing name to 'Untitled'", () => {
    const result = coerceNotes([{ id: "n1", text: "hello" }]);
    expect(result[0]?.name).toBe("Untitled");
  });

  it("defaults missing text to empty string", () => {
    const result = coerceNotes([{ id: "n1", name: "Note" }]);
    expect(result[0]?.text).toBe("");
  });

  it("filters non-string tags", () => {
    const result = coerceNotes([{ id: "n1", name: "N", tags: ["ok", 42, null, "also-ok"] }]);
    expect(result[0]?.tags).toEqual(["ok", "also-ok"]);
  });

  it("defaults tags to empty array when not an array", () => {
    const result = coerceNotes([{ id: "n1", name: "N", tags: "not-an-array" }]);
    expect(result[0]?.tags).toEqual([]);
  });

  it("assigns current timestamp when createdAt/updatedAt are missing", () => {
    const before = Date.now();
    const result = coerceNotes([{ id: "n1", name: "N" }]);
    const after = Date.now();
    expect(result[0]?.createdAt).toBeGreaterThanOrEqual(before);
    expect(result[0]?.createdAt).toBeLessThanOrEqual(after);
    expect(result[0]?.updatedAt).toBe(result[0]?.createdAt);
  });

  it("uses createdAt as updatedAt default when updatedAt is missing", () => {
    const result = coerceNotes([{ id: "n1", name: "N", createdAt: 5000 }]);
    expect(result[0]?.createdAt).toBe(5000);
    expect(result[0]?.updatedAt).toBe(5000);
  });

  it("rejects non-finite timestamps", () => {
    const before = Date.now();
    const result = coerceNotes([{ id: "n1", name: "N", createdAt: NaN, updatedAt: Infinity }]);
    expect(result[0]?.createdAt).toBeGreaterThanOrEqual(before);
    expect(result[0]?.updatedAt).toBe(result[0]?.createdAt);
  });
});

describe("coerceNotePanels", () => {
  const validIds = new Set(["n1", "n2"]);

  it("returns empty array for non-array input", () => {
    expect(coerceNotePanels(null, validIds)).toEqual([]);
    expect(coerceNotePanels(undefined, validIds)).toEqual([]);
    expect(coerceNotePanels("hello", validIds)).toEqual([]);
  });

  it("skips panels referencing unknown note IDs", () => {
    const result = coerceNotePanels(
      [{ noteId: "unknown", position: { xPct: 0, yPct: 0 } }],
      validIds,
    );
    expect(result).toEqual([]);
  });

  it("skips panels with missing or empty noteId", () => {
    const result = coerceNotePanels(
      [{ noteId: "", position: { xPct: 0, yPct: 0 } }, { position: { xPct: 0, yPct: 0 } }],
      validIds,
    );
    expect(result).toEqual([]);
  });

  it("skips panels without a position object", () => {
    const result = coerceNotePanels([{ noteId: "n1" }, { noteId: "n2", position: null }], validIds);
    expect(result).toEqual([]);
  });

  it("coerces a valid panel", () => {
    const result = coerceNotePanels([{ noteId: "n1", position: { xPct: 10, yPct: 20 } }], validIds);
    expect(result).toEqual([{ noteId: "n1", position: { xPct: 10, yPct: 20 } }]);
  });

  it("preserves optional widthPx and heightPx when positive and finite", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPct: 5, yPct: 5, widthPx: 300, heightPx: 200 } }],
      validIds,
    );
    expect(result[0]?.position.widthPx).toBe(300);
    expect(result[0]?.position.heightPx).toBe(200);
  });

  it("drops non-positive widthPx/heightPx", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPct: 5, yPct: 5, widthPx: 0, heightPx: -10 } }],
      validIds,
    );
    expect(result[0]?.position.widthPx).toBeUndefined();
    expect(result[0]?.position.heightPx).toBeUndefined();
  });

  it("defaults non-finite xPct/yPct to 0", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPct: NaN, yPct: Infinity } }],
      validIds,
    );
    expect(result[0]?.position.xPct).toBe(0);
    expect(result[0]?.position.yPct).toBe(0);
  });
});

describe("migrateLegacyNotesTextIntoNotes", () => {
  it("returns empty array for empty or whitespace-only text", () => {
    expect(migrateLegacyNotesTextIntoNotes("", 1000)).toEqual([]);
    expect(migrateLegacyNotesTextIntoNotes("   ", 1000)).toEqual([]);
    expect(migrateLegacyNotesTextIntoNotes("\n\t", 1000)).toEqual([]);
  });

  it("creates a single note named 'Note' with trimmed text", () => {
    const result = migrateLegacyNotesTextIntoNotes("  My legacy notes  ", 5000);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Note");
    expect(result[0]?.text).toBe("My legacy notes");
    expect(result[0]?.createdAt).toBe(5000);
    expect(result[0]?.updatedAt).toBe(5000);
    expect(result[0]?.tags).toEqual([]);
    expect(result[0]?.id).toBeTruthy();
  });

  it("preserves multiline text (trimmed)", () => {
    const result = migrateLegacyNotesTextIntoNotes("line 1\nline 2\nline 3", 1000);
    expect(result[0]?.text).toBe("line 1\nline 2\nline 3");
  });
});
