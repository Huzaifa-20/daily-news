import type { Article } from '@/services/news'
import { ArticleCard } from './ArticleCard'

interface ArticleGridProps {
  articles: Article[]
  /** Lays the first three stories out as a front page above the column grid. */
  featured?: boolean
}

const FRONT_PAGE_SIZE = 3

export function ArticleGrid({ articles, featured = false }: ArticleGridProps) {
  const showFront = featured && articles.length >= FRONT_PAGE_SIZE
  const [lead, ...secondary] = showFront ? articles.slice(0, FRONT_PAGE_SIZE) : []
  const rest = showFront ? articles.slice(FRONT_PAGE_SIZE) : articles

  return (
    <>
      {lead && (
        <section
          aria-label="Top stories"
          className="grid gap-8 border-b-4 border-double border-ink pb-8 lg:grid-cols-3 lg:gap-0"
        >
          <div className="lg:col-span-2 lg:border-r lg:border-rule lg:pr-8">
            <ArticleCard article={lead} size="lead" />
          </div>
          <div className="flex flex-col divide-y divide-rule border-t border-rule lg:border-t-0 lg:pl-8">
            {secondary.map((article) => (
              <div key={article.id} className="flex-1 py-6 first:pt-6 lg:first:pt-0 last:pb-0">
                <ArticleCard article={article} size="secondary" />
              </div>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <div className="ruled-columns">
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
