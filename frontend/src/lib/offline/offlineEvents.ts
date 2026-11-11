import { useEffect, useRef } from 'react'

/**
 * "A change was just saved on this device to send later": open forms close (the change is kept,
 * nothing else to do there), and the review window can be asked to open.
 */
const SAVED_OFFLINE = 'app:saved-offline'
const REVIEW = 'app:review-offline-changes'

const emit = (name: string) => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(name)) }
export const emitSavedOffline = () => emit(SAVED_OFFLINE)
export const openSyncReview = () => emit(REVIEW)

function useWindowEvent(name: string, handler: () => void, enabled = true): void {
  const latest = useRef(handler)
  useEffect(() => { latest.current = handler })
  useEffect(() => {
    if (!enabled) return
    const on = () => latest.current()
    window.addEventListener(name, on)
    return () => window.removeEventListener(name, on)
  }, [name, enabled])
}

export const useSavedOffline = (handler: () => void, enabled = true) => useWindowEvent(SAVED_OFFLINE, handler, enabled)
export const useOpenSyncReview = (handler: () => void) => useWindowEvent(REVIEW, handler)
