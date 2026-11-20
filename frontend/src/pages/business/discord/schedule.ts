import type { DiscordSchedule } from '@/api/business'

/** When a server gets auto-posts (some servers allow one ad a day) */
export const SCHEDULE_OPTIONS: { value: DiscordSchedule; label: string; hint: string }[] = [
  { value: 'both', label: '10 AM + 10 PM', hint: 'Twice a day' },
  { value: 'am', label: '10 AM only', hint: 'Once a day' },
  { value: 'pm', label: '10 PM only', hint: 'Once a day' },
  { value: 'manual', label: 'Manual only', hint: 'Only when you tap Send' },
]

/** Short form for the server row, e.g. "10 AM only" */
export const scheduleLabel = (s: DiscordSchedule | undefined) =>
  SCHEDULE_OPTIONS.find((o) => o.value === (s ?? 'both'))?.label ?? '10 AM + 10 PM'

/** Does this server get the 10 AM ('am') or 10 PM ('pm') auto-post? */
export const getsRun = (s: DiscordSchedule | undefined, run: 'am' | 'pm') => (s ?? 'both') === 'both' || s === run
