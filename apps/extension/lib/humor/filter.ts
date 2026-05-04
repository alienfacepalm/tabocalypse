/**
 * Minimal hard filter for **builtin** content only. Not exhaustive; packs are curated.
 */
const DENY_SUBSTRINGS = ["child porn", "cp ", "rape", "kill yourself", "kys", "nazi", "hitler"];

export function passesBuiltinHardFilter(line: string): boolean {
  const lower = line.toLowerCase();
  return !DENY_SUBSTRINGS.some((s) => lower.includes(s));
}
