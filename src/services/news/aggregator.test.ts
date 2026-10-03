import { describe, expect, it, vi } from 'vitest'
import { makeArticle } from '@/test/fixtures'
import { createNewsAggregator } from './aggregator'
import { ApiError } from './http'
import type { NewsProvider, ProviderPage, SourceId } from './types'

function provider(id: SourceId, result: ProviderPage | Error): NewsProvider {
  return {
    id,
    fetchArticles: vi.fn(async () => {
      if (result instanceof Error) throw result
      return result
    }),
  }
}

const query = { keyword: 'climate', categories: [] }

describe('createNewsAggregator', () => {
  it('merges and sorts results, keeping the first source’s copy of a duplicate', async () => {
    const shared = 'https://example.com/shared'
    const guardian = provider('guardian', {
      articles: [
        makeArticle({ url: shared, publishedAt: '2026-10-01T08:00:00Z' }),
        makeArticle({ publishedAt: '2026-10-01T12:00:00Z' }),
      ],
      hasMore: true,
    })
    const newsapi = provider('newsapi', {
      articles: [makeArticle({ url: shared, sourceId: 'newsapi', publishedAt: '2026-10-01T09:00:00Z' })],
      hasMore: false,
    })

    const page = await createNewsAggregator([guardian, newsapi]).fetchPage(query, 1, ['guardian', 'newsapi'])

    expect(page.articles.map(({ sourceId, publishedAt }) => [sourceId, publishedAt])).toEqual([
      ['guardian', '2026-10-01T12:00:00Z'],
      ['guardian', '2026-10-01T08:00:00Z'],
    ])
    expect(page.pendingSources).toEqual(['guardian'])
    expect(page.failures).toEqual([])
  })

  it('only calls the requested sources', async () => {
    const guardian = provider('guardian', { articles: [], hasMore: false })
    const nyt = provider('nyt', { articles: [], hasMore: false })

    await createNewsAggregator([guardian, nyt]).fetchPage(query, 2, ['nyt'])

    expect(guardian.fetchArticles).not.toHaveBeenCalled()
    expect(nyt.fetchArticles).toHaveBeenCalledWith(query, 2, undefined)
  })

  it('reports a failing source without losing the others', async () => {
    const guardian = provider('guardian', { articles: [makeArticle()], hasMore: false })
    const nyt = provider('nyt', new ApiError('Rate limit reached.', 429))

    const page = await createNewsAggregator([guardian, nyt]).fetchPage(query, 1, ['guardian', 'nyt'])

    expect(page.articles).toHaveLength(1)
    expect(page.failures).toEqual([{ sourceId: 'nyt', message: 'Rate limit reached.' }])
  })

  it('rejects when every source fails', async () => {
    const aggregator = createNewsAggregator([
      provider('guardian', new Error('down')),
      provider('nyt', new Error('also down')),
    ])
    await expect(aggregator.fetchPage(query, 1, ['guardian', 'nyt'])).rejects.toThrow(
      'No source could be reached. The Guardian: down The New York Times: also down',
    )
  })
})
