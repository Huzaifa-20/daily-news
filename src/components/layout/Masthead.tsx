import { Link } from 'react-router'
import { dayOfYear, formatLongDate } from '@/utils/date'

export function Masthead() {
  const today = new Date()
  const longDate = formatLongDate(today)

  return (
    <header className="pt-4 sm:pt-6">
      <div className="kicker flex items-center justify-between border-b border-ink pb-2 text-ink-soft">
        <span>Vol. I · No. {dayOfYear(today)}</span>
        <span className="hidden sm:inline">{longDate}</span>
        <span>Free edition</span>
      </div>

      <h1 className="py-3 text-center font-masthead text-[clamp(2.75rem,11vw,6.5rem)] leading-none sm:py-4">
        <Link to="/" className="hover:text-ink-soft">
          The Daily News
        </Link>
      </h1>

      <p className="pb-3 text-center text-sm text-ink-soft italic sm:text-base">
        All the news worth gathering, from The Guardian, The New York Times &amp; NewsAPI
      </p>
      <p className="kicker pb-2 text-center text-ink-soft sm:hidden">{longDate}</p>
    </header>
  )
}
