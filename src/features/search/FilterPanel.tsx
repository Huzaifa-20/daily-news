import { useId } from 'react'
import { SourcePicker } from '@/components/filters/SourcePicker'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Fieldset } from '@/components/ui/Fieldset'
import { CATEGORIES, CATEGORY_LABELS, SOURCE_IDS } from '@/services/news'
import { daysAgo, toIsoDate } from '@/utils/date'
import { toggleSubset } from '@/utils/selection'
import { countActiveFilters, type SearchFilters } from './searchFilters'

const DATE_PRESETS: { label: string; days?: number }[] = [
  { label: 'Any time' },
  { label: 'Today', days: 0 },
  { label: 'Past week', days: 7 },
  { label: 'Past month', days: 30 },
]

const DATE_INPUT_CLASS =
  'mt-1 w-full border-b border-ink bg-transparent py-1 text-sm focus:border-accent focus:outline-none'

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
  onClear: () => void
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const id = useId()
  const today = toIsoDate(new Date())
  const isPresetActive = (days?: number) =>
    !filters.to && (days === undefined ? !filters.from : filters.from === daysAgo(days))

  return (
    <div className="@container space-y-8">
      <Fieldset legend="Date">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(({ label, days }) => (
            <Chip
              key={label}
              pressed={isPresetActive(days)}
              onClick={() =>
                onChange({ from: days === undefined ? undefined : daysAgo(days), to: undefined })
              }
            >
              {label}
            </Chip>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 @[18rem]:grid-cols-2">
          <label className="kicker text-ink-soft">
            From
            <input
              type="date"
              value={filters.from ?? ''}
              max={filters.to ?? today}
              onChange={(event) => onChange({ from: event.target.value || undefined })}
              className={DATE_INPUT_CLASS}
            />
          </label>
          <label className="kicker text-ink-soft">
            To
            <input
              type="date"
              value={filters.to ?? ''}
              min={filters.from}
              max={today}
              onChange={(event) => onChange({ to: event.target.value || undefined })}
              className={DATE_INPUT_CLASS}
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset legend="Category">
        <ul className="space-y-2">
          {[undefined, ...CATEGORIES].map((category) => (
            <li key={category ?? 'all'}>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name={`${id}-category`}
                  checked={filters.category === category}
                  onChange={() => onChange({ category })}
                  className="size-4 accent-ink"
                />
                {category ? CATEGORY_LABELS[category] : 'All categories'}
              </label>
            </li>
          ))}
        </ul>
      </Fieldset>

      <Fieldset legend="Sources">
        <SourcePicker
          selected={filters.sources}
          onToggle={(source) =>
            onChange({ sources: toggleSubset(filters.sources, source, SOURCE_IDS) })
          }
        />
      </Fieldset>

      <Button variant="link" onClick={onClear} disabled={countActiveFilters(filters) === 0}>
        Clear filters
      </Button>
    </div>
  )
}
