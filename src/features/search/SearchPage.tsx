import { useState } from 'react'
import { ArticleResults } from '@/components/articles/ArticleResults'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeading } from '@/components/ui/PageHeading'
import { useArticles } from '@/hooks/useArticles'
import { ActiveFilters } from './ActiveFilters'
import { FilterPanel } from './FilterPanel'
import { countActiveFilters, toArticleQuery } from './searchFilters'
import { useSearchFilters } from './useSearchFilters'

export function SearchPage() {
  const { filters, updateFilters, clearFilters } = useSearchFilters()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const result = useArticles(toArticleQuery(filters))
  const activeCount = countActiveFilters(filters)
  const keyword = filters.keyword.trim()

  const panel = <FilterPanel filters={filters} onChange={updateFilters} onClear={clearFilters} />

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-6">{panel}</div>
      </aside>

      <section className="min-w-0">
        <PageHeading
          kicker={keyword ? 'Search results' : 'Latest news'}
          title={keyword ? `“${keyword}”` : 'All the latest'}
          actions={
            <Button className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
          }
        />
        <ActiveFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />
        <ArticleResults
          result={result}
          empty={
            <EmptyState title="No stories found">
              Try another keyword, widen the date range or include more sources.
            </EmptyState>
          }
        />
      </section>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        {panel}
        <Button variant="solid" className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>
          Show results
        </Button>
      </Drawer>
    </div>
  )
}
