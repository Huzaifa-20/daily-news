import { SOURCE_LABELS, type SourceFailure } from '@/services/news'

/** Partial outages: the other sources' stories still render below. */
export function SourceNotice({ failures }: { failures: SourceFailure[] }) {
  if (failures.length === 0) return null

  return (
    <div role="status" className="mb-8 border-l-4 border-accent bg-paper-deep/70 px-4 py-3 text-sm">
      <p className="kicker text-accent">Wire trouble</p>
      <ul className="mt-1 space-y-0.5">
        {failures.map(({ sourceId, message }) => (
          <li key={sourceId}>
            <strong>{SOURCE_LABELS[sourceId]}</strong> couldn’t be reached: {message}
          </li>
        ))}
      </ul>
    </div>
  )
}
