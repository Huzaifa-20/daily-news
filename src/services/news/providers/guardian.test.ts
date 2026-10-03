import { describe, expect, it } from 'vitest'
import { fakeFetchJson } from '@/test/fixtures'
import { createGuardianProvider } from './guardian'

const response = {
  response: {
    currentPage: 1,
    pages: 3,
    results: [
      {
        id: 'technology/2026/oct/02/story',
        webUrl: 'https://www.theguardian.com/technology/2026/oct/02/story',
        webTitle: 'A Guardian story ',
        webPublicationDate: '2026-10-02T10:00:05Z',
        sectionName: 'Technology',
        fields: {
          trailText: '<p>Some <strong>trail</strong> text</p>',
          thumbnail: 'https://media.guim.co.uk/abc/0_0_100_100/500.jpg',
          byline: 'Henry Belot',
        },
        tags: [{ webTitle: 'Henry Belot' }, { webTitle: 'Alex Daniel' }],
      },
    ],
  },
}

describe('createGuardianProvider', () => {
  it('maps the shared query onto Guardian search parameters', async () => {
    const { fetchJson, urls } = fakeFetchJson(() => response)
    await createGuardianProvider(fetchJson).fetchArticles(
      { keyword: 'climate', from: '2026-09-01', to: '2026-09-30', categories: ['health', 'technology'] },
      2,
    )

    const [url] = urls
    expect(url!.pathname).toBe('/api/guardian/search')
    expect(Object.fromEntries(url!.searchParams)).toMatchObject({
      q: 'climate',
      'from-date': '2026-09-01',
      'to-date': '2026-09-30',
      tag: 'society/health|technology/technology',
      page: '2',
      'order-by': 'newest',
    })
  })

  it('omits filters that are not set', async () => {
    const { fetchJson, urls } = fakeFetchJson(() => response)
    await createGuardianProvider(fetchJson).fetchArticles({ categories: [] }, 1)

    const params = urls[0]!.searchParams
    expect(params.has('q')).toBe(false)
    expect(params.has('tag')).toBe(false)
    expect(params.has('from-date')).toBe(false)
  })

  it('normalizes results into articles', async () => {
    const { fetchJson } = fakeFetchJson(() => response)
    const page = await createGuardianProvider(fetchJson).fetchArticles({ categories: [] }, 1)

    expect(page.hasMore).toBe(true)
    expect(page.articles).toEqual([
      {
        id: 'guardian:technology/2026/oct/02/story',
        url: 'https://www.theguardian.com/technology/2026/oct/02/story',
        title: 'A Guardian story',
        description: 'Some trail text',
        imageUrl: 'https://media.guim.co.uk/abc/0_0_100_100/1000.jpg',
        publishedAt: '2026-10-02T10:00:05Z',
        authors: ['Henry Belot', 'Alex Daniel'],
        section: 'Technology',
        sourceId: 'guardian',
        publisher: 'The Guardian',
      },
    ])
  })
})
