import type { ReactNode } from 'react'

interface FieldsetProps {
  legend: string
  hint?: ReactNode
  children: ReactNode
}

export function Fieldset({ legend, hint, children }: FieldsetProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="kicker mb-3 w-full border-b border-ink pb-1">{legend}</legend>
      {hint && <p className="-mt-1 mb-3 text-sm text-ink-faint italic">{hint}</p>}
      {children}
    </fieldset>
  )
}
