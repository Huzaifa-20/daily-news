import { describe, expect, it } from 'vitest'
import { fakeFetchJson } from '@/test/fixtures'
import { createNewsApiProvider } from './newsapi'

function item(overrides: Record<string, unknown> = {}) {
  return {
    source: { id: 'bbc-news', name: 'BBC News' },
    author: 'Jane Doe',
    title: 'Story title - BBC News',
    description: 'Description',
    url: `https://www.bbc.co.uk/news/${Math.random()}`,
    urlToImage: 'https://ichef.bbci.co.uk/image.jpg',
    publishedAt: '2026-10-01T09:00:00Z',
    ...overrides,
  }
}

describe('createNewsApiProvider', () => {
  it('uses /everything for keyword searches without a category', async () => {
    const { fetchJson, urls } = fakeFetchJson(() => ({ totalResults: 1, articles: [item()] }))
    await createNewsApiProvider(fetchJson).fetchArticles(
      { keyword: 'climate', from: '2026-09-20', to: '2026-09-30', categories: [] },
      1,
    )

    expect(urls[0]!.pathname).toBe('/api/newsapi/everything')
    expect(Object.fromEntries(urls[0]!.searchParams)).toMatchObject({
      q: 'climate',
      from: '2026-09-20',
      to: '2026-09-30',
      sortBy: 'publishedAt',
    })
  })

  it('uses /top-headlines once per category and labels each article with it', async () => {
    const { fetchJson, urls } = fakeFetchJson((url) => ({
      totalResults: 1,
      articles: [item({ url: `https://example.com/${url.searchParams.get('category')}` })],
    }))
    const page = await createNewsApiProvider(fetchJson).fetchArticles(
      { keyword: 'ai', categories: ['business', 'technology'] },
      1,
    )

    expect(urls.map((url) => url.searchParams.get('category'))).toEqual(['business', 'technology'])
    expect(urls.every((url) => url.searchParams.get('q') === 'ai')).toBe(true)
    expect(page.articles.map((article) => article.section)).toEqual(['Business', 'Technology'])
  })

  it('applies the date range itself on /top-headlines, which ignores dates', async () => {
    const { fetchJson } = fakeFetchJson(() => ({
      totalResults: 2,
      articles: [
        item({ publishedAt: '2026-10-01T09:00:00Z' }),
        item({ publishedAt: '2026-09-01T09:00:00Z' }),
      ],
    }))
    const page = await createNewsApiProvider(fetchJson).fetchArticles(
      { from: '2026-09-30', categories: [] },
      1,
    )
    expect(page.articles).toHaveLength(1)
    expect(page.articles[0]!.publishedAt).toBe('2026-10-01T09:00:00Z')
  })

  it('cleans titles and drops removed stories', async () => {
    const { fetchJson } = fakeFetchJson(() => ({
      totalResults: 3,
      articles: [
        item(),
        item({ title: 'Benchmarks - TechPowerUp', source: { id: null, name: 'Techpowerup.com' } }),
        item({ title: '[Removed]' }),
      ],
    }))
    const page = await createNewsApiProvider(fetchJson).fetchArticles({ categories: [] }, 1)

    expect(page.articles.map((article) => article.title)).toEqual(['Story title', 'Benchmarks'])
    expect(page.articles[0]).toMatchObject({ publisher: 'BBC News', authors: ['Jane Doe'] })
  })

  it('stops at the free plan’s 100-result ceiling', async () => {
    const { fetchJson } = fakeFetchJson(() => ({ totalResults: 5000, articles: [] }))
    const provider = createNewsApiProvider(fetchJson)
    expect((await provider.fetchArticles({ keyword: 'x', categories: [] }, 9)).hasMore).toBe(true)
    expect((await provider.fetchArticles({ keyword: 'x', categories: [] }, 10)).hasMore).toBe(false)
  })
})
