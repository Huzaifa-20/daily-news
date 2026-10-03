import { describe, expect, it } from 'vitest'
import { makeArticle } from '@/test/fixtures'
import {
  dedupeArticles,
  isWithinDates,
  sameAuthor,
  sortByNewest,
  splitAuthors,
  stripHtml,
} from './normalize'

describe('splitAuthors', () => {
  it('splits NYT-style bylines into names', () => {
    expect(splitAuthors('By Jon Caramanica, Joe Coscarelli and Katie McCurdy')).toEqual([
      'Jon Caramanica',
      'Joe Coscarelli',
      'Katie McCurdy',
    ])
  })

  it('drops URLs and empty values', () => {
    expect(splitAuthors('https://www.facebook.com/someone, Jane Doe')).toEqual(['Jane Doe'])
    expect(splitAuthors(null)).toEqual([])
    expect(splitAuthors('')).toEqual([])
  })

  it('removes duplicate names', () => {
    expect(splitAuthors('Jane Doe & Jane Doe')).toEqual(['Jane Doe'])
  })
})

describe('sameAuthor', () => {
  it('ignores case and accents', () => {
    expect(sameAuthor('kim cordova', 'Kim Córdova')).toBe(true)
    expect(sameAuthor('Kim Cordova', 'Kim Cordon')).toBe(false)
  })
})

describe('stripHtml', () => {
  it('returns plain text', () => {
    expect(stripHtml('<strong>Breaking:</strong> news &amp; views')).toBe('Breaking: news & views')
  })
})

describe('isWithinDates', () => {
  it('treats both bounds as inclusive calendar days', () => {
    const publishedAt = '2026-09-25T23:30:00Z'
    expect(isWithinDates(publishedAt, '2026-09-25', '2026-09-25')).toBe(true)
    expect(isWithinDates(publishedAt, '2026-09-26')).toBe(false)
    expect(isWithinDates(publishedAt, undefined, '2026-09-24')).toBe(false)
    expect(isWithinDates(publishedAt)).toBe(true)
  })
})

describe('dedupeArticles', () => {
  it('keeps the first copy of the same story across URL variants', () => {
    const original = makeArticle({ url: 'https://www.example.com/story/' })
    const syndicated = makeArticle({ url: 'http://example.com/story?utm_source=feed', sourceId: 'newsapi' })
    const other = makeArticle({ url: 'https://example.com/other' })
    expect(dedupeArticles([original, syndicated, other])).toEqual([original, other])
  })
})

describe('sortByNewest', () => {
  it('orders by publication time, newest first', () => {
    const older = makeArticle({ publishedAt: '2026-09-30T10:00:00Z' })
    const newer = makeArticle({ publishedAt: '2026-10-01T09:00:00+00:00' })
    expect(sortByNewest([older, newer])).toEqual([newer, older])
  })
})
