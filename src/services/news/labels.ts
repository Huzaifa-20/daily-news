import type { Category, SourceId } from './types'

export const SOURCE_LABELS: Record<SourceId, string> = {
  guardian: 'The Guardian',
  nyt: 'The New York Times',
  newsapi: 'NewsAPI',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Business',
  entertainment: 'Entertainment',
  health: 'Health',
  science: 'Science',
  sports: 'Sports',
  technology: 'Technology',
}
