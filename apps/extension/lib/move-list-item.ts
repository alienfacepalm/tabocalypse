/** Returns a copy of `list` with the item at `from` moved to `to` (both clamped); same order → same items. */
export function moveListItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  if (from < 0 || from >= out.length) return out;
  const target = Math.min(Math.max(to, 0), out.length - 1);
  if (target === from) return out;
  const [item] = out.splice(from, 1);
  out.splice(target, 0, item as T);
  return out;
}

/** Reorders `list` to follow `orderedIds`; items missing from `orderedIds` keep their relative order at the end. */
export function orderListByIds<T>(
  list: readonly T[],
  orderedIds: readonly string[],
  idOf: (item: T) => string,
): T[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return [...list].sort(
    (a, b) =>
      (rank.get(idOf(a)) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(idOf(b)) ?? Number.MAX_SAFE_INTEGER),
  );
}
