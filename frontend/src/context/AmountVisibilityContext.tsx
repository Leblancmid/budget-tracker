import { createContext, useContext, useState, type ReactNode } from 'react'

interface AmountVisibilityContextValue {
  hidden: boolean
  toggle: () => void
}

const AmountVisibilityContext = createContext<AmountVisibilityContextValue>({ hidden: false, toggle: () => {} })

export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem('amounts_hidden') === 'true')

  const toggle = () => setHidden((h) => {
    const next = !h
    localStorage.setItem('amounts_hidden', String(next))
    return next
  })

  return (
    <AmountVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </AmountVisibilityContext.Provider>
  )
}

export const useAmountVisibility = () => useContext(AmountVisibilityContext)

export function Amt({ value }: { value: string | number | null | undefined }) {
  const { hidden } = useAmountVisibility()
  if (hidden) return <span className="select-none tracking-widest text-current opacity-40">••••••</span>
  return <>{value}</>
}
