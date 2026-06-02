import { describe, expect, it, vi } from "vitest";
import type { INote } from "./settings";

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      sync: { get: vi.fn(), set: vi.fn() },
      local: { get: vi.fn(), set: vi.fn() },
    },
  },
}));

const {
  coerceNotes,
  coerceNotePanels,
  clampStickyNoteSize,
  migrateLegacyNotesTextIntoNotes,
  applyNotePersistPatch,
  mergeNotesPreferNewerBaseline,
  mergeNotePanelsForStorageReload,
  isNoteActive,
  deriveNoteTitle,
} = await import("./settings");

describe("deriveNoteTitle", () => {
  it("returns Empty note for blank text", () => {
    expect(deriveNoteTitle("")).toBe("Empty note");
    expect(deriveNoteTitle("   \n  ")).toBe("Empty note");
    expect(deriveNoteTitle(undefined)).toBe("Empty note");
    expect(deriveNoteTitle(null)).toBe("Empty note");
  });

  it("uses the first non-empty line", () => {
    expect(deriveNoteTitle("\n\nBuy milk tomorrow")).toBe("Buy milk tomorrow");
  });

  it("keeps short single-line text as-is", () => {
    expect(deriveNoteTitle("Hello world")).toBe("Hello world");
  });

  it("truncates to the first few words with an ellipsis", () => {
    expect(deriveNoteTitle("one two three four five six seven eight")).toBe(
      "one two three four five six…",
    );
  });

  it("adds an ellipsis when more lines follow", () => {
    expect(deriveNoteTitle("Meeting notes\nAction items")).toBe("Meeting notes…");
  });
});

