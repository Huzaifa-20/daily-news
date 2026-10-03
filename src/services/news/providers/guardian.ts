import { buildUrl, fetchJson as defaultFetchJson, type FetchJson } from '../http'
import { splitAuthors, stripHtml } from '../normalize'
import type { Article, Category, NewsProvider } from '../types'

const PAGE_SIZE = 10

/** Guardian keyword tags; `|` between tags means OR. */
const CATEGORY_TAGS: Record<Category, string> = {
  business: 'business/business',
  entertainment: 'culture/culture',
  health: 'society/health',
  science: 'science/science',
  sports: 'sport/sport',
  technology: 'technology/technology',
}

interface GuardianResult {
  id: string
  webUrl: string
  webTitle: string
  webPublicationDate: string
  sectionName?: string
  fields?: { trailText?: string; thumbnail?: string; byline?: string }
  tags?: { webTitle: string }[]
}

interface GuardianResponse {
  response: { currentPage: number; pages: number; results: GuardianResult[] }
}

/** The thumbnail field is a 500px crop; the same crop is published at 1000px for sharper cards. */
function largerImage(thumbnail: string | undefined): string | undefined {
  return thumbnail?.replace(/\/500\.jpg$/, '/1000.jpg')
}

function toArticle(result: GuardianResult): Article {
  const contributors = result.tags?.map((tag) => tag.webTitle) ?? []
  return {
    id: `guardian:${result.id}`,
    url: result.webUrl,
    title: result.webTitle.trim(),
    description: stripHtml(result.fields?.trailText),
    imageUrl: largerImage(result.fields?.thumbnail),
    publishedAt: result.webPublicationDate,
    authors: contributors.length > 0 ? contributors : splitAuthors(result.fields?.byline),
    section: result.sectionName,
    sourceId: 'guardian',
    publisher: 'The Guardian',
  }
}

export function createGuardianProvider(
  fetchJson: FetchJson = defaultFetchJson,
  baseUrl = '/api/guardian',
): NewsProvider {
  return {
    id: 'guardian',
    async fetchArticles(query, page, signal) {
      const url = buildUrl(`${baseUrl}/search`, {
        q: query.keyword,
        tag: query.categories.map((category) => CATEGORY_TAGS[category]).join('|'),
        'from-date': query.from,
        'to-date': query.to,
        'order-by': 'newest',
        'page-size': PAGE_SIZE,
        page,
        'show-fields': 'trailText,thumbnail,byline',
        'show-tags': 'contributor',
      })
      const { response } = await fetchJson<GuardianResponse>(url, { signal })
      return {
        articles: response.results.map(toArticle),
        hasMore: response.currentPage < response.pages,
      }
    },
  }
}
