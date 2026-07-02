import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Tag, Target, Wallet,
  Gamepad2, CircleDollarSign, Repeat2, Users, Calculator,
} from 'lucide-react'

const DAILY_EXPENSES_NAV = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories',   label: 'Categories',   icon: Tag },
  { to: '/budgets',      label: 'Budgets',      icon: Target },
]

const RUCOY_NAV = [
  { to: '/rucoy',            label: 'Dashboard',       icon: Gamepad2 },
  { to: '/rucoy/golds',      label: 'Golds',           icon: CircleDollarSign },
  { to: '/rucoy/trades',     label: 'Trades',          icon: Repeat2 },
  { to: '/rucoy/accounts',   label: 'Accounts',        icon: Users },
  { to: '/rucoy/calculator', label: 'Gold Calculator', icon: Calculator },
]

const BUSINESS_NAV = [
  { to: '/business',                label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/business/transactions',   label: 'Transactions', icon: ArrowLeftRight },
  { to: '/business/categories',     label: 'Categories',   icon: Tag },
  { to: '/business/budgets',        label: 'Budgets',      icon: Target },
]

type SectionVariant = 'default' | 'rucoy' | 'business'

const SECTION_COLORS: Record<SectionVariant, { label: string; active: string; activeBg: string; activeIcon: string }> = {
  default: {
    label:      'text-gray-400 dark:text-gray-500',
    active:     'text-indigo-700 dark:text-indigo-400',
    activeBg:   'bg-indigo-50 dark:bg-indigo-900/30',
    activeIcon: 'text-indigo-600 dark:text-indigo-400',
  },
  rucoy: {
    label:      'text-amber-500 dark:text-amber-400',
    active:     'text-amber-700 dark:text-amber-400',
    activeBg:   'bg-amber-50 dark:bg-amber-900/20',
    activeIcon: 'text-amber-600 dark:text-amber-400',
  },
  business: {
    label:      'text-teal-500 dark:text-teal-400',
    active:     'text-teal-700 dark:text-teal-400',
    activeBg:   'bg-teal-50 dark:bg-teal-900/20',
    activeIcon: 'text-teal-600 dark:text-teal-400',
  },
}

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
        <NavSection label="Daily Expenses" items={DAILY_EXPENSES_NAV} variant="default" />
        <NavSection label="Rucoy"          items={RUCOY_NAV}          variant="rucoy"   />
        <NavSection label="Business"       items={BUSINESS_NAV}       variant="business" />
      </nav>
    </aside>
  )
}

function NavSection({
  label,
  items,
  variant = 'default',
}: {
  label: string
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
  variant?: SectionVariant
}) {
  const colors = SECTION_COLORS[variant]

  return (
    <div className="flex flex-col gap-0.5">
      <p className={['px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest', colors.label].join(' ')}>
        {label}
      </p>
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/' || to === '/rucoy' || to === '/business'}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? `${colors.activeBg} ${colors.active}`
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={['h-4 w-4', isActive ? colors.activeIcon : 'text-gray-400 dark:text-gray-500'].join(' ')} />
              {itemLabel}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
