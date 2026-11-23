import { useState, type FormEvent } from 'react'
import { Pencil, Target } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Amt } from '@/components/ui/Amt'
import { businessDashboardApi } from '@/api/business'
import type { ProfitGoalProgress } from '@/types'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/format'

/** Set, change or remove the monthly profit goal. Opened fresh each time (keyed by the caller). */
function GoalModal({ current, onClose, onSaved }: { current: number | null; onClose: () => void; onSaved: () => unknown }) {
  const [value, setValue] = useState(current != null ? String(current) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const save = async (goal: number | null) => {
    setSaving(true)
    try {
      await businessDashboardApi.setGoal(goal)
      toast.success(goal == null ? 'Goal removed.' : `Goal set: ${formatCurrency(goal)} profit a month.`)
      await onSaved()
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not save the goal.'))
    } finally {
      setSaving(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const goal = Number(value.replace(/[,₱\s]/g, ''))
    if (!Number.isFinite(goal) || goal <= 0) { setError('Enter the profit you want each month, e.g. 20000.'); return }
    void save(goal)
  }

  return (
    <Modal open onClose={onClose} title="Monthly profit goal" size="sm">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Profit you want each month (₱)"
          inputMode="decimal"
          autoFocus
          placeholder="20000"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(undefined) }}
          error={error}
        />
        <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
          Counts sold profit, like the number above. It stays the same every month until you change it.
        </p>
        <div className="modal-footer flex justify-between gap-3">
          {current != null
            ? <Button type="button" variant="ghost" onClick={() => save(null)} disabled={saving}>Remove goal</Button>
            : <span />}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

const STATUS: Record<ProfitGoalProgress['status'], { text: string; tone: string; bar: string }> = {
  reached:  { text: 'Goal reached', tone: 'text-emerald-300', bar: 'bg-emerald-400' },
  on_pace:  { text: 'On pace', tone: 'text-emerald-300', bar: 'bg-teal-400' },
  behind:   { text: 'Behind pace', tone: 'text-amber-300', bar: 'bg-amber-400' },
  missed:   { text: 'Missed', tone: 'text-red-300', bar: 'bg-red-400' },
  upcoming: { text: 'Not started', tone: 'text-slate-400', bar: 'bg-slate-500' },
}

/**
 * The monthly profit goal in the dark hero: progress, and for this month whether you're on pace
 * and what you still need a day. Without a goal: a link to set one.
 */
export function ProfitGoal({ goal, onChanged }: { goal: ProfitGoalProgress | null | undefined; onChanged: () => unknown }) {
  const [editing, setEditing] = useState(false)
  const modal = editing && <GoalModal key="goal" current={goal?.goal_php ?? null} onClose={() => setEditing(false)} onSaved={onChanged} />

  if (!goal) {
    return (
      <>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10">
          <Target size={13} /> Set a monthly profit goal
        </button>
        {modal}
      </>
    )
  }

  const s = STATUS[goal.status]
  const pct = Math.min(goal.percent, 100)
  const pacePct = goal.expected_php != null ? Math.min((goal.expected_php / goal.goal_php) * 100, 100) : null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <Target size={13} className="text-slate-400" />
        <span className="text-slate-400">Goal <b className="text-slate-200"><Amt value={formatCurrency(goal.goal_php)} /></b></span>
        <span className={`font-semibold ${s.tone}`}>· {s.text} ({Math.round(goal.percent)}%)</span>
        <button type="button" onClick={() => setEditing(true)} title="Change the goal" aria-label="Change the goal" className="ml-auto rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300">
          <Pencil size={12} />
        </button>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(goal.percent)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to the monthly profit goal">
        <span className={`absolute inset-y-0 left-0 rounded-full ${s.bar}`} style={{ width: `${Math.max(pct, 0)}%` }} />
        {/* Where an even pace would be by today */}
        {pacePct != null && <span className="absolute inset-y-0 w-0.5 bg-white/70" style={{ left: `${pacePct}%` }} title="Even pace by today" />}
      </div>
      {goal.status === 'behind' && goal.needed_per_day != null && goal.days_left != null && (
        <p className="text-[11px] text-slate-400">
          Need <b className="text-slate-200"><Amt value={formatCurrency(goal.needed_per_day)} /></b> profit a day for the {goal.days_left} day{goal.days_left === 1 ? '' : 's'} left.
        </p>
      )}
      {goal.status === 'on_pace' && goal.days_left != null && (
        <p className="text-[11px] text-slate-400">
          <Amt value={formatCurrency(goal.goal_php - goal.profit_php)} /> to go, {goal.days_left} day{goal.days_left === 1 ? '' : 's'} left.
        </p>
      )}
      {modal}
    </div>
  )
}
