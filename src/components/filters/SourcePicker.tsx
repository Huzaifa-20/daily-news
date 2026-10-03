import { SOURCE_IDS, SOURCE_LABELS, type SourceId } from '@/services/news'
import { isSelected } from '@/utils/selection'

interface SourcePickerProps {
  /** Empty means every source. */
  selected: SourceId[]
  onToggle: (source: SourceId) => void
}

export function SourcePicker({ selected, onToggle }: SourcePickerProps) {
  const checkedCount = SOURCE_IDS.filter((source) => isSelected(selected, source)).length

  return (
    <ul className="space-y-2">
      {SOURCE_IDS.map((source) => {
        const checked = isSelected(selected, source)
        return (
          <li key={source}>
            <label className="flex cursor-pointer items-center gap-2.5 has-disabled:cursor-not-allowed">
              <input
                type="checkbox"
                checked={checked}
                // At least one source has to stay on.
                disabled={checked && checkedCount === 1}
                onChange={() => onToggle(source)}
                className="size-4 accent-ink"
              />
              {SOURCE_LABELS[source]}
            </label>
          </li>
        )
      })}
    </ul>
  )
}
