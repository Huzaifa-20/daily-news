import { createNewsAggregator } from './aggregator'
import { createGuardianProvider } from './providers/guardian'
import { createNewsApiProvider } from './providers/newsapi'
import { createNytProvider } from './providers/nyt'

export * from './types'
export * from './labels'
export type { AggregatedPage, NewsService, SourceFailure } from './aggregator'
export { dedupeArticles, sameAuthor } from './normalize'

/** Adding a source means writing one adapter and registering it here. */
export const newsService = createNewsAggregator([
  createGuardianProvider(),
  createNytProvider(),
  createNewsApiProvider(),
])
