import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { makeArticle } from '@/test/fixtures'
import { fakeNewsService, renderWithProviders } from '@/test/render'
import { SearchPage } from './SearchPage'

describe('SearchPage', () => {
  it('searches every source for the keyword in the URL', async () => {
    const service = fakeNewsService({ articles: [makeArticle({ title: 'Climate summit opens' })] })
    renderWithProviders(<SearchPage />, { route: '/search?q=climate', service })

    expect(await screen.findByRole('heading', { name: /climate summit opens/i })).toBeInTheDocument()
    expect(service.fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'climate', categories: [] }),
      1,
      ['guardian', 'nyt', 'newsapi'],
      expect.anything(),
    )
  })

  it('applies a category filter and records it in the URL', async () => {
    const user = userEvent.setup()
    const service = fakeNewsService()
    const { router } = renderWithProviders(<SearchPage />, { route: '/search?q=ai', service })
    const sidebar = screen.getByRole('complementary', { name: 'Filters' })

    await user.click(within(sidebar).getByRole('radio', { name: 'Technology' }))

    expect(router.state.location.search).toBe('?q=ai&category=technology')
    await waitFor(() =>
      expect(service.fetchPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ keyword: 'ai', categories: ['technology'] }),
        1,
        expect.any(Array),
        expect.anything(),
      ),
    )
    expect(screen.getByRole('button', { name: 'Remove filter: Technology' })).toBeInTheDocument()
  })

  it('narrows the sources when one is unchecked', async () => {
    const user = userEvent.setup()
    const service = fakeNewsService()
    const { router } = renderWithProviders(<SearchPage />, { route: '/search', service })
    const sidebar = screen.getByRole('complementary', { name: 'Filters' })

    await user.click(within(sidebar).getByRole('checkbox', { name: 'NewsAPI' }))

    expect(router.state.location.search).toBe('?sources=guardian%2Cnyt')
    await waitFor(() =>
      expect(service.fetchPage).toHaveBeenLastCalledWith(
        expect.anything(),
        1,
        ['guardian', 'nyt'],
        expect.anything(),
      ),
    )
  })

  it('shows which sources failed alongside the ones that answered', async () => {
    const service = fakeNewsService({
      articles: [makeArticle({ title: 'Still here' })],
      failures: [{ sourceId: 'nyt', message: 'Rate limit reached.' }],
    })
    renderWithProviders(<SearchPage />, { route: '/search?q=x', service })

    expect(await screen.findByText('Still here')).toBeInTheDocument()
    expect(screen.getByText(/couldn’t be reached: Rate limit reached\./)).toBeInTheDocument()
  })

  it('offers a retry when every source fails', async () => {
    const service = fakeNewsService()
    service.fetchPage.mockRejectedValue(new Error('No source could be reached.'))
    renderWithProviders(<SearchPage />, { route: '/search?q=x', service })

    expect(await screen.findByText('No source could be reached.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