describe("isNoteActive", () => {
  it("returns true when the note id is in notePanels", () => {
    expect(
      isNoteActive("n1", [
        { noteId: "n1", position: { xPx: 0, yPx: 0, widthPx: 200, heightPx: 160 } },
      ]),
    ).toBe(true);
  });

  it("returns false when the note id is not in notePanels", () => {
    expect(
      isNoteActive("n2", [
        { noteId: "n1", position: { xPx: 0, yPx: 0, widthPx: 200, heightPx: 160 } },
      ]),
    ).toBe(false);
  });
});

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
      locked: false,
      createdAt: 1000,
      updatedAt: 2000,
    });
  });

  it("coerces locked true when set", () => {
    const result = coerceNotes([
      { id: "n1", name: "W", tags: [], text: "", locked: true, createdAt: 1, updatedAt: 2 },
    ]);
    expect(result[0]?.locked).toBe(true);
  });

  it("defaults locked to false when absent or not true", () => {
    expect(coerceNotes([{ id: "n1", name: "W", text: "" }])[0]?.locked).toBe(false);
    expect(coerceNotes([{ id: "n1", name: "W", text: "", locked: false }])[0]?.locked).toBe(false);
    expect(coerceNotes([{ id: "n1", name: "W", text: "", locked: "yes" }])[0]?.locked).toBe(false);
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

describe("applyNotePersistPatch", () => {
  const baseNote: INote = {
    id: "n1",
    name: "A",
    tags: [],
    text: "hello",
    locked: false,
    createdAt: 10,
    updatedAt: 10,
  };

  it("rejects non-unlock patches on a locked note", () => {
    const locked = { ...baseNote, locked: true };
    expect(applyNotePersistPatch(locked, { text: "x" }, 99)).toBeNull();
    expect(applyNotePersistPatch(locked, { name: "B" }, 99)).toBeNull();
    expect(applyNotePersistPatch(locked, { locked: true }, 99)).toBeNull();
  });

  it("allows only explicit unlock on a locked note", () => {
    const locked = { ...baseNote, locked: true };
    expect(applyNotePersistPatch(locked, { locked: false }, 99)).toEqual({
      ...locked,
      locked: false,
      updatedAt: 99,
    });
  });

  it("allows edits and lock toggles on an unlocked note", () => {
    expect(applyNotePersistPatch(baseNote, { text: "next" }, 20)?.text).toBe("next");
    expect(applyNotePersistPatch(baseNote, { locked: true }, 20)?.locked).toBe(true);
  });
});

describe("mergeNotesPreferNewerBaseline", () => {
  const mk = (id: string, text: string, updatedAt: number): INote => ({
    id,
    name: "N",
    tags: [],
    text,
    locked: false,
    createdAt: 1,
    updatedAt,
  });

  it("keeps baseline note when baseline updatedAt is newer", () => {
    const baseline = [mk("a", "typing", 200)];
    const incoming = [mk("a", "stale", 100)];
    expect(mergeNotesPreferNewerBaseline(baseline, incoming)).toEqual(baseline);
  });

  it("accepts incoming when incoming updatedAt is newer", () => {
    const baseline = [mk("a", "local", 100)];
    const incoming = [mk("a", "from disk", 200)];
    expect(mergeNotesPreferNewerBaseline(baseline, incoming)).toEqual(incoming);
  });

  it("prefers baseline on equal updatedAt so ties do not regress local keystrokes", () => {
    const baseline = [mk("a", "baa", 100)];
    const incoming = [mk("a", "bar", 100)];
    expect(mergeNotesPreferNewerBaseline(baseline, incoming)[0]?.text).toBe("baa");
  });

  it("preserves incoming order then appends baseline-only notes", () => {
    const baseline = [mk("x", "local only", 50), mk("y", "", 60)];
    const incoming = [mk("y", "y disk", 30)];
    const merged = mergeNotesPreferNewerBaseline(baseline, incoming);
    expect(merged.map((n) => n.id)).toEqual(["y", "x"]);
    expect(merged.find((n) => n.id === "y")?.text).toBe("");
    expect(merged.find((n) => n.id === "x")).toEqual(mk("x", "local only", 50));
  });
});

describe("mergeNotePanelsForStorageReload", () => {
  const pos = { xPx: 120, yPx: 40, widthPx: 260, heightPx: 220 };
  const ids = () => new Set(["n1"]);

  it("prefers baseline when baseline epoch is higher (stale disk omits open panel)", () => {
    expect(
      mergeNotePanelsForStorageReload([{ noteId: "n1", position: pos }], [], 5, 0, ids()),
    ).toEqual([{ noteId: "n1", position: pos }]);
  });

  it("prefers incoming when incoming epoch is higher", () => {
    expect(
      mergeNotePanelsForStorageReload([], [{ noteId: "n1", position: pos }], 0, 3, ids()),
    ).toEqual([{ noteId: "n1", position: pos }]);
  });

  it("prefers baseline position when epochs tie", () => {
    const basePos = { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 };
    const diskPos = { xPx: 900, yPx: 800, widthPx: 260, heightPx: 220 };
    expect(
      mergeNotePanelsForStorageReload(
        [{ noteId: "n1", position: basePos }],
        [{ noteId: "n1", position: diskPos }],
        1,
        1,
        ids(),
      ),
    ).toEqual([{ noteId: "n1", position: basePos }]);
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
      [
        {
          noteId: "unknown",
          position: { xPx: 0, yPx: 0, widthPx: 260, heightPx: 220 },
        },
      ],
      validIds,
    );
    expect(result).toEqual([]);
  });

  it("skips panels with missing or empty noteId", () => {
    const result = coerceNotePanels(
      [
        { noteId: "", position: { xPx: 0, yPx: 0, widthPx: 260, heightPx: 220 } },
        { position: { xPx: 0, yPx: 0, widthPx: 260, heightPx: 220 } },
      ],
      validIds,
    );
    expect(result).toEqual([]);
  });

  it("skips panels without a position object", () => {
    const result = coerceNotePanels([{ noteId: "n1" }, { noteId: "n2", position: null }], validIds);
    expect(result).toEqual([]);
  });

  it("coerces a valid panel with pixel position", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 } }],
      validIds,
    );
    expect(result).toEqual([
      { noteId: "n1", position: { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 } },
    ]);
  });

  it("coerces pinned when true", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 }, pinned: true }],
      validIds,
    );
    expect(result).toEqual([
      {
        noteId: "n1",
        position: { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 },
        pinned: true,
      },
    ]);
  });

  it("omits pinned when false or absent", () => {
    const result = coerceNotePanels(
      [
        {
          noteId: "n1",
          position: { xPx: 10, yPx: 20, widthPx: 260, heightPx: 220 },
          pinned: false,
        },
      ],
      validIds,
    );
    expect(result[0]?.pinned).toBeUndefined();
  });

  it("migrates legacy xPct/yPct to fixed pixels", () => {
    const result = coerceNotePanels([{ noteId: "n1", position: { xPct: 70, yPct: 2 } }], validIds);
    expect(result).toEqual([
      {
        noteId: "n1",
        position: { xPx: 840, yPx: 16, widthPx: 260, heightPx: 220 },
      },
    ]);
  });

  it("preserves optional widthPx and heightPx when positive and finite", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPct: 5, yPct: 5, widthPx: 300, heightPx: 200 } }],
      validIds,
    );
    expect(result[0]?.position.widthPx).toBe(300);
    expect(result[0]?.position.heightPx).toBe(200);
  });

  it("drops non-positive widthPx/heightPx and uses defaults", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPx: 5, yPx: 5, widthPx: 0, heightPx: -10 } }],
      validIds,
    );
    expect(result[0]?.position.widthPx).toBe(260);
    expect(result[0]?.position.heightPx).toBe(220);
  });

  it("defaults non-finite legacy xPct/yPct to origin", () => {
    const result = coerceNotePanels(
      [{ noteId: "n1", position: { xPct: NaN, yPct: Infinity } }],
      validIds,
    );
    expect(result[0]?.position.xPx).toBe(0);
    expect(result[0]?.position.yPx).toBe(0);
  });
});

