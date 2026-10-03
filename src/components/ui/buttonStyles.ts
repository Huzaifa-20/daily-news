export type ButtonVariant = 'solid' | 'outline' | 'link'

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'bg-ink px-5 py-2.5 text-paper hover:bg-ink-soft',
  outline: 'border border-ink px-5 py-2.5 hover:bg-ink hover:text-paper',
  link: 'underline decoration-1 underline-offset-4 hover:text-accent',
}

/** Shared so router links can look like buttons without duplicating classes. */
export function buttonClass(variant: ButtonVariant = 'outline', extra = ''): string {
  return `kicker inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${extra}`
}
