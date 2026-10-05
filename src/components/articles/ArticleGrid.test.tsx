import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeArticle } from '@/test/fixtures'
import { formatRelative } from '@/utils/date'
import { ArticleGrid } from './ArticleGrid'

// Every card render calls formatRelative once, so its call count counts card renders.
vi.mock('@/utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/date')>()
  return { ...actual, formatRelative: vi.fn(actual.formatRelative) }
})

describe('ArticleGrid', () => {
  it('renders only the new cards when more stories are appended', () => {
    const first = makeArticle({ title: 'First' })
    const second = makeArticle({ title: 'Second' })
    const { rerender } = render(<ArticleGrid articles={[first, second]} />)
    expect(formatRelative).toHaveBeenCalledTimes(2)

    // A new page keeps the existing article objects and adds new ones.
    rerender(<ArticleGrid articles={[first, second, makeArticle({ title: 'Third' })]} />)

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(formatRelative).toHaveBeenCalledTimes(3)
  })
})
