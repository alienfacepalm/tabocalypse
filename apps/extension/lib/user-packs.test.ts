import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  MAX_LINE_LENGTH,
  MAX_MESSAGES,
  MAX_TOTAL_IMPORTED_BYTES,
  MAX_ZIP_BYTES,
  estimateImportedBytes,
  parsePackJsonText,
  parseTabocalypseZip,
} from "./user-packs";

describe("parsePackJsonText", () => {
  it("accepts a minimal valid pack.json", () => {
    const json = JSON.stringify({
      id: "my-pack",
      name: "My Pack",
      version: "1.0.0",
      messages: ["Hello", { text: "World" }],
    });
    const pack = parsePackJsonText(json);
    expect(pack.id).toBe("my-pack");
    expect(pack.name).toBe("My Pack");
    expect(pack.version).toBe("1.0.0");
    expect(pack.enabled).toBe(true);
    expect(pack.messages).toEqual(["Hello", "World"]);
    expect(typeof pack.importedAt).toBe("number");
  });

  it("sanitizes id and caps string fields", () => {
    const json = JSON.stringify({
      id: "bad/id!".repeat(30),
      name: "x".repeat(200),
      version: "9".repeat(50),
      messages: ["ok"],
    });
    const pack = parsePackJsonText(json);
    expect(pack.id.length).toBeLessThanOrEqual(64);
    expect(pack.name.length).toBe(120);
    expect(pack.version.length).toBe(32);
  });

  it("rejects invalid JSON", () => {
    expect(() => parsePackJsonText("{")).toThrow("Invalid JSON");
  });

  it("rejects missing required fields", () => {
    expect(() => parsePackJsonText("{}")).toThrow("missing id");
    expect(() => parsePackJsonText(JSON.stringify({ id: "x" }))).toThrow("missing name");
    expect(() => parsePackJsonText(JSON.stringify({ id: "x", name: "n" }))).toThrow(
      "missing version",
    );
  });

  it("rejects empty messages", () => {
    expect(() =>
      parsePackJsonText(JSON.stringify({ id: "x", name: "n", version: "1", messages: [] })),
    ).toThrow("no messages");
    expect(() =>
      parsePackJsonText(JSON.stringify({ id: "x", name: "n", version: "1", messages: ["  "] })),
    ).toThrow("no messages");
  });

  it("rejects too many messages", () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) => `m${i}`);
    expect(() =>
      parsePackJsonText(JSON.stringify({ id: "x", name: "n", version: "1", messages })),
    ).toThrow("Too many messages");
  });

  it("rejects a line that is too long", () => {
    const messages = ["x".repeat(MAX_LINE_LENGTH + 1)];
    expect(() =>
      parsePackJsonText(JSON.stringify({ id: "x", name: "n", version: "1", messages })),
    ).toThrow("Line too long");
  });
});

describe("parseTabocalypseZip", () => {
  function uint8ToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  function zipWithPackJson(path: string, packJson: string): ArrayBuffer {
    const bytes = zipSync({ [path]: strToU8(packJson) });
    return uint8ToArrayBuffer(bytes);
  }

  const validPack = JSON.stringify({
    id: "z",
    name: "Z",
    version: "1",
    messages: ["from zip"],
  });

  it("reads pack.json at archive root", () => {
    const buf = zipWithPackJson("pack.json", validPack);
    const pack = parseTabocalypseZip(buf);
    expect(pack.messages).toEqual(["from zip"]);
  });

  it("finds nested pack.json", () => {
    const buf = zipWithPackJson("folder/pack.json", validPack);
    const pack = parseTabocalypseZip(buf);
    expect(pack.id).toBe("z");
  });

  it("rejects ZIP over size limit", () => {
    const huge = new ArrayBuffer(MAX_ZIP_BYTES + 1);
    expect(() => parseTabocalypseZip(huge)).toThrow("ZIP too large");
  });

  it("rejects archive that contains any .zip member (no nested archives)", () => {
    const bytes = zipSync({
      "pack.json": strToU8(validPack),
      "extra.zip": strToU8(""),
    });
    expect(() => parseTabocalypseZip(uint8ToArrayBuffer(bytes))).toThrow("Nested ZIP not allowed");
  });

  it("rejects archive without pack.json", () => {
    const bytes = zipSync({ "readme.txt": strToU8("hi") });
    expect(() => parseTabocalypseZip(uint8ToArrayBuffer(bytes))).toThrow("pack.json not found");
  });

  it("rejects invalid zip bytes", () => {
    const buf = new Uint8Array([0, 1, 2, 3]).buffer as ArrayBuffer;
    expect(() => parseTabocalypseZip(buf)).toThrow("Invalid ZIP");
  });
});

describe("estimateImportedBytes", () => {
  it("sums serialized pack sizes", () => {
    const packs = [
      {
        id: "a",
        name: "A",
        version: "1",
        enabled: true,
        messages: ["x"],
        importedAt: 1,
      },
    ];
    expect(estimateImportedBytes(packs)).toBe(JSON.stringify(packs[0]).length);
    expect(MAX_TOTAL_IMPORTED_BYTES).toBeGreaterThan(0);
  });
});
