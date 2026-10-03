import type { Article } from './types'

const AUTHOR_SEPARATOR = /\s*,\s*|\s+and\s+|\s*&\s*/i

/**
 * Turns a free-form byline ("By Jane Doe, John Roe and Max Poe") into names.
 * Drops URLs, which some NewsAPI publishers put in the author field.
 */
export function splitAuthors(byline: string | null | undefined): string[] {
  if (!byline) return []
  const names = byline
    .replace(/^\s*by\s+/i, '')
    .split(AUTHOR_SEPARATOR)
    .map((name) => name.trim())
    .filter((name) => name && !/https?:|www\.|@/.test(name))
  return [...new Set(names)]
}

export function sameAuthor(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? ''
}

/** True when the ISO timestamp falls inside the inclusive `YYYY-MM-DD` bounds. */
export function isWithinDates(publishedAt: string, from?: string, to?: string): boolean {
  const day = publishedAt.slice(0, 10)
  return (!from || day >= from) && (!to || day <= to)
}

/** Strips protocol, `www.`, query, hash and trailing slash so syndicated copies collide. */
function canonicalUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url)
    return `${hostname.replace(/^www\./, '')}${pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

export function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>()
  return articles.filter((article) => {
    const key = canonicalUrl(article.url)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sortByNewest(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}
