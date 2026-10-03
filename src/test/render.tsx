import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { NewsServiceContext } from '@/app/newsServiceContext'
import type { AggregatedPage, NewsService } from '@/services/news'

export function fakeNewsService(page: Partial<AggregatedPage> = {}) {
  const fetchPage = vi.fn<NewsService['fetchPage']>(async () => ({
    articles: [],
    failures: [],
    pendingSources: [],
    ...page,
  }))
  return { fetchPage } satisfies NewsService
}

/** Renders `element` at `route` with a fresh query cache and the given news service. */
export function renderWithProviders(
  element: ReactElement,
  { route = '/', service = fakeNewsService() }: { route?: string; service?: NewsService } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const path = new URL(route, 'http://localhost').pathname
  const router = createMemoryRouter([{ path, element }], { initialEntries: [route] })

  return {
    router,
    service,
    ...render(
      <QueryClientProvider client={queryClient}>
        <NewsServiceContext value={service}>
          <RouterProvider router={router} />
        </NewsServiceContext>
      </QueryClientProvider>,
    ),
  }
}
