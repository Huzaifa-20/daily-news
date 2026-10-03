import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseFilters, serializeFilters, type SearchFilters } from './searchFilters'

export function useSearchFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const updateFilters = useCallback(
    (patch: Partial<SearchFilters>, options?: { replace?: boolean }) =>
      setParams((current) => serializeFilters({ ...parseFilters(current), ...patch }), options),
    [setParams],
  )

  const clearFilters = useCallback(
    () => setParams((current) => serializeFilters({ keyword: parseFilters(current).keyword, sources: [] })),
    [setParams],
  )

  return { filters, updateFilters, clearFilters }
}
