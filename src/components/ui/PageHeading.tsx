import type { ReactNode } from 'react'

interface PageHeadingProps {
  kicker: string
  title: string
  children?: ReactNode
  actions?: ReactNode
}

export function PageHeading({ kicker, title, children, actions }: PageHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="kicker text-accent">{kicker}</p>
        <h2 className="mt-1 font-headline text-3xl leading-tight font-bold break-words sm:text-4xl">
          {title}
        </h2>
        {children && <div className="mt-2 max-w-2xl text-ink-soft">{children}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
