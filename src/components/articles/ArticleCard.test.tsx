import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferences } from '@/features/preferences/preferencesStore'
import { makeArticle } from '@/test/fixtures'
import { ArticleCard } from './ArticleCard'

describe('ArticleCard', () => {
  beforeEach(() => usePreferences.getState().reset())

  const article = makeArticle({
    title: 'Markets rally',
    url: 'https://example.com/markets',
    section: 'Business',
    publisher: 'BBC News',
    authors: ['Jane Doe', 'John Roe'],
  })

  it('links the headline to the original story in a new tab', () => {
    render(<ArticleCard article={article} />)
    const link = screen.getByRole('link', { name: /markets rally/i })
    expect(link).toHaveAttribute('href', 'https://example.com/markets')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('BBC News')).toBeInTheDocument()
  })

  it('follows and unfollows an author from the byline', async () => {
    const user = userEvent.setup()
    render(<ArticleCard article={article} />)
    const follow = screen.getByRole('button', { name: 'Follow Jane Doe' })

    await user.click(follow)
    expect(follow).toHaveAttribute('aria-pressed', 'true')
    expect(usePreferences.getState().authors).toEqual(['Jane Doe'])

    await user.click(follow)
    expect(follow).toHaveAttribute('aria-pressed', 'false')
    expect(usePreferences.getState().authors).toEqual([])
  })
})
