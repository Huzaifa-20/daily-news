import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ArticlesResult } from '@/hooks/useArticles'
import type { Article } from '@/services/news'
import { ArticleGrid } from './ArticleGrid'
import { ArticleGridSkeleton } from './ArticleGridSkeleton'
import { SourceNotice } from './SourceNotice'

interface ArticleResultsProps {
  result: ArticlesResult
  /** The list to show when the page reorders or filters `result.articles`. */
  articles?: Article[]
  featured?: boolean
  empty: ReactNode
}

/** Loading, error, empty and paging states shared by every article list. */
export function ArticleResults({
  result,
  articles = result.articles,
  featured,
  empty,
}: ArticleResultsProps) {
  if (result.isPending) return <ArticleGridSkeleton />

  if (result.isError) {
    return (
      <EmptyState
        title="Stop the presses!"
        action={<Button onClick={() => result.refetch()}>Try again</Button>}
      >
        {result.error.message}
      </EmptyState>
    )
  }

  return (
    <div
      aria-busy={result.isFetching}
      className={`transition-opacity ${result.isPlaceholderData ? 'opacity-50' : ''}`}
    >
      <p className="sr-only" aria-live="polite">
        {articles.length} stories shown
      </p>
      <SourceNotice failures={result.failures} />

      {articles.length === 0 ? empty : <ArticleGrid articles={articles} featured={featured} />}

      <div className="mt-10 flex justify-center">
        {result.hasNextPage ? (
          <Button
            onClick={() => result.fetchNextPage()}
            disabled={result.isFetchingNextPage || result.isPlaceholderData}
          >
            {result.isFetchingNextPage ? 'Fetching more…' : 'More stories'}
          </Button>
        ) : (
          articles.length > 0 && (
            <p className="end-mark kicker w-full">
              <span aria-hidden="true">-30-</span>
              <span className="sr-only">End of stories</span>
            </p>
          )
        )}
      </div>
    </div>
  )
}