describe("clampStickyNoteSize", () => {
  it("clamps to min and max bounds", () => {
    expect(clampStickyNoteSize(50, 50)).toEqual({ widthPx: 180, heightPx: 140 });
    expect(clampStickyNoteSize(900, 900)).toEqual({ widthPx: 640, heightPx: 720 });
  });

  it("caps size to remaining canvas space from origin", () => {
    expect(
      clampStickyNoteSize(400, 400, { canvasW: 500, canvasH: 400, xPx: 300, yPx: 100 }),
    ).toEqual({ widthPx: 200, heightPx: 300 });
  });
});

describe("migrateLegacyNotesTextIntoNotes", () => {
  it("returns empty array for empty or whitespace-only text", () => {
    expect(migrateLegacyNotesTextIntoNotes("", 1000)).toEqual([]);
    expect(migrateLegacyNotesTextIntoNotes("   ", 1000)).toEqual([]);
    expect(migrateLegacyNotesTextIntoNotes("\n\t", 1000)).toEqual([]);
  });

  it("creates a single note with trimmed text and an empty legacy name", () => {
    const result = migrateLegacyNotesTextIntoNotes("  My legacy notes  ", 5000);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("");
    expect(result[0]?.text).toBe("My legacy notes");
    expect(result[0]?.createdAt).toBe(5000);
    expect(result[0]?.updatedAt).toBe(5000);
    expect(result[0]?.tags).toEqual([]);
    expect(result[0]?.id).toBeTruthy();
    expect(result[0]?.locked).toBe(false);
  });

  it("preserves multiline text (trimmed)", () => {
    const result = migrateLegacyNotesTextIntoNotes("line 1\nline 2\nline 3", 1000);
    expect(result[0]?.text).toBe("line 1\nline 2\nline 3");
  });
});
