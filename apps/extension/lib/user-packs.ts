import { unzipSync, strFromU8 } from "fflate";
import type { IImportedUserPack } from "./settings";

export const MAX_ZIP_BYTES = 12 * 1024 * 1024;
export const MAX_MESSAGES = 800;
export const MAX_LINE_LENGTH = 600;

export interface IPackJson {
  id: string;
  name: string;
  version: string;
  messages?: Array<string | { text?: string }>;
  maxIntensityHint?: string;
}

function normalizeMessages(raw: IPackJson["messages"]): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const m of raw) {
    if (typeof m === "string") out.push(m);
    else if (m && typeof m === "object" && typeof m.text === "string") out.push(m.text);
  }
  return out;
}

export function parsePackJsonText(text: string): IImportedUserPack {
  let data: IPackJson;
  try {
    data = JSON.parse(text) as IPackJson;
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!data.id || typeof data.id !== "string") throw new Error("pack.json: missing id");
  if (!data.name || typeof data.name !== "string") throw new Error("pack.json: missing name");
  if (!data.version || typeof data.version !== "string")
    throw new Error("pack.json: missing version");
  const messages = normalizeMessages(data.messages)
    .map((s) => s.trim())
    .filter(Boolean);
  if (messages.length === 0) throw new Error("pack.json: no messages");
  if (messages.length > MAX_MESSAGES) throw new Error(`Too many messages (max ${MAX_MESSAGES})`);
  for (const m of messages) {
    if (m.length > MAX_LINE_LENGTH) throw new Error(`Line too long (max ${MAX_LINE_LENGTH})`);
  }
  return {
    id: data.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
    name: data.name.slice(0, 120),
    version: String(data.version).slice(0, 32),
    enabled: true,
    messages,
    importedAt: Date.now(),
  };
}

export function parseTabocalypseZip(buffer: ArrayBuffer): IImportedUserPack {
  if (buffer.byteLength > MAX_ZIP_BYTES)
    throw new Error(`ZIP too large (max ${MAX_ZIP_BYTES} bytes)`);
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(buffer), { filter: (f) => !f.name.endsWith("/") });
  } catch {
    throw new Error("Invalid ZIP");
  }
  const names = Object.keys(files);
  const packPath =
    names.find((n) => n.toLowerCase() === "pack.json") ??
    names.find((n) => n.toLowerCase().endsWith("/pack.json")) ??
    names.find((n) => n.toLowerCase().endsWith("pack.json"));
  if (!packPath) throw new Error("pack.json not found in ZIP");
  if (names.some((n) => n.toLowerCase().endsWith(".zip")))
    throw new Error("Nested ZIP not allowed");
  const text = strFromU8(files[packPath]!);
  return parsePackJsonText(text);
}

export function estimateImportedBytes(packs: IImportedUserPack[]): number {
  return packs.reduce((acc, p) => acc + JSON.stringify(p).length, 0);
}

export const MAX_TOTAL_IMPORTED_BYTES = 2 * 1024 * 1024;
