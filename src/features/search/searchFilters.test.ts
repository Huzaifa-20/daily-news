import { describe, expect, it } from 'vitest'
import {
  countActiveFilters,
  parseFilters,
  serializeFilters,
  toArticleQuery,
} from './searchFilters'

describe('search filters in the URL', () => {
  it('round-trips every filter', () => {
    const filters = {
      keyword: 'climate',
      from: '2026-09-01',
      to: '2026-09-30',
      category: 'science' as const,
      sources: ['guardian' as const, 'nyt' as const],
    }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('ignores invalid values from hand-edited URLs', () => {
    const params = new URLSearchParams('from=yesterday&category=gossip&sources=nyt,bogus')
    expect(parseFilters(params)).toEqual({
      keyword: '',
      from: undefined,
      to: undefined,
      category: undefined,
      sources: ['nyt'],
    })
  })

  it('treats every source selected as no source filter', () => {
    expect(parseFilters(new URLSearchParams('sources=guardian,nyt,newsapi')).sources).toEqual([])
  })

  it('writes nothing for empty filters', () => {
    expect(serializeFilters({ keyword: '  ', sources: [] }).toString()).toBe('')
  })
})

describe('toArticleQuery', () => {
  it('turns the single category into the categories list', () => {
    expect(toArticleQuery({ keyword: 'ai', category: 'technology', sources: [] })).toMatchObject({
      keyword: 'ai',
      categories: ['technology'],
    })
    expect(toArticleQuery({ keyword: '', sources: [] }).categories).toEqual([])
  })
})

describe('countActiveFilters', () => {
  it('counts a date range, a category and a source subset once each', () => {
    expect(countActiveFilters({ keyword: 'x', sources: [] })).toBe(0)
    expect(
      countActiveFilters({
        keyword: 'x',
        from: '2026-09-01',
        to: '2026-09-30',
        category: 'health',
        sources: ['nyt'],
      }),
    ).toBe(3)
  })
})
