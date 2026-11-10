import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoading } from '@/components/PageLoading'
import { useAuth } from '@/context/auth'
import { useBriefUnseen } from '@/lib/briefSeen'
import { locate, visibleSections } from '@/lib/navigation'
import { useWaitingLeads } from '@/hooks/useWaitingLeads'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SectionTabs } from './SectionTabs'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  const isAdmin = user?.role !== 'daily_only'
  const sections = visibleSections(isAdmin)
  const currentId = locate(pathname).section.id
  const tabs = sections.find((s) => s.id === currentId)?.tabs ?? []
  // Badges: website leads waiting for a reply, and a weekly brief (every Monday) not opened yet
  const leadsWaiting = useWaitingLeads(isAdmin)
  const businessBrief = useBriefUnseen('business')
  const dailyBrief = useBriefUnseen('daily')
  const briefUnseen = { business: businessBrief && isAdmin, daily: dailyBrief }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        sections={sections}
        leadsWaiting={leadsWaiting}
        briefUnseen={briefUnseen}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />
        <SectionTabs tabs={tabs} leadsWaiting={leadsWaiting} briefUnseen={briefUnseen} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin">
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
