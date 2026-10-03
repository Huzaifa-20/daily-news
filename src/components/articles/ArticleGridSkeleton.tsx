const PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index)

export function ArticleGridSkeleton() {
  return (
    <div role="status" aria-label="Loading stories" className="ruled-columns">
      <ol className="grid animate-pulse grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDERS.map((index) => (
          <li key={index} aria-hidden="true">
            <div className="aspect-[3/2] bg-ink/10" />
            <div className="mt-4 h-3 w-1/3 bg-accent/20" />
            <div className="mt-3 h-5 w-11/12 bg-ink/15" />
            <div className="mt-2 h-5 w-3/4 bg-ink/15" />
            <div className="mt-4 h-3 w-full bg-ink/10" />
            <div className="mt-2 h-3 w-5/6 bg-ink/10" />
          </li>
        ))}
      </ol>
    </div>
  )
}
