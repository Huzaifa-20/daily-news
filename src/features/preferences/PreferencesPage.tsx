import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { SourcePicker } from '@/components/filters/SourcePicker'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Fieldset } from '@/components/ui/Fieldset'
import { PageHeading } from '@/components/ui/PageHeading'
import { CATEGORIES, CATEGORY_LABELS } from '@/services/news'
import { usePreferences } from './preferencesStore'

export function PreferencesPage() {
  const { sources, categories, authors, toggleSource, toggleCategory, followAuthor, unfollowAuthor, reset } =
    usePreferences()
  const [authorName, setAuthorName] = useState('')

  function handleAddAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    followAuthor(authorName)
    setAuthorName('')
  }

  return (
    <>
      <PageHeading
        kicker="Personalize"
        title="Your Preferences"
        actions={
          <Button variant="link" onClick={reset}>
            Reset all
          </Button>
        }
      >
        <p>
          Changes are saved on this device as you make them and shape{' '}
          <Link to="/" className="text-ink underline decoration-1 underline-offset-4 hover:text-accent">
            your front page
          </Link>
          .
        </p>
      </PageHeading>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        <Fieldset legend="Sources" hint="Where your stories come from.">
          <SourcePicker selected={sources} onToggle={toggleSource} />
        </Fieldset>

        <Fieldset legend="Topics" hint="Pick none to see every topic.">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                pressed={categories.includes(category)}
                onClick={() => toggleCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </Fieldset>

        <Fieldset
          legend="Authors"
          hint="Their stories lead your front page. You can also follow anyone from a byline with the + button."
        >
          <form onSubmit={handleAddAuthor} className="flex items-end gap-3">
            <label className="flex-1">
              <span className="sr-only">Author name</span>
              <input
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="e.g. Marina Hyde"
                className="w-full border-b border-ink bg-transparent px-1 py-1.5 placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </label>
            <Button type="submit" disabled={!authorName.trim()}>
              Follow
            </Button>
          </form>

          {authors.length > 0 ? (
            <ul aria-label="Followed authors" className="mt-5 divide-y divide-rule border-y border-rule">
              {authors.map((author) => (
                <li key={author} className="flex items-center justify-between py-2">
                  <span className="font-semibold">{author}</span>
                  <button
                    type="button"
                    onClick={() => unfollowAuthor(author)}
                    aria-label={`Unfollow ${author}`}
                    className="px-2 text-xl leading-none text-ink-faint hover:text-accent"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-ink-faint italic">You’re not following anyone yet.</p>
          )}
        </Fieldset>
      </div>
    </>
  )
}
