import {
  CATEGORIES,
  SOURCE_IDS,
  type ArticleQuery,
  type Category,
  type SourceId,
} from '@/services/news'

/** Search state as it lives in the URL, so results are shareable and survive reloads. */
export interface SearchFilters {
  keyword: string
  from?: string
  to?: string
  category?: Category
  /** Empty means every source. */
  sources: SourceId[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isOneOf<T extends string>(options: readonly T[], value: string | null): value is T {
  return value !== null && (options as readonly string[]).includes(value)
}

function validDate(value: string | null): string | undefined {
  return value && ISO_DATE.test(value) ? value : undefined
}

export function parseFilters(params: URLSearchParams): SearchFilters {
  const category = params.get('category')
  const sources = (params.get('sources') ?? '')
    .split(',')
    .filter((source): source is SourceId => isOneOf(SOURCE_IDS, source))
  return {
    keyword: params.get('q') ?? '',
    from: validDate(params.get('from')),
    to: validDate(params.get('to')),
    category: isOneOf(CATEGORIES, category) ? category : undefined,
    sources: sources.length === SOURCE_IDS.length ? [] : sources,
  }
}

export function serializeFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  const entries: [string, string | undefined][] = [
    ['q', filters.keyword.trim()],
    ['from', filters.from],
    ['to', filters.to],
    ['category', filters.category],
    ['sources', filters.sources.join(',')],
  ]
  for (const [key, value] of entries) if (value) params.set(key, value)
  return params
}

export function toArticleQuery(filters: SearchFilters): ArticleQuery {
  return {
    keyword: filters.keyword,
    from: filters.from,
    to: filters.to,
    categories: filters.category ? [filters.category] : [],
    sources: filters.sources,
  }
}

/** Filters beyond the keyword: a date range, a category and a source subset count once each. */
export function countActiveFilters(filters: SearchFilters): number {
  return [filters.from || filters.to, filters.category, filters.sources.length > 0].filter(Boolean)
    .length
}
