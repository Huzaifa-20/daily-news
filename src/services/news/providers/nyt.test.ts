import { describe, expect, it } from 'vitest'
import { fakeFetchJson } from '@/test/fixtures'
import { createNytProvider } from './nyt'

const doc = {
  _id: 'nyt://article/1',
  web_url: 'https://www.nytimes.com/2026/10/01/business/story.html',
  headline: { main: 'An NYT story' },
  abstract: 'The abstract.',
  snippet: 'The snippet.',
  pub_date: '2026-10-01T14:37:52Z',
  section_name: 'Business',
  byline: { original: 'By Lisa Friedman and River Akira Davis' },
  multimedia: { default: { url: 'https://static01.nyt.com/images/large.jpg' } },
}

function respondWith(docs: unknown[], hits = 25) {
  return fakeFetchJson(() => ({ response: { docs, metadata: { hits, offset: 0 } } }))
}

describe('createNytProvider', () => {
  it('maps the shared query onto Article Search parameters', async () => {
    const { fetchJson, urls } = respondWith([doc])
    await createNytProvider(fetchJson).fetchArticles(
      { keyword: 'diesel', from: '2026-09-01', to: '2026-09-30', categories: ['business', 'entertainment'] },
      1,
    )

    expect(Object.fromEntries(urls[0]!.searchParams)).toMatchObject({
      q: 'diesel',
      fq: 'section.name:("Business" "Arts" "Movies" "Theater")',
      begin_date: '20260901',
      end_date: '20260930',
      sort: 'newest',
      // NYT pages are zero-based.
      page: '0',
    })
  })

  it('normalizes documents and splits the byline', async () => {
    const { fetchJson } = respondWith([doc])
    const page = await createNytProvider(fetchJson).fetchArticles({ categories: [] }, 1)

    expect(page.articles[0]).toMatchObject({
      id: 'nyt:nyt://article/1',
      title: 'An NYT story',
      description: 'The abstract.',
      imageUrl: 'https://static01.nyt.com/images/large.jpg',
      authors: ['Lisa Friedman', 'River Akira Davis'],
      section: 'Business',
      sourceId: 'nyt',
      publisher: 'The New York Times',
    })
  })

  it('stops paging once every hit has been fetched', async () => {
    const { fetchJson } = respondWith([doc], 25)
    const provider = createNytProvider(fetchJson)
    expect((await provider.fetchArticles({ categories: [] }, 2)).hasMore).toBe(true)
    expect((await provider.fetchArticles({ categories: [] }, 3)).hasMore).toBe(false)
  })

  it('tolerates a null docs list', async () => {
    const { fetchJson } = fakeFetchJson(() => ({ response: { docs: null, metadata: { hits: 0 } } }))
    const page = await createNytProvider(fetchJson).fetchArticles({ categories: [] }, 1)
    expect(page).toEqual({ articles: [], hasMore: false })
  })
})
