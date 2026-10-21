import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { readString, STORAGE_KEYS, writeString } from '@/lib/storage'
import { AmountVisibilityContext } from './amountVisibility'

export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => readString(STORAGE_KEYS.amountsHidden) === 'true')

  const toggle = useCallback(() => setHidden((h) => {
    const next = !h
    writeString(STORAGE_KEYS.amountsHidden, String(next))
    return next
  }), [])

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle])

  return <AmountVisibilityContext.Provider value={value}>{children}</AmountVisibilityContext.Provider>
}
