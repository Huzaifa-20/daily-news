import { useCallback, useEffect, useRef } from 'react'

/** Returns `[debounced, cancel]`; the latest `callback` is always the one invoked. */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): [(...args: Args) => void, () => void] {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    callbackRef.current = callback
  })

  const cancel = useCallback(() => clearTimeout(timerRef.current), [])

  const debounced = useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
    },
    [delayMs],
  )

  useEffect(() => cancel, [cancel])

  return [debounced, cancel]
}
