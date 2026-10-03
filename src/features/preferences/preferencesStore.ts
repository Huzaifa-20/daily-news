import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sameAuthor, SOURCE_IDS, type Category, type SourceId } from '@/services/news'
import { toggleSubset } from '@/utils/selection'

export interface Preferences {
  /** Empty means every source. */
  sources: SourceId[]
  /** Empty means every category. */
  categories: Category[]
  authors: string[]
}

interface PreferencesActions {
  toggleSource(source: SourceId): void
  toggleCategory(category: Category): void
  followAuthor(name: string): void
  unfollowAuthor(name: string): void
  reset(): void
}

const DEFAULT_PREFERENCES: Preferences = { sources: [], categories: [], authors: [] }

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

export const usePreferences = create<Preferences & PreferencesActions>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      toggleSource: (source) =>
        set((state) => ({ sources: toggleSubset(state.sources, source, SOURCE_IDS) })),
      toggleCategory: (category) =>
        set((state) => ({ categories: toggle(state.categories, category) })),
      followAuthor: (name) =>
        set((state) => {
          const trimmed = name.trim()
          if (!trimmed || state.authors.some((author) => sameAuthor(author, trimmed))) return state
          return { authors: [...state.authors, trimmed] }
        }),
      unfollowAuthor: (name) =>
        set((state) => ({ authors: state.authors.filter((author) => !sameAuthor(author, name)) })),
      reset: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'daily-news:preferences',
      version: 1,
      partialize: ({ sources, categories, authors }) => ({ sources, categories, authors }),
    },
  ),
)

export function isFollowing(authors: string[], name: string): boolean {
  return authors.some((author) => sameAuthor(author, name))
}
