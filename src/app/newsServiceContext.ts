import { createContext, useContext } from 'react'
import { newsService, type NewsService } from '@/services/news'

/** Lets components depend on the `NewsService` abstraction; tests provide a fake. */
export const NewsServiceContext = createContext<NewsService>(newsService)

export function useNewsService(): NewsService {
  return useContext(NewsServiceContext)
}
