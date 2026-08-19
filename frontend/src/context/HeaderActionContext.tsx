import { createContext, useContext, useState, type ReactNode } from 'react'

interface HeaderActionContextValue {
  action: ReactNode
  setAction: (node: ReactNode) => void
}

const HeaderActionContext = createContext<HeaderActionContextValue>({
  action: null,
  setAction: () => {},
})

export function HeaderActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<ReactNode>(null)
  return (
    <HeaderActionContext.Provider value={{ action, setAction }}>
      {children}
    </HeaderActionContext.Provider>
  )
}

export function useHeaderAction() {
  return useContext(HeaderActionContext)
}
