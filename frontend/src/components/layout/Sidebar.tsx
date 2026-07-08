import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, Wallet, Gamepad2, Briefcase, FolderOpen, PanelLeftClose, PanelLeftOpen, BarChart2 } from 'lucide-react'

type SectionVariant = 'master' | 'default' | 'business' | 'rucoy' | 'reports'

const SECTION_COLORS: Record<SectionVariant, {
  icon:         string
  iconBg:       string
  activeBg:     string
  activeBorder: string
  activeText:   string
}> = {
  master: {
    icon:         'text-violet-600 dark:text-violet-400',
    iconBg:       'bg-violet-100 dark:bg-violet-900/40',
    activeBg:     'bg-violet-50 dark:bg-violet-900/25',
    activeBorder: 'border-violet-500 dark:border-violet-400',
    activeText:   'text-violet-700 dark:text-violet-300',
  },
  default: {
    icon:         'text-indigo-600 dark:text-indigo-400',
    iconBg:       'bg-indigo-100 dark:bg-indigo-900/40',
    activeBg:     'bg-indigo-50 dark:bg-indigo-900/25',
    activeBorder: 'border-indigo-500 dark:border-indigo-400',
    activeText:   'text-indigo-700 dark:text-indigo-300',
  },
  business: {
    icon:         'text-teal-600 dark:text-teal-400',
    iconBg:       'bg-teal-100 dark:bg-teal-900/40',
    activeBg:     'bg-teal-50 dark:bg-teal-900/25',
    activeBorder: 'border-teal-500 dark:border-teal-400',
    activeText:   'text-teal-700 dark:text-teal-300',
  },
  rucoy: {
    icon:         'text-amber-600 dark:text-amber-400',
    iconBg:       'bg-amber-100 dark:bg-amber-900/40',
    activeBg:     'bg-amber-50 dark:bg-amber-900/25',
    activeBorder: 'border-amber-500 dark:border-amber-400',
    activeText:   'text-amber-700 dark:text-amber-300',
  },
  reports: {
    icon:         'text-sky-600 dark:text-sky-400',
    iconBg:       'bg-sky-100 dark:bg-sky-900/40',
    activeBg:     'bg-sky-50 dark:bg-sky-900/25',
    activeBorder: 'border-sky-500 dark:border-sky-400',
    activeText:   'text-sky-700 dark:text-sky-300',
  },
}

const SECTIONS = [
  {
    id: 'daily',
    label: 'Daily Expenses',
    icon: Wallet,
    variant: 'default' as SectionVariant,
    basePath: '/',
    items: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/transactions', label: 'Transactions', end: false },
      { to: '/categories', label: 'Categories', end: false },
      { to: '/budgets', label: 'Budgets', end: false },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    variant: 'business' as SectionVariant,
    basePath: '/business',
    items: [
      { to: '/business', label: 'Stats', end: true },
      { to: '/business/transactions', label: 'Transactions', end: false },
    ],
  },
  {
    id: 'rucoy',
    label: 'Rucoy',
    icon: Gamepad2,
    variant: 'rucoy' as SectionVariant,
    basePath: '/rucoy',
    items: [
      { to: '/rucoy', label: 'Summary', end: true },
      { to: '/rucoy/golds', label: 'Golds', end: false },
      { to: '/rucoy/trades', label: 'Trades', end: false },
      { to: '/rucoy/accounts', label: 'Accounts', end: false },
      { to: '/rucoy/calculator', label: 'Gold Calculator', end: false },
    ],
  },
  {
    id: 'master',
    label: 'Master File',
    icon: FolderOpen,
    variant: 'master' as SectionVariant,
    basePath: '/master',
    items: [
      { to: '/master', label: 'Overview', end: true },
      { to: '/master/savings', label: 'Savings', end: false },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart2,
    variant: 'reports' as SectionVariant,
    basePath: '/reports',
    items: [
      { to: '/reports/daily-expenses', label: 'Daily Expenses', end: false },
      { to: '/reports/business',       label: 'Business',       end: false },
    ],
  },
]

function isUnderBasePath(pathname: string, basePath: string) {
  if (basePath === '/') return !pathname.startsWith('/rucoy') && !pathname.startsWith('/business') && !pathname.startsWith('/master') && !pathname.startsWith('/reports')
  return pathname === basePath || pathname.startsWith(basePath + '/')
}

const COLLAPSED_KEY = 'sidebar_collapsed'

export function Sidebar() {
  const { pathname } = useLocation()

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true')

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    SECTIONS.forEach((s) => { state[s.id] = isUnderBasePath(pathname, s.basePath) })
    return state
  })

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev))
      return !prev
    })
  }

  return (
    <aside className={[
      'flex h-full shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700/60 dark:bg-gray-900 overflow-y-auto scrollbar-thin overflow-x-hidden transition-all duration-200',
      collapsed ? 'w-[52px]' : 'w-56',
    ].join(' ')}>

      {/* Brand */}
      <div className={['flex items-center border-b border-gray-100 dark:border-gray-700/60 shrink-0', collapsed ? 'justify-center py-3.5 px-0' : 'gap-3 px-4 py-4'].join(' ')}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-400/30">
            <Wallet className="h-4 w-4 text-white" />
          </div>
        ) : (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-400/30">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">Mikey's Tracker</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Finance & Gaming</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          const c = SECTION_COLORS[section.variant]
          const isOpen = open[section.id]
          const isActive = isUnderBasePath(pathname, section.basePath)

          if (collapsed) {
            return (
              <NavLink
                key={section.id}
                to={section.items[0].to}
                title={section.label}
                className={[
                  'flex items-center justify-center h-9 w-9 mx-auto rounded-xl transition-colors',
                  isActive ? c.iconBg : 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                ].join(' ')}
              >
                <Icon className={['h-4 w-4', isActive ? c.icon : 'text-gray-400 dark:text-gray-500'].join(' ')} />
              </NavLink>
            )
          }

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggle(section.id)}
                className={[
                  'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                  isActive ? 'bg-gray-50 dark:bg-gray-800/40' : '',
                ].join(' ')}
              >
                <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', c.iconBg].join(' ')}>
                  <Icon className={['h-3.5 w-3.5', c.icon].join(' ')} />
                </div>
                <span className={['flex-1 text-[13px] font-semibold truncate', isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'].join(' ')}>
                  {section.label}
                </span>
                {isOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                }
              </button>

              {/* Section items */}
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 dark:border-gray-700/60 flex flex-col gap-px mb-1">
                  {section.items.map(({ to, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        [
                          'flex items-center px-2.5 py-1.5 text-[13px] rounded-lg transition-colors border-l-2 -ml-px',
                          isActive
                            ? `${c.activeBg} ${c.activeBorder} ${c.activeText} font-semibold`
                            : `border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200`,
                        ].join(' ')
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={['border-t border-gray-100 dark:border-gray-700/60 shrink-0', collapsed ? 'flex justify-center py-3' : 'flex items-center justify-between px-4 py-3'].join(' ')}>
        {!collapsed && (
          <p className="text-[10px] text-gray-300 dark:text-gray-600 select-none">v1.0</p>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
        >
          {collapsed
            ? <PanelLeftOpen className="h-3.5 w-3.5" />
            : <PanelLeftClose className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </aside>
  )
}