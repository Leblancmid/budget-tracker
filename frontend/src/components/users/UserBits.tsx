import { CandlestickChart, ShieldCheck, Wallet } from 'lucide-react'
import type { UserRole } from '@/context/auth'
import { roleLabel, userStatus } from '@/lib/users'

const ROLE_STYLE = {
  admin: { Icon: ShieldCheck, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  trader: { Icon: CandlestickChart, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  daily_only: { Icon: Wallet, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
} satisfies Record<UserRole, unknown>

/** "Admin" / "Trader" / "Daily Expenses only" as a small pill. */
export function RoleBadge({ role }: { role: UserRole }) {
  const { Icon, tone } = ROLE_STYLE[role]
  return (
    <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', tone].join(' ')}>
      <Icon className="h-3 w-3" />
      {roleLabel(role)}
    </span>
  )
}

const DOT = { active: 'bg-emerald-500', idle: 'bg-gray-300 dark:bg-gray-600', off: 'bg-red-500' }

/** The account's state as one sentence with a coloured dot: "Active · seen 5 min ago". */
export function StatusLine({ user }: { user: { deactivated_at: string | null; last_active_at: string | null } }) {
  const s = userStatus(user)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span className="relative flex h-2 w-2">
        {s.tone === 'active' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />}
        <span className={['relative inline-flex h-2 w-2 rounded-full', DOT[s.tone]].join(' ')} />
      </span>
      {s.text}
    </span>
  )
}
