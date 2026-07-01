import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Tag, Target, Wallet,
  Gamepad2, CircleDollarSign, Repeat2, Users, Calculator,
} from 'lucide-react'

const BUDGET_NAV = [
  { to: '/',             label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories',   label: 'Categories',   icon: Tag },
  { to: '/budgets',      label: 'Budgets',      icon: Target },
]

const RUCOY_NAV = [
  { to: '/rucoy',          label: 'Dashboard', icon: Gamepad2 },
  { to: '/rucoy/golds',    label: 'Golds',     icon: CircleDollarSign },
  { to: '/rucoy/trades',   label: 'Trades',    icon: Repeat2 },
  { to: '/rucoy/accounts',    label: 'Accounts',        icon: Users },
  { to: '/rucoy/calculator', label: 'Gold Calculator', icon: Calculator },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">Mikey's Tracker</span>
      </div>

      <nav className="flex flex-col gap-4 p-3 flex-1">
        <NavSection label="Budget Tracker" items={BUDGET_NAV} />
        <NavSection label="Rucoy" items={RUCOY_NAV} rucoy />
      </nav>
    </aside>
  )
}

function NavSection({
  label,
  items,
  rucoy = false,
}: {
  label: string
  items: typeof BUDGET_NAV
  rucoy?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className={[
        'px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest',
        rucoy ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
      ].join(' ')}>
        {label}
      </p>
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/' || to === '/rucoy'}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? rucoy
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={[
                'h-4 w-4',
                isActive
                  ? rucoy ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500',
              ].join(' ')} />
              {itemLabel}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
