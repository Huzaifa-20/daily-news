const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })

/** ["A", "B", "C"] -> "A, B, and C" */
export function joinList(items: string[]): string {
  return listFormatter.format(items)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
