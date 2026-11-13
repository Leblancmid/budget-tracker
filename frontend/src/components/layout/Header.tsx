import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff, LogOut, Menu as MenuIcon, UserRound, Users, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationsBell } from './NotificationsBell'
import { Menu } from '@/components/ui/Menu'
import { QuickAddModal } from '@/components/modals/QuickAddModal'
import { useTheme } from '@/context/theme'
import { useAmountVisibility } from '@/context/amountVisibility'
import { useAuth } from '@/context/auth'
import { can, isAdmin } from '@/lib/access'
import { locate, SECTION_STYLES } from '@/lib/navigation'
import { usePendingEntries } from '@/lib/offline/outbox'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface HeaderProps {
  onMenuClick?: () => void
}

/** Below the sm breakpoint, where the header hides its theme button */
const isPhoneWidth = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches

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
    <header className="app-header flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 sm:pr-[max(1.5rem,env(safe-area-inset-right))] dark:border-gray-700/60 dark:bg-gray-900">

      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        title="Open menu"
        className="md:hidden -ml-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Left: breadcrumb-style title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Phones: just the page name (the tabs and the menu already show the section) */}
        <span className={['hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide sm:inline', styles.badge].join(' ')}>
          {meta.section}
        </span>
        <span className="hidden text-gray-300 dark:text-gray-600 text-sm sm:inline">/</span>
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate sm:text-sm">{meta.title}</h1>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-0.5 shrink-0 sm:gap-1">
        <button
          onClick={() => setQuickAdd(true)}
          title="Quick add (Ctrl+K): type one line like 250 lunch gcash"
          aria-label="Quick add"
          className="mr-1 flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors sm:h-8 sm:min-w-0"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick add</span>
          <kbd className="hidden lg:inline rounded bg-white/20 px-1 text-[10px] font-medium">Ctrl K</kbd>
        </button>

        <button
          onClick={toggleAmounts}
          title={hidden ? 'Show amounts' : 'Hide amounts'}
          aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
          aria-pressed={hidden}
          className={[
            'flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors sm:h-8 sm:min-w-0',
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
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && <NotificationsBell />}

        {user && (
          <div className="ml-1">
            <Menu
              label="Account menu"
              trigger={<Avatar user={user} size="sm" className="ring-2 ring-transparent transition-shadow hover:ring-indigo-200 dark:hover:ring-indigo-800" />}
              header={
                <div className="flex items-center gap-2.5">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              }
              items={[
                { label: 'Your profile', icon: <UserRound className="h-4 w-4" />, onSelect: () => navigate('/profile') },
                { label: 'Users', icon: <Users className="h-4 w-4" />, onSelect: () => navigate('/users'), hidden: !isAdmin(user) },
                // Phones: the theme switch lives here (the header has no room for it)
                { label: theme === 'dark' ? 'Light mode' : 'Dark mode', icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, onSelect: toggle, hidden: !isPhoneWidth() },
                { label: 'Sign out', icon: <LogOut className="h-4 w-4" />, onSelect: handleLogout, danger: true },
              ]}
            />
          </div>
        )}
      </div>
      {quickAdd && <QuickAddModal access={{ trading: can(user, 'trading'), wallets: can(user, 'wallets') }} onClose={() => setQuickAdd(false)} />}
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
