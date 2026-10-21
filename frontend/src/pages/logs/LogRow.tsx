import { Archive, Monitor, Pencil, Smartphone, User } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import type { LogEntry } from '@/api/logs'
import { ChangeList } from './ChangeList'
import {
  MODULE_STYLES, TYPE_LABEL, detectDevice, eventOf, formatAmount, formatDateTime, formatTimeOnly, isPositiveEntry, timeAgo,
} from './logFormat'

/** One entry on the timeline: time, module icon, details and amount (plus the diff for edits). */
export function LogRow({ entry: e }: { entry: LogEntry }) {
  const s = MODULE_STYLES[e.module]
  const positive = isPositiveEntry(e)
  const device = detectDevice(e.user_agent)
  const ev = eventOf(e)

  return (
    <div className="flex gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
      <div className="flex w-14 shrink-0 flex-col items-end pt-1 text-[11px] text-gray-400 dark:text-gray-500" title={formatDateTime(e.created_at)}>
        {formatTimeOnly(e.created_at)}
      </div>
      <div className="relative">
        <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', s.tile].join(' ')}><s.Icon size={15} /></span>
        {ev !== 'created' && (
          <span className={['absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900', ev === 'edited' ? 'bg-indigo-500' : 'bg-amber-500'].join(' ')}>
            {ev === 'edited' ? <Pencil size={8} className="text-white" /> : <Archive size={8} className="text-white" />}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {e.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
              <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', s.badge].join(' ')}>{s.label}</span>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{TYPE_LABEL[e.type] ?? e.type}</span>
              {e.account_name && <span>· {e.account_name}</span>}
              {e.user_name && <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400"><User className="h-3 w-3" />{e.user_name}</span>}
              {device && (
                <span className="flex items-center gap-0.5" title={e.ip_address ? `IP ${e.ip_address}` : undefined}>
                  {device === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                  {device === 'mobile' ? 'Mobile' : 'Desktop'}
                </span>
              )}
              {e.ip_address && <span className="hidden font-mono text-[10px] md:inline">{e.ip_address}</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            {e.amount != null && (
              <span className={['text-sm font-bold whitespace-nowrap', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                {positive ? '+' : '−'}<Amt value={formatAmount(e)} />
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(e.created_at)}</span>
          </div>
        </div>
        {ev === 'edited' && <ChangeList entry={e} />}
      </div>
    </div>
  )
}
