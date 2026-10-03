import { useEffect, useRef, type ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Slide-over panel built on `<dialog>`, which gives focus trapping, Escape to
 * close and an inert background for free.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="drawer fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-sm bg-paper p-0 text-ink shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b-4 border-double border-ink px-5 py-4">
          <h2 className="font-headline text-2xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 p-2 text-2xl leading-none hover:text-accent"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
      </div>
    </dialog>
  )
}
