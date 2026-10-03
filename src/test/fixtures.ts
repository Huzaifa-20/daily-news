import type { FetchJson } from '@/services/news/http'
import type { Article } from '@/services/news'

export function makeArticle(overrides: Partial<Article> = {}): Article {
  const url = overrides.url ?? `https://example.com/${Math.random().toString(36).slice(2)}`
  return {
    id: `guardian:${url}`,
    url,
    title: 'A headline',
    description: 'A standfirst.',
    publishedAt: '2026-10-01T12:00:00Z',
    authors: [],
    sourceId: 'guardian',
    publisher: 'The Guardian',
    ...overrides,
  }
}

/** A `FetchJson` stand-in that records requested URLs and answers from `respond`. */
export function fakeFetchJson(respond: (url: URL) => unknown) {
  const urls: URL[] = []
  const fetchJson = (async (path: string) => {
    const url = new URL(path, 'http://localhost')
    urls.push(url)
    return respond(url)
  }) as FetchJson
  return { fetchJson, urls }
}
