import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Target, Wallet } from 'lucide-react'

const NAV = [
  { to: '/',             label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories',   label: 'Categories',   icon: Tag },
  { to: '/budgets',      label: 'Budgets',      icon: Target },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">Budget Tracker</span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={['h-4 w-4', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'].join(' ')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
