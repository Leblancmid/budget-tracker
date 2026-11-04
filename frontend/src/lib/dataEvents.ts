import { useEffect, useRef } from 'react'

/**
 * A tiny app-wide "data changed" signal: Quick Add (in the header) saves something, and the
 * page that's open refreshes its lists without a reload.
 */
const EVENT = 'app:data-changed'

export function emitDataChanged(): void {
  window.dispatchEvent(new Event(EVENT))
}

/** Run `onChange` whenever data is saved from outside this page. */
export function useDataChanged(onChange: () => void): void {
  const latest = useRef(onChange)
  useEffect(() => { latest.current = onChange })
  useEffect(() => {
    const handler = () => latest.current()
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])
}
