import { createContext, useContext } from 'react'

export interface AmountVisibilityContextValue {
  /** True while amounts are masked (the eye toggle in the header) */
  hidden: boolean
  toggle: () => void
}

export const AmountVisibilityContext = createContext<AmountVisibilityContextValue>({ hidden: false, toggle: () => {} })

export const useAmountVisibility = () => useContext(AmountVisibilityContext)
