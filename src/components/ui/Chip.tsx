import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean
}

/** A toggle pill; `aria-pressed` carries the on/off state for assistive tech. */
export function Chip({ pressed, className = '', ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`border px-3 py-1 text-sm transition-colors ${
        pressed ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
      } ${className}`}
      {...props}
    />
  )
}
