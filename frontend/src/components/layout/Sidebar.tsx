import { SidebarBrand } from './SidebarBrand'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { locate, SECTION_STYLES, type NavSection, type SectionId } from '@/lib/navigation'
import { readString, STORAGE_KEYS, writeString } from '@/lib/storage'
import { roleLabel } from '@/lib/users'
import { useAuth } from '@/context/auth'
import { Avatar } from '@/components/ui/Avatar'

interface SidebarProps {
  /** This user's sections (see lib/navigation) */
  sections: NavSection[]
  /** Waiting website leads (badge on Business) */
  leadsWaiting: number
  /** Sections with a weekly brief not opened yet this week (a dot) */
  briefUnseen: Partial<Record<SectionId, boolean>>
  mobileOpen?: boolean
  onClose?: () => void
}

/** One row per section; a section's pages are the tabs under the header (SectionTabs). */
export function Sidebar({ sections, leadsWaiting, briefUnseen, mobileOpen = false, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const current = locate(pathname).section.id
  const [collapsed, setCollapsed] = useState(() => readString(STORAGE_KEYS.sidebarCollapsed) === 'true')
  const iconOnly = collapsed && !mobileOpen

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      writeString(STORAGE_KEYS.sidebarCollapsed, String(!prev))
      return !prev
    })
  }

  return (
    <aside className={[
      'safe-top safe-bottom flex h-full shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700/60 dark:bg-gray-900 overflow-y-auto scrollbar-thin overflow-x-hidden transition-all duration-200',
      // Mobile: fixed overlay drawer
      'fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0',
      mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      // Desktop width
      collapsed ? 'md:w-[52px]' : 'md:w-56',
      // Mobile always full-width drawer
      'w-56',
    ].join(' ')}>

      {/* Brand: logo + a live headline number */}
      <div className={['shrink-0 border-b border-gray-100 dark:border-gray-700/60', collapsed ? 'md:flex md:justify-center md:py-3.5 px-3 py-3' : 'px-3 py-3'].join(' ')}>
        <SidebarBrand collapsed={collapsed} onNavigate={onClose} />
      </div>

      <nav aria-label="Sections" className="flex flex-1 flex-col gap-1 p-2">
        {sections.map((section) => {
          const Icon = section.icon
          const c = SECTION_STYLES[section.id]
          const active = current === section.id
          const leads = section.id === 'business' ? leadsWaiting : 0
          const dot = !!briefUnseen[section.id]
          const hint = [section.label, leads ? `${leads} lead${leads === 1 ? '' : 's'} waiting` : null, dot ? 'new weekly brief' : null].filter(Boolean).join(' · ')

          return (
            <Link
              key={section.id}
              to={section.tabs[0].to}
              onClick={onClose}
              title={iconOnly ? hint : undefined}
              aria-label={iconOnly ? hint : undefined}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative flex items-center rounded-xl transition-colors',
                iconOnly ? 'mx-auto h-9 w-9 justify-center' : 'gap-2.5 px-2.5 py-2',
                active ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
              ].join(' ')}
            >
              <span className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', active || !iconOnly ? c.iconBg : ''].join(' ')}>
                <Icon className={['h-3.5 w-3.5', active || !iconOnly ? c.icon : 'text-gray-400 dark:text-gray-500'].join(' ')} />
              </span>
              {!iconOnly && (
                <span className={['flex-1 truncate text-[13px] font-semibold', active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'].join(' ')}>
                  {section.label}
                </span>
              )}
              {/* Waiting leads, else the weekly-brief dot */}
              {leads > 0 ? (
                <span
                  className={['rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-4 text-white', iconOnly ? 'absolute -right-1 -top-1' : ''].join(' ')}
                  aria-hidden={iconOnly ? true : undefined}
                  title={iconOnly ? undefined : `${leads} website lead${leads === 1 ? '' : 's'} waiting`}
                >
                  {leads}
                </span>
              ) : dot ? (
                <span
                  className={['h-2 w-2 rounded-full bg-indigo-500', iconOnly ? 'absolute right-0.5 top-0.5' : ''].join(' ')}
                  title={iconOnly ? undefined : 'New weekly brief'}
                  aria-hidden={iconOnly ? true : undefined}
                />
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Footer: who's signed in (opens the profile), and collapse */}
      <div className={['border-t border-gray-100 dark:border-gray-700/60 shrink-0', iconOnly ? 'flex flex-col items-center gap-2 py-3' : 'flex items-center gap-2 px-2 py-2.5'].join(' ')}>
        {user && (
          <Link
            to="/profile"
            onClick={onClose}
            title={iconOnly ? `${user.name}: your profile` : 'Your profile'}
            aria-label={iconOnly ? `${user.name}: your profile` : undefined}
            className={['flex min-w-0 items-center gap-2.5 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60', iconOnly ? 'p-0.5' : 'flex-1 px-1.5 py-1.5', current === 'account' && !iconOnly ? 'bg-gray-100 dark:bg-gray-800/70' : ''].join(' ')}
          >
            <Avatar user={user} size="sm" />
            {!iconOnly && (
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{user.name}</span>
                <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">{roleLabel(user.role)}</span>
              </span>
            )}
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
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
