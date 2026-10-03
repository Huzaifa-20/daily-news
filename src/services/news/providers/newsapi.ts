import { buildUrl, fetchJson as defaultFetchJson, type FetchJson } from '../http'
import { CATEGORY_LABELS } from '../labels'
import { isWithinDates, splitAuthors } from '../normalize'
import type { Article, Category, NewsProvider, ProviderPage, ProviderQuery } from '../types'

const PAGE_SIZE = 10
/** The free developer plan refuses to page past the first 100 results. */
const MAX_RESULTS = 100
const HEADLINES_COUNTRY = 'us'

interface NewsApiArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string | null
  description: string | null
  url: string | null
  urlToImage: string | null
  publishedAt: string
}

interface NewsApiResponse {
  totalResults: number
  articles: NewsApiArticle[]
}

/** "Techpowerup.com" and "TechPowerUp" both squash to "techpowerup". */
function squash(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.(com|org|net|co\.uk)$/, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Headlines arrive as "Title - Publisher"; the publisher is shown separately. */
function cleanTitle(title: string, publisher: string): string {
  const cut = title.lastIndexOf(' - ')
  if (cut > 0 && squash(title.slice(cut + 3)) === squash(publisher)) return title.slice(0, cut)
  return title
}

function toArticle(item: NewsApiArticle, section?: string): Article | null {
  // Taken-down stories come back as "[Removed]" placeholders.
  if (!item.url || !item.title || item.title === '[Removed]') return null
  const publisher = item.source.name
  return {
    id: `newsapi:${item.url}`,
    url: item.url,
    title: cleanTitle(item.title, publisher),
    description: item.description ?? '',
    imageUrl: item.urlToImage ?? undefined,
    publishedAt: item.publishedAt,
    authors: splitAuthors(item.author).filter((name) => name !== publisher),
    section,
    sourceId: 'newsapi',
    publisher,
  }
}

export function createNewsApiProvider(
  fetchJson: FetchJson = defaultFetchJson,
  baseUrl = '/api/newsapi',
): NewsProvider {
  async function request(
    endpoint: 'everything' | 'top-headlines',
    params: Record<string, string | number | undefined>,
    page: number,
    signal?: AbortSignal,
    section?: string,
  ): Promise<ProviderPage> {
    const url = buildUrl(`${baseUrl}/${endpoint}`, { ...params, pageSize: PAGE_SIZE, page })
    const data = await fetchJson<NewsApiResponse>(url, { signal })
    return {
      articles: data.articles
        .map((item) => toArticle(item, section))
        .filter((article) => article !== null),
      hasMore: page * PAGE_SIZE < Math.min(data.totalResults, MAX_RESULTS),
    }
  }

  /**
   * Only `/top-headlines` filters by category, one category per call, and it
   * ignores dates, so the date range is applied to its results here instead.
   */
  async function headlines(
    query: ProviderQuery,
    page: number,
    signal?: AbortSignal,
  ): Promise<ProviderPage> {
    const categories: (Category | undefined)[] =
      query.categories.length > 0 ? query.categories : [undefined]
    const pages = await Promise.all(
      categories.map((category) =>
        request(
          'top-headlines',
          { country: HEADLINES_COUNTRY, category, q: query.keyword },
          page,
          signal,
          category && CATEGORY_LABELS[category],
        ),
      ),
    )
    return {
      articles: pages
        .flatMap((result) => result.articles)
        .filter((article) => isWithinDates(article.publishedAt, query.from, query.to)),
      hasMore: pages.some((result) => result.hasMore),
    }
  }

  return {
    id: 'newsapi',
    fetchArticles(query, page, signal) {
      if (query.categories.length > 0 || !query.keyword) return headlines(query, page, signal)
      return request(
        'everything',
        {
          q: query.keyword,
          from: query.from,
          to: query.to,
          language: 'en',
          sortBy: 'publishedAt',
        },
        page,
        signal,
      )
    },
  }
}
