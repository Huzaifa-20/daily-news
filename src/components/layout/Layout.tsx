import { Outlet, ScrollRestoration } from 'react-router'
import { Masthead } from './Masthead'
import { NavBar } from './NavBar'

export function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Masthead />
      <NavBar />

      <main id="main" className="flex-1 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t-4 border-double border-ink py-8 text-center text-sm text-ink-soft">
        <p className="font-masthead text-3xl text-ink">The Daily News</p>
        <p className="mx-auto mt-2 max-w-xl">
          Stories gathered from The Guardian, The New York Times and NewsAPI. Every headline links
          to its original publisher.
        </p>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
