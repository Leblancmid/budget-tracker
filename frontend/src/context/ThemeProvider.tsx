import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readString, STORAGE_KEYS, writeString } from '@/lib/storage'
import { ThemeContext, type Theme } from './theme'

function initialTheme(): Theme {
  const stored = readString(STORAGE_KEYS.theme)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    // The phone's status bar area follows the header colour (white / gray-900) right away,
    // not only after the app is reopened
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff')
    writeString(STORAGE_KEYS.theme, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value  = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
