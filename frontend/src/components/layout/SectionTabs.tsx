import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { locate, SECTION_STYLES, type NavTab } from '@/lib/navigation'

interface SectionTabsProps {
  /** This user's tabs for the current section */
  tabs: NavTab[]
  /** Waiting website leads (shown on the Leads tab) */
  leadsWaiting: number
  /** A weekly brief nobody has opened yet (shown on Business → Stats) */
  briefUnseen: boolean
}

/** The current section's pages as tabs under the header. Scrolls sideways on narrow screens. */
export function SectionTabs({ tabs, leadsWaiting, briefUnseen }: SectionTabsProps) {
  const { pathname } = useLocation()
  const { section, tab: current } = locate(pathname)
  const styles = SECTION_STYLES[section.id]
  const activeRef = useRef<HTMLAnchorElement>(null)

  // On a phone the active tab may start off-screen: bring it into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pathname])

  if (tabs.length < 2) return null

  return (
    <nav aria-label={`${section.label} pages`} className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-700/60 dark:bg-gray-900">
      <div className="flex gap-1 overflow-x-auto px-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = current.to === tab.to
          const badge = tab.to === '/business/leads' ? leadsWaiting : 0
          const dot = tab.to === '/business' && briefUnseen
          return (
            <Link
              key={tab.to}
              to={tab.to}
              ref={active ? activeRef : undefined}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors',
                active
                  ? `${styles.tabActive} font-semibold`
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {tab.label}
              {badge > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-4 text-white" aria-label={`${badge} waiting`}>
                  {badge}
                </span>
              )}
              {dot && <span className="h-2 w-2 rounded-full bg-indigo-500" title="New weekly brief" aria-label="New weekly brief" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
