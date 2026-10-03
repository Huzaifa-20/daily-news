import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferences } from './preferencesStore'

const store = () => usePreferences.getState()

describe('preferences store', () => {
  beforeEach(() => store().reset())

  it('follows authors once, ignoring case and whitespace', () => {
    store().followAuthor('  Marina Hyde ')
    store().followAuthor('marina hyde')
    store().followAuthor('   ')
    expect(store().authors).toEqual(['Marina Hyde'])

    store().unfollowAuthor('MARINA HYDE')
    expect(store().authors).toEqual([])
  })

  it('toggles categories freely and keeps at least one source', () => {
    store().toggleCategory('science')
    store().toggleCategory('sports')
    store().toggleCategory('science')
    expect(store().categories).toEqual(['sports'])

    store().toggleSource('newsapi')
    store().toggleSource('nyt')
    store().toggleSource('guardian')
    expect(store().sources).toEqual(['guardian'])
  })

  it('persists preferences to localStorage', () => {
    store().followAuthor('Jane Doe')
    const saved = JSON.parse(localStorage.getItem('daily-news:preferences') ?? '{}')
    expect(saved.state).toEqual({ sources: [], categories: [], authors: ['Jane Doe'] })
  })
})
