import { useLocation } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAmountVisibility } from '@/context/AmountVisibilityContext'

const PAGE_META: Record<string, { title: string; section: string }> = {
  '/':                       { title: 'Dashboard',       section: 'Daily Expenses' },
  '/transactions':            { title: 'Transactions',    section: 'Daily Expenses' },
  '/categories':              { title: 'Categories',      section: 'Daily Expenses' },
  '/budgets':                 { title: 'Budgets',         section: 'Daily Expenses' },
  '/business':                { title: 'Stats',       section: 'Business'       },
  '/business/transactions':   { title: 'Transactions',    section: 'Business'       },
  '/rucoy':                   { title: 'Summary',         section: 'Rucoy'          },
  '/rucoy/golds':             { title: 'Golds',           section: 'Rucoy'          },
  '/rucoy/trades':            { title: 'Trades',          section: 'Rucoy'          },
  '/rucoy/accounts':          { title: 'Accounts',        section: 'Rucoy'          },
  '/rucoy/calculator':        { title: 'Gold Calculator', section: 'Rucoy'          },
  '/master':                  { title: 'Overview',        section: 'Master File'    },
  '/master/savings':          { title: 'Savings',         section: 'Master File'    },
}

const SECTION_STYLES: Record<string, { badge: string }> = {
  'Daily Expenses': { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  'Business':       { badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'         },
  'Rucoy':          { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'     },
  'Master File':    { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
}

export function Header() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { hidden, toggle: toggleAmounts } = useAmountVisibility()

  const meta    = PAGE_META[pathname] ?? { title: "Mikey's Tracker", section: 'Daily Expenses' }
  const styles  = SECTION_STYLES[meta.section] ?? SECTION_STYLES['Daily Expenses']

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700/60 dark:bg-gray-900">

      {/* Left: breadcrumb-style title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={['shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', styles.badge].join(' ')}>
          {meta.section}
        </span>
        <span className="text-gray-300 dark:text-gray-600 text-sm">/</span>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{meta.title}</h1>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleAmounts}
          title={hidden ? 'Show amounts' : 'Hide amounts'}
          className={[
            'flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-medium transition-colors',
            hidden
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300',
          ].join(' ')}
        >
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{hidden ? 'Hidden' : 'Visible'}</span>
        </button>

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
