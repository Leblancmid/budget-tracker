import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff, LogOut, Menu, Zap } from 'lucide-react'
import { QuickAddModal } from '@/components/modals/QuickAddModal'
import { useTheme } from '@/context/theme'
import { useAmountVisibility } from '@/context/amountVisibility'
import { useAuth } from '@/context/auth'
import { locate, SECTION_STYLES } from '@/lib/navigation'
import { usePendingEntries } from '@/lib/offline/outbox'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { theme, toggle } = useTheme()
  const { hidden, toggle: toggleAmounts } = useAmountVisibility()
  const { logout, user } = useAuth()
  const [quickAdd, setQuickAdd] = useState(false)

  // Ctrl+K (⌘K on Mac) opens Quick Add from any page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setQuickAdd(true) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const where  = locate(pathname)
  const meta   = { title: where.title, section: where.section.label }
  const styles = SECTION_STYLES[where.section.id]

  // Browser tab shows the current page instead of a fixed app name
  useEffect(() => { document.title = `${meta.title} · ${meta.section}` }, [meta.title, meta.section])

  const pending = usePendingEntries()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }
  // Entries added offline and not sent yet: say so before signing out
  const handleLogout = () => (pending.length > 0 ? setConfirmLogout(true) : signOut())

  return (
    <header className="app-header flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-6 dark:border-gray-700/60 dark:bg-gray-900">

      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors mr-2"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Left: breadcrumb-style title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className={['shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', styles.badge].join(' ')}>
          {meta.section}
        </span>
        <span className="text-gray-300 dark:text-gray-600 text-sm">/</span>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{meta.title}</h1>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setQuickAdd(true)}
          title="Quick add (Ctrl+K): type one line like 250 lunch gcash"
          aria-label="Quick add"
          className="mr-1 flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick add</span>
          <kbd className="hidden lg:inline rounded bg-white/20 px-1 text-[10px] font-medium">Ctrl K</kbd>
        </button>

        <button
          onClick={toggleAmounts}
          title={hidden ? 'Show amounts' : 'Hide amounts'}
          className={[
            'flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-medium transition-colors',
            hidden
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300',
          ].join(' ')}
        >
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{hidden ? 'Hidden' : 'Visible'}</span>
        </button>

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      {quickAdd && <QuickAddModal isAdmin={user?.role !== 'daily_only'} onClose={() => setQuickAdd(false)} />}
      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); void signOut() }}
        title="Sign out with changes not synced?"
        confirmLabel="Sign out"
        message={`${pending.length} change${pending.length === 1 ? '' : 's'} made offline ${pending.length === 1 ? 'hasn\'t' : 'haven\'t'} reached the server yet. ${pending.length === 1 ? 'It stays' : 'They stay'} on this device and ${pending.length === 1 ? 'is' : 'are'} sent the next time you sign in here.`}
      />
    </header>
  )
}
