import { buildUrl, fetchJson as defaultFetchJson, type FetchJson } from '../http'
import { splitAuthors } from '../normalize'
import type { Article, Category, NewsProvider } from '../types'

/** NYT always returns 10 documents per page and stops paging after 1,000 hits. */
const PAGE_SIZE = 10
const MAX_RESULTS = 1000

const CATEGORY_SECTIONS: Record<Category, string[]> = {
  business: ['Business'],
  entertainment: ['Arts', 'Movies', 'Theater'],
  health: ['Health', 'Well'],
  science: ['Science'],
  sports: ['Sports'],
  technology: ['Technology'],
}

interface NytDoc {
  _id: string
  web_url: string
  headline: { main: string }
  abstract?: string
  snippet?: string
  pub_date: string
  section_name?: string
  byline?: { original?: string | null }
  multimedia?: { default?: { url?: string } }
}

interface NytResponse {
  response: { docs: NytDoc[] | null; metadata: { hits: number } }
}

/** Builds `section.name:("A" "B")`, which matches any of the listed sections. */
function sectionFilter(categories: Category[]): string | undefined {
  const sections = categories.flatMap((category) => CATEGORY_SECTIONS[category])
  if (sections.length === 0) return undefined
  return `section.name:(${sections.map((section) => `"${section}"`).join(' ')})`
}

/** `YYYY-MM-DD` -> `YYYYMMDD`. */
function compactDate(date: string | undefined): string | undefined {
  return date?.replaceAll('-', '')
}

function toArticle(doc: NytDoc): Article {
  return {
    id: `nyt:${doc._id}`,
    url: doc.web_url,
    title: doc.headline.main,
    description: doc.abstract || doc.snippet || '',
    imageUrl: doc.multimedia?.default?.url,
    publishedAt: doc.pub_date,
    authors: splitAuthors(doc.byline?.original),
    section: doc.section_name,
    sourceId: 'nyt',
    publisher: 'The New York Times',
  }
}

export function createNytProvider(
  fetchJson: FetchJson = defaultFetchJson,
  baseUrl = '/api/nyt',
): NewsProvider {
  return {
    id: 'nyt',
    async fetchArticles(query, page, signal) {
      const url = buildUrl(`${baseUrl}/articlesearch.json`, {
        q: query.keyword,
        fq: sectionFilter(query.categories),
        begin_date: compactDate(query.from),
        end_date: compactDate(query.to),
        sort: 'newest',
        page: page - 1,
      })
      const { response } = await fetchJson<NytResponse>(url, { signal })
      return {
        articles: (response.docs ?? []).filter((doc) => doc.headline.main).map(toArticle),
        hasMore: page * PAGE_SIZE < Math.min(response.metadata.hits, MAX_RESULTS),
      }
    },
  }
}
