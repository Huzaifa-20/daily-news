import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { ArticleResults } from '@/components/articles/ArticleResults'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeading } from '@/components/ui/PageHeading'
import { usePreferences } from '@/features/preferences/preferencesStore'
import { useArticles } from '@/hooks/useArticles'
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/services/news'
import { joinList, pluralize } from '@/utils/text'
import { isByFollowedAuthor, prioritizeFollowed } from './followedAuthors'

export function FeedPage() {
  const { sources, categories, authors } = usePreferences(
    useShallow(({ sources, categories, authors }) => ({ sources, categories, authors })),
  )
  const [followedOnly, setFollowedOnly] = useState(false)
  const result = useArticles({ sources, categories })

  const showFollowedOnly = followedOnly && authors.length > 0
  const articles = useMemo(() => {
    const ranked = prioritizeFollowed(result.articles, authors)
    return showFollowedOnly ? ranked.filter((a) => isByFollowedAuthor(a, authors)) : ranked
  }, [result.articles, authors, showFollowedOnly])

  const topics = categories.length > 0 ? joinList(categories.map((c) => CATEGORY_LABELS[c])) : 'Every topic'
  const outlets = sources.length > 0 ? joinList(sources.map((s) => SOURCE_LABELS[s])) : 'every source'

  return (
    <>
      <PageHeading
        kicker="Your edition"
        title="The Front Page"
        actions={
          authors.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={followedOnly}
                onChange={(event) => setFollowedOnly(event.target.checked)}
                className="size-4 accent-ink"
              />
              Only authors I follow
            </label>
          )
        }
      >
        <p>
          {topics} from {outlets}.{' '}
          {authors.length > 0 &&
            `Stories by the ${pluralize(authors.length, 'author')} you follow lead the page. `}
          <Link to="/preferences" className="text-ink underline decoration-1 underline-offset-4 hover:text-accent">
            Edit preferences
          </Link>
        </p>
      </PageHeading>

      <ArticleResults
        result={result}
        articles={articles}
        featured={!showFollowedOnly}
        empty={
          showFollowedOnly ? (
            <EmptyState title="Nothing from your authors yet">
              None of the stories loaded so far are by authors you follow. Load more stories or
              follow more authors.
            </EmptyState>
          ) : (
            <EmptyState title="No stories right now">
              Try adding more sources or topics in your preferences.
            </EmptyState>
          )
        }
      />
    </>
  )
}
