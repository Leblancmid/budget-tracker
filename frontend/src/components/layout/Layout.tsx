import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}