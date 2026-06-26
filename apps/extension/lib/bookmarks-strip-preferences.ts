export type TBookmarksStripItem = {
  id: string;
  title?: string;
  url?: string;
};

const MAX_BOOKMARK_STRIP_IDS = 256;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeBookmarksStripItem(raw: unknown): TBookmarksStripItem | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { id?: unknown; title?: unknown; url?: unknown };
  if (!isNonEmptyString(record.id)) return null;
  const item: TBookmarksStripItem = { id: record.id.trim() };
  if (typeof record.title === "string" && record.title.trim().length > 0) {
    item.title = record.title;
  }
  if (typeof record.url === "string" && record.url.trim().length > 0) {
    item.url = record.url;
  }
  return item;
}

/** Coerce stored bookmark id lists (custom order). */
export function coerceBookmarksStripIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isNonEmptyString(item)) continue;
    const id = item.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_BOOKMARK_STRIP_IDS) break;
  }
  return out;
}

/** Coerce hidden bookmark entries saved by the extension (not browser bookmarks). */
export function coerceBookmarksStripHidden(
  raw: unknown,
  legacyHiddenIds?: unknown,
): TBookmarksStripItem[] {
  const out: TBookmarksStripItem[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const normalized = normalizeBookmarksStripItem(item);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      out.push(normalized);
      if (out.length >= MAX_BOOKMARK_STRIP_IDS) break;
    }
  }
  if (out.length === 0) {
    for (const id of coerceBookmarksStripIdList(legacyHiddenIds)) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id });
    }
  }
  return out;
}

export function bookmarksStripHiddenIds(hidden: readonly TBookmarksStripItem[]): string[] {
  return hidden.map((item) => item.id);
}

function applyCustomOrder<T extends { id: string }>(
  items: readonly T[],
  orderIds: readonly string[],
): T[] {
  if (items.length < 2 || orderIds.length === 0) return [...items];

  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  const used = new Set<string>();

  for (const id of orderIds) {
    const item = byId.get(id);
    if (!item || used.has(id)) continue;
    ordered.push(item);
    used.add(id);
  }

  for (const item of items) {
    if (!used.has(item.id)) ordered.push(item);
  }

  return ordered;
}

/** Drop hidden bookmarks, then apply custom top-to-bottom order. */
export function applyBookmarksStripPreferences<T extends { id: string }>(
  items: readonly T[],
  hidden: readonly TBookmarksStripItem[],
  orderIds: readonly string[],
): T[] {
  const hiddenIdSet = new Set(bookmarksStripHiddenIds(hidden));
  const visible = items.filter((item) => !hiddenIdSet.has(item.id));
  return applyCustomOrder(visible, orderIds);
}

export function hideBookmarksStripBookmark(
  hidden: readonly TBookmarksStripItem[],
  orderIds: readonly string[],
  bookmark: TBookmarksStripItem,
): { hidden: TBookmarksStripItem[]; orderIds: string[] } {
  const hiddenList = coerceBookmarksStripHidden(hidden);
  const nextHidden = hiddenList.some((item) => item.id === bookmark.id)
    ? hiddenList
    : [...hiddenList, bookmark];
  return {
    hidden: nextHidden,
    orderIds: orderIds.filter((id) => id !== bookmark.id),
  };
}

export function unhideBookmarksStripBookmark(
  hidden: readonly TBookmarksStripItem[],
  bookmarkId: string,
): TBookmarksStripItem[] {
  return coerceBookmarksStripHidden(hidden).filter((item) => item.id !== bookmarkId);
}

export function reorderBookmarksStripVisibleIds(
  visibleIds: readonly string[],
  orderIds: readonly string[],
  bookmarkId: string,
  direction: "up" | "down",
): string[] {
  const ordered = applyCustomOrder(
    visibleIds.map((id) => ({ id })),
    orderIds,
  ).map((item) => item.id);
  const index = ordered.indexOf(bookmarkId);
  if (index < 0) return [...orderIds];
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= ordered.length) return [...orderIds];
  const next = [...ordered];
  [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  return coerceBookmarksStripIdList(next);
}

export function moveBookmarksStripOrderEntry(
  orderIds: readonly string[],
  bookmarkId: string,
  direction: "up" | "down",
): string[] {
  return reorderBookmarksStripVisibleIds(orderIds, orderIds, bookmarkId, direction);
}

export function clearBookmarksStripOrder(): string[] {
  return [];
}
