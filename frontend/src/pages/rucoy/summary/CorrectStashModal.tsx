import { useState } from 'react'
import { Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { goldStashApi } from '@/api/rucoy'
import { toast } from '@/lib/toast'

/**
 * Set the stash to the gold actually on hand: one correction entry is recorded for the
 * difference. Mount it only while open so it starts empty.
 */
export function CorrectStashModal({ totalGold, onClose, onCorrected }: {
  totalGold: number
  onClose: () => void
  /** Reload the stash and history; awaited before the modal closes */
  onCorrected: () => Promise<unknown>
}) {
  const [fixActual, setFixActual] = useState('')
  const [fixNote, setFixNote]     = useState('')
  const [fixing, setFixing]       = useState(false)

  const actual = parseFloat(fixActual)
  const valid  = fixActual !== '' && !isNaN(actual)
  const delta  = valid ? actual - totalGold : 0

  const handleFix = async () => {
    if (!valid) return
    setFixing(true)
    try {
      const r = await goldStashApi.adjust(actual, fixNote.trim())
      await onCorrected()
      toast.success(r.delta === 0 ? 'Stash already matches.' : `Stash corrected by ${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta).toLocaleString()} G — now ${r.stash.toLocaleString()} G.`)
      onClose()
    } catch {
      toast.error('Could not correct the stash.')
    } finally {
      setFixing(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Correct stash" size="md">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the gold you <b>actually have</b> in game. One correction entry is recorded for the difference, so the stash matches from now on.
        </p>
        <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stash right now</span>
          <span className={['text-sm font-bold', totalGold < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>{totalGold.toLocaleString()} G</span>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Actual gold on hand</p>
          <div className="flex items-center gap-2 rounded-xl border-2 border-amber-200 dark:border-amber-900/60 px-4 py-3 focus-within:border-amber-400">
            <Coins className="h-5 w-5 shrink-0 text-amber-500" />
            <input
              autoFocus
              inputMode="decimal"
              aria-label="Actual gold on hand"
              value={fixActual ? Number(fixActual).toLocaleString('en', { maximumFractionDigits: 0 }) : ''}
              onChange={(e) => {
                const s = e.target.value.replace(/,/g, '')
                if (s === '' || /^\d*$/.test(s)) setFixActual(s)
              }}
              placeholder="e.g. 99,000,000"
              className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
            />
            <span className="text-lg font-semibold text-amber-500">G</span>
          </div>
        </div>
        <Input label="Note (optional)" value={fixNote} onChange={(e) => setFixNote(e.target.value)} placeholder="Stash correction" />
        {valid && (
          <div className={['rounded-xl px-4 py-3 text-sm', delta === 0 ? 'bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400' : delta > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'].join(' ')}>
            {delta === 0
              ? 'Already matches — nothing to record.'
              : <>Records <b>{delta > 0 ? '+' : '−'}{Math.abs(delta).toLocaleString()} G</b> so the stash becomes <b>{actual.toLocaleString()} G</b>.</>}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={fixing}>Cancel</Button>
          <Button onClick={handleFix} loading={fixing} disabled={!valid || delta === 0}>Correct stash</Button>
        </div>
      </div>
    </Modal>
  )
}
