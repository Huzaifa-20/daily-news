import { Fragment } from 'react'
import { isFollowing, usePreferences } from '@/features/preferences/preferencesStore'

function separator(index: number, count: number): string {
  if (index === 0) return ''
  return index === count - 1 ? ' and ' : ', '
}

/** "By A, B and C", where each name toggles following that author. */
export function Byline({ authors }: { authors: string[] }) {
  const followed = usePreferences((state) => state.authors)
  const followAuthor = usePreferences((state) => state.followAuthor)
  const unfollowAuthor = usePreferences((state) => state.unfollowAuthor)

  if (authors.length === 0) return null

  return (
    // Sits above the card's stretched headline link so the buttons stay clickable.
    <p className="relative z-10">
      <span className="text-ink-faint italic">By </span>
      {authors.map((name, index) => {
        const following = isFollowing(followed, name)
        return (
          <Fragment key={name}>
            {separator(index, authors.length)}
            <button
              type="button"
              aria-pressed={following}
              aria-label={`Follow ${name}`}
              title={following ? `Unfollow ${name}` : `Follow ${name}`}
              onClick={() => (following ? unfollowAuthor(name) : followAuthor(name))}
              className="group/author inline-flex items-baseline gap-1 font-semibold hover:text-accent"
            >
              {name}
              <span
                aria-hidden="true"
                className={`inline-grid size-4 translate-y-px place-items-center rounded-full border text-[0.65rem] leading-none transition-colors ${
                  following
                    ? 'border-accent bg-accent text-paper'
                    : 'border-ink-faint text-ink-faint group-hover/author:border-accent group-hover/author:text-accent'
                }`}
              >
                {following ? '✓' : '+'}
              </span>
            </button>
          </Fragment>
        )
      })}
    </p>
  )
}
