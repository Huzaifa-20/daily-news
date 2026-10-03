/**
 * Toggles `item` in a subset where an empty `selected` means "everything".
 * Deselecting the last remaining item is a no-op, and selecting every item
 * collapses back to `[]`.
 */
export function toggleSubset<T>(selected: readonly T[], item: T, all: readonly T[]): T[] {
  const effective = selected.length > 0 ? selected : all
  const next = effective.includes(item)
    ? effective.filter((entry) => entry !== item)
    : [...effective, item]
  if (next.length === 0) return [...selected]
  return next.length === all.length ? [] : next
}

export function isSelected<T>(selected: readonly T[], item: T): boolean {
  return selected.length === 0 || selected.includes(item)
}
