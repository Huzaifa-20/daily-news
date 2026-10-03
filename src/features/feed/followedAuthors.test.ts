import { describe, expect, it } from 'vitest'
import { makeArticle } from '@/test/fixtures'
import { isByFollowedAuthor, prioritizeFollowed } from './followedAuthors'

describe('followed authors', () => {
  const first = makeArticle({ title: 'first', authors: ['Ann Lee'] })
  const second = makeArticle({ title: 'second', authors: ['Bo Chan', 'Kim Córdova'] })
  const third = makeArticle({ title: 'third', authors: [] })

  it('matches any co-author, ignoring case and accents', () => {
    expect(isByFollowedAuthor(second, ['kim cordova'])).toBe(true)
    expect(isByFollowedAuthor(third, ['kim cordova'])).toBe(false)
  })

  it('moves followed authors to the front and keeps the rest in order', () => {
    expect(prioritizeFollowed([first, second, third], ['Kim Córdova'])).toEqual([second, first, third])
    expect(prioritizeFollowed([first, second], [])).toEqual([first, second])
  })
})
