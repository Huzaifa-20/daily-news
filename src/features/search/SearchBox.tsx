import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { serializeFilters } from './searchFilters'
import { useSearchFilters } from './useSearchFilters'

const SEARCH_PATH = '/search'
const TYPING_DELAY_MS = 500

/**
 * Lives in the header on every page. On the search page it updates results as
 * you type (debounced, to spare rate-limited APIs); elsewhere Enter starts a search.
 */
export function SearchBox() {
  const navigate = useNavigate()
  const onSearchPage = useLocation().pathname === SEARCH_PATH
  const { filters, updateFilters } = useSearchFilters()
  const urlKeyword = onSearchPage ? filters.keyword : ''

  const [term, setTerm] = useState(urlKeyword)
  // Follow URL changes made elsewhere (back button, "clear", leaving the page).
  const [syncedKeyword, setSyncedKeyword] = useState(urlKeyword)
  if (urlKeyword !== syncedKeyword) {
    setSyncedKeyword(urlKeyword)
    setTerm(urlKeyword)
  }

  const setKeyword = (keyword: string) => updateFilters({ keyword }, { replace: true })
  const [setKeywordDebounced, cancelPending] = useDebouncedCallback((keyword: string) => {
    // The user may have navigated away while the timer was pending.
    if (onSearchPage) setKeyword(keyword)
  }, TYPING_DELAY_MS)

  function handleChange(value: string) {
    setTerm(value)
    if (onSearchPage) setKeywordDebounced(value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    cancelPending()
    if (onSearchPage) setKeyword(term)
    else navigate({ pathname: SEARCH_PATH, search: `${serializeFilters({ keyword: term, sources: [] })}` })
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full items-center md:w-80">
      <input
        type="search"
        value={term}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search the news…"
        aria-label="Search articles"
        enterKeyHint="search"
        className="min-w-0 flex-1 border-b border-ink bg-transparent px-1 py-1.5 italic placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="ml-2 grid size-9 shrink-0 place-items-center hover:text-accent"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  )
}
