import { QueryClient } from '@tanstack/react-query'

/**
 * The upstream APIs are tightly rate-limited (NYT: 5 requests/minute,
 * NewsAPI: 100/day), so results are cached generously and retried once.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
