import type { Article } from '@/services/news'
import { isFollowing } from '@/features/preferences/preferencesStore'

export function isByFollowedAuthor(article: Article, followed: string[]): boolean {
  return article.authors.some((author) => isFollowing(followed, author))
}

/** Moves articles by followed authors to the front, keeping each group's order. */
export function prioritizeFollowed(articles: Article[], followed: string[]): Article[] {
  if (followed.length === 0) return articles
  const byFollowed = articles.filter((article) => isByFollowedAuthor(article, followed))
  const others = articles.filter((article) => !isByFollowedAuthor(article, followed))
  return [...byFollowed, ...others]
}
