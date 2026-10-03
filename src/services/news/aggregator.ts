import { ApiError } from './http'
import { SOURCE_LABELS } from './labels'
import { dedupeArticles, sortByNewest } from './normalize'
import type { Article, NewsProvider, ProviderQuery, SourceId } from './types'

export interface SourceFailure {
  sourceId: SourceId
  message: string
}

export interface AggregatedPage {
  articles: Article[]
  /** Sources that failed for this page; the others still rendered. */
  failures: SourceFailure[]
  /** Sources that have another page to offer. Empty once everything is exhausted. */
  pendingSources: SourceId[]
}

export interface NewsService {
  /**
   * Fetches `page` from every requested source in parallel. One source failing
   * only adds to `failures`; the call rejects only when every source failed.
   */
  fetchPage(
    query: ProviderQuery,
    page: number,
    sources: SourceId[],
    signal?: AbortSignal,
  ): Promise<AggregatedPage>
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.'
}

export function createNewsAggregator(providers: NewsProvider[]): NewsService {
  const registry = new Map(providers.map((provider) => [provider.id, provider]))

  return {
    async fetchPage(query, page, sources, signal) {
      const active = sources.flatMap((id) => registry.get(id) ?? [])
      const settled = await Promise.allSettled(
        active.map((provider) => provider.fetchArticles(query, page, signal)),
      )

      const articles: Article[] = []
      const failures: SourceFailure[] = []
      const pendingSources: SourceId[] = []
      settled.forEach((outcome, index) => {
        const sourceId = active[index]!.id
        if (outcome.status === 'rejected') {
          failures.push({ sourceId, message: errorMessage(outcome.reason) })
          return
        }
        articles.push(...outcome.value.articles)
        if (outcome.value.hasMore) pendingSources.push(sourceId)
      })

      if (active.length > 0 && failures.length === active.length) {
        signal?.throwIfAborted()
        const summary = failures
          .map(({ sourceId, message }) => `${SOURCE_LABELS[sourceId]}: ${message}`)
          .join(' ')
        throw new ApiError(`No source could be reached. ${summary}`)
      }

      return { articles: sortByNewest(dedupeArticles(articles)), failures, pendingSources }
    },
  }
}
