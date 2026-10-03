import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p aria-hidden="true" className="font-headline text-4xl text-ink-faint">
        ❦
      </p>
      <h3 className="mt-3 font-headline text-2xl font-bold">{title}</h3>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
