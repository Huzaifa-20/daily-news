import { createBrowserRouter } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { FeedPage } from '@/features/feed/FeedPage'
import { PreferencesPage } from '@/features/preferences/PreferencesPage'
import { SearchPage } from '@/features/search/SearchPage'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
