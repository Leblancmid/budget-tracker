import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoading } from '@/components/PageLoading'
import { useAuth } from '@/context/auth'
import { can, isAdmin } from '@/lib/access'
import { useBriefUnseen } from '@/lib/briefSeen'
import { locate, visibleSections } from '@/lib/navigation'
import { useWaitingLeads } from '@/hooks/useWaitingLeads'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SectionTabs } from './SectionTabs'
import { OfflineBanner } from './OfflineBanner'
import { SyncReviewDialog } from '@/components/offline/SyncReviewDialog'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  const trading = can(user, 'trading')
  const sections = visibleSections({ can: (m) => can(user, m), admin: isAdmin(user) })
  const currentId = locate(pathname).section.id
  const tabs = sections.find((s) => s.id === currentId)?.tabs ?? []
  // Badges: website leads waiting for a reply, and a weekly brief (every Monday) not opened yet
  const leadsWaiting = useWaitingLeads(trading)
  const businessBrief = useBriefUnseen('business')
  const dailyBrief = useBriefUnseen('daily')
  const briefUnseen = { business: businessBrief && trading, daily: dailyBrief }

  return (
    // Pinned to the screen: only <main> scrolls, never the page itself, so the header can't slide
    // up under the phone's status bar
    <div className="fixed inset-0 flex overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        sections={sections.filter((s) => !s.hideInSidebar)}
        leadsWaiting={leadsWaiting}
        briefUnseen={briefUnseen}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />
        <SectionTabs tabs={tabs} leadsWaiting={leadsWaiting} briefUnseen={briefUnseen} />
        <OfflineBanner />
        {/* Changes made offline: asks before sending any */}
        <SyncReviewDialog />
        <main className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 scrollbar-thin">
          {/* Keyed by page so a crash on one page clears when you navigate away */}
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
          {/* Room for the phone's home indicator when installed as an app */}
          <div className="safe-bottom-space" aria-hidden="true" />
        </main>
      </div>
    </div>
  )
}
