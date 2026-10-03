import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferences } from '@/features/preferences/preferencesStore'
import { makeArticle } from '@/test/fixtures'
import { fakeNewsService, renderWithProviders } from '@/test/render'
import { FeedPage } from './FeedPage'

const articles = [
  makeArticle({ title: 'Newest story', authors: ['Ann Lee'], publishedAt: '2026-10-02T10:00:00Z' }),
  makeArticle({ title: 'Middle story', authors: [], publishedAt: '2026-10-02T09:00:00Z' }),
  makeArticle({ title: 'Story by a favourite', authors: ['Marina Hyde'], publishedAt: '2026-10-02T08:00:00Z' }),
]

describe('FeedPage', () => {
  beforeEach(() => usePreferences.getState().reset())

  it('queries with the saved source and category preferences', async () => {
    usePreferences.setState({ sources: ['guardian', 'nyt'], categories: ['science'] })
    const service = fakeNewsService({ articles })
    renderWithProviders(<FeedPage />, { service })

    await screen.findByText('Newest story')
    expect(service.fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['science'] }),
      1,
      ['guardian', 'nyt'],
      expect.anything(),
    )
    expect(screen.getByText(/Science from The Guardian and The New York Times/)).toBeInTheDocument()
  })

  it('leads with stories by followed authors and can show only them', async () => {
    const user = userEvent.setup()
    usePreferences.setState({ authors: ['Marina Hyde'] })
    renderWithProviders(<FeedPage />, { service: fakeNewsService({ articles }) })

    const headlines = await screen.findAllByRole('heading', { level: 3 })
    expect(headlines[0]).toHaveTextContent('Story by a favourite')

    await user.click(screen.getByRole('checkbox', { name: 'Only authors I follow' }))
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      expect.stringContaining('Story by a favourite'),
    ])
  })
})
