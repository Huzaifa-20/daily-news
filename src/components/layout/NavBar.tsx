import { NavLink } from 'react-router'
import { SearchBox } from '@/features/search/SearchBox'

const LINKS = [
  { to: '/', label: 'For You' },
  { to: '/search', label: 'Search' },
  { to: '/preferences', label: 'Preferences' },
]

export function NavBar() {
  return (
    <div className="flex flex-col gap-3 border-y-4 border-double border-ink py-2.5 md:flex-row md:items-center md:justify-between">
      <nav aria-label="Main">
        <ul className="flex justify-center gap-6 sm:gap-8 md:justify-start">
          {LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `kicker inline-block py-1 text-[0.75rem] decoration-2 underline-offset-[6px] hover:text-accent ${
                    isActive ? 'text-accent underline' : ''
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <SearchBox />
    </div>
  )
}
