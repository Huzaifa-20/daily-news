import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/services/news'
import { formatShortDate } from '@/utils/date'
import type { SearchFilters } from './searchFilters'

interface ActiveFiltersProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
}

function dateRangeLabel(from?: string, to?: string): string {
  if (from && to) return `${formatShortDate(from)} – ${formatShortDate(to)}`
  return from ? `Since ${formatShortDate(from)}` : `Until ${formatShortDate(to!)}`
}

/** Removable summary of the applied filters; the only view of them on small screens. */
export function ActiveFilters({ filters, onChange, onClear }: ActiveFiltersProps) {
  const items: { key: string; label: string; remove: () => void }[] = []
  if (filters.from || filters.to) {
    items.push({
      key: 'dates',
      label: dateRangeLabel(filters.from, filters.to),
      remove: () => onChange({ from: undefined, to: undefined }),
    })
  }
  if (filters.category) {
    items.push({
      key: 'category',
      label: CATEGORY_LABELS[filters.category],
      remove: () => onChange({ category: undefined }),
    })
  }
  if (filters.sources.length > 0) {
    items.push({
      key: 'sources',
      label: filters.sources.map((source) => SOURCE_LABELS[source]).join(', '),
      remove: () => onChange({ sources: [] }),
    })
  }

  if (items.length === 0) return null

  return (
    <ul aria-label="Active filters" className="-mt-4 mb-8 flex flex-wrap items-center gap-2">
      {items.map(({ key, label, remove }) => (
        <li key={key}>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove filter: ${label}`}
            className="inline-flex items-center gap-2 border border-ink px-3 py-1 text-sm hover:bg-ink hover:text-paper"
          >
            {label}
            <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
      <li>
        <Button variant="link" onClick={onClear} className="ml-1">
          Clear all
        </Button>
      </li>
    </ul>
  )
}
