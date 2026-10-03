export const SOURCE_IDS = ['guardian', 'nyt', 'newsapi'] as const
export type SourceId = (typeof SOURCE_IDS)[number]

export const CATEGORIES = [
  'business',
  'entertainment',
  'health',
  'science',
  'sports',
  'technology',
] as const
export type Category = (typeof CATEGORIES)[number]

/** Provider-agnostic article shape every adapter normalises into. */
export interface Article {
  id: string
  url: string
  title: string
  description: string
  imageUrl?: string
  /** ISO-8601 timestamp. */
  publishedAt: string
  authors: string[]
  /** The provider's own section label, e.g. "Football" or "Arts". */
  section?: string
  /** The API the article came from. */
  sourceId: SourceId
  /** The actual publication, e.g. "BBC News" when fetched through NewsAPI. */
  publisher: string
}

export interface ArticleQuery {
  keyword?: string
  /** Inclusive lower bound, `YYYY-MM-DD`. */
  from?: string
  /** Inclusive upper bound, `YYYY-MM-DD`. */
  to?: string
  /** Empty means every category. */
  categories: Category[]
  /** Empty means every source. */
  sources: SourceId[]
}

/** Source selection is the aggregator's job, so providers never see it. */
export type ProviderQuery = Omit<ArticleQuery, 'sources'>

export interface ProviderPage {
  articles: Article[]
  hasMore: boolean
}

export interface NewsProvider {
  readonly id: SourceId
  /** `page` is 1-based; providers translate it to their own scheme. */
  fetchArticles(query: ProviderQuery, page: number, signal?: AbortSignal): Promise<ProviderPage>
}
