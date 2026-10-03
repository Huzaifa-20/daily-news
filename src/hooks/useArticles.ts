import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNewsService } from '@/app/newsServiceContext'
import {
  dedupeArticles,
  SOURCE_IDS,
  type ArticleQuery,
  type SourceFailure,
  type SourceId,
} from '@/services/news'

interface PageParam {
  page: number
  /** Only sources that still had results on the previous page are asked again. */
  sources: SourceId[]
}

/** Gives equivalent queries the same cache key, and treats "no sources" as "all sources". */
function normalizeQuery(query: ArticleQuery): ArticleQuery {
  return {
    keyword: query.keyword?.trim() || undefined,
    from: query.from || undefined,
    to: query.to || undefined,
    categories: [...query.categories].sort(),
    sources: query.sources.length > 0 ? [...query.sources].sort() : [...SOURCE_IDS],
  }
}

export function useArticles(query: ArticleQuery) {
  const service = useNewsService()
  const normalized = normalizeQuery(query)

  const result = useInfiniteQuery({
    queryKey: ['articles', normalized],
    queryFn: ({ pageParam, signal }) =>
      service.fetchPage(normalized, pageParam.page, pageParam.sources, signal),
    initialPageParam: { page: 1, sources: normalized.sources } as PageParam,
    getNextPageParam: (lastPage, _allPages, lastParam): PageParam | undefined =>
      lastPage.pendingSources.length > 0
        ? { page: lastParam.page + 1, sources: lastPage.pendingSources }
        : undefined,
    // Keep showing the previous results (dimmed) while a new search loads.
    placeholderData: keepPreviousData,
  })

  const pages = result.data?.pages
  const articles = useMemo(
    () => dedupeArticles(pages?.flatMap((page) => page.articles) ?? []),
    [pages],
  )
  /** The latest failure per source across every loaded page. */
  const failures = useMemo(() => {
    const bySource = new Map<SourceId, SourceFailure>()
    pages?.forEach((page) => page.failures.forEach((f) => bySource.set(f.sourceId, f)))
    return [...bySource.values()]
  }, [pages])

  return { ...result, articles, failures }
}

export type ArticlesResult = ReturnType<typeof useArticles>
