import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Wallet, Gamepad2, Briefcase } from 'lucide-react'

type SectionVariant = 'default' | 'rucoy' | 'business'

const SECTION_COLORS: Record<SectionVariant, { header: string; activeBg: string; activeText: string; dot: string }> = {
  default: {
    header:     'bg-indigo-600 hover:bg-indigo-700',
    activeBg:   'bg-indigo-700/30',
    activeText: 'text-indigo-100',
    dot:        'bg-indigo-300',
  },
  rucoy: {
    header:     'bg-amber-600 hover:bg-amber-700',
    activeBg:   'bg-amber-700/30',
    activeText: 'text-amber-100',
    dot:        'bg-amber-300',
  },
  business: {
    header:     'bg-teal-600 hover:bg-teal-700',
    activeBg:   'bg-teal-700/30',
    activeText: 'text-teal-100',
    dot:        'bg-teal-300',
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
      { to: '/',             label: 'Dashboard',    end: true  },
      { to: '/transactions', label: 'Transactions', end: false },
      { to: '/categories',   label: 'Categories',   end: false },
      { to: '/budgets',      label: 'Budgets',      end: false },
    ],
  },
  {
    id: 'rucoy',
    label: 'Rucoy',
    icon: Gamepad2,
    variant: 'rucoy' as SectionVariant,
    basePath: '/rucoy',
    items: [
      { to: '/rucoy',            label: 'Dashboard',       end: true  },
      { to: '/rucoy/golds',      label: 'Golds',           end: false },
      { to: '/rucoy/trades',     label: 'Trades',          end: false },
      { to: '/rucoy/accounts',   label: 'Accounts',        end: false },
      { to: '/rucoy/calculator', label: 'Gold Calculator', end: false },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    variant: 'business' as SectionVariant,
    basePath: '/business',
    items: [
      { to: '/business',                label: 'Dashboard',    end: true  },
      { to: '/business/transactions',   label: 'Transactions', end: false },
      { to: '/business/categories',     label: 'Categories',   end: false },
      { to: '/business/budgets',        label: 'Budgets',      end: false },
    ],
  },
]

function isUnderBasePath(pathname: string, basePath: string) {
  if (basePath === '/') return !pathname.startsWith('/rucoy') && !pathname.startsWith('/business')
  return pathname === basePath || pathname.startsWith(basePath + '/')
}

export function Sidebar() {
  const { pathname } = useLocation()

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    SECTIONS.forEach((s) => {
      state[s.id] = isUnderBasePath(pathname, s.basePath)
    })
    return state
  })

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Mikey's Tracker</span>
      </div>

      <nav className="flex flex-col gap-1 p-2 flex-1">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          const colors = SECTION_COLORS[section.variant]
          const isOpen = open[section.id]

          return (
            <div key={section.id} className="flex flex-col rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className={[
                  'flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-colors rounded-lg',
                  colors.header,
                ].join(' ')}
              >
                <Icon className="h-4 w-4 text-white shrink-0" />
                <span className="flex-1 text-sm font-semibold text-white truncate">{section.label}</span>
                {isOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-white/70 shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-white/70 shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="flex flex-col mt-0.5 gap-px">
                  {section.items.map(({ to, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-2.5 pl-4 pr-3 py-2 text-sm transition-colors rounded-md',
                          isActive
                            ? `${colors.activeBg} ${colors.activeText} font-medium`
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={['h-1.5 w-1.5 rounded-full shrink-0', isActive ? colors.dot : 'bg-gray-300 dark:bg-gray-600'].join(' ')} />
                          {label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
