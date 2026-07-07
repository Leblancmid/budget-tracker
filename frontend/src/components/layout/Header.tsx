import { useLocation } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAmountVisibility } from '@/context/AmountVisibilityContext'

const TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/transactions':   'Transactions',
  '/categories':     'Categories',
  '/budgets':        'Budgets',
  '/rucoy':          'Rucoy Dashboard',
  '/rucoy/golds':    'Golds',
  '/rucoy/trades':   'Trades',
  '/rucoy/accounts': 'Accounts',
}

export function Header() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { hidden, toggle: toggleAmounts } = useAmountVisibility()
  const title = TITLES[pathname] ?? 'Mikey\'s Tracker'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleAmounts}
          title={hidden ? 'Show amounts' : 'Hide amounts'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
