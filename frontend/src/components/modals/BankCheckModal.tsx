import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Amt } from '@/components/ui/Amt'
import { balanceAccountsApi } from '@/api/master'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { fmtIn } from '@/utils/balanceAccounts'
import { formatWithCommas, handleAmountInput } from '@/utils/format'
import type { BalanceAccountConfig } from '@/types'

/**
 * Bank check: type what the bank / e-wallet app shows right now. Any difference from the
 * app's balance is recorded as one adjustment entry, so the two match again.
 * Mount it only while open so it starts fresh.
 */
export function BankCheckModal({ account, balance, onClose, onDone }: {
  account: BalanceAccountConfig
  /** The app's current balance of this account */
  balance: number
  onClose: () => void
  onDone: () => Promise<unknown> | void
}) {
  const [actual, setActual] = useState('')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  const actualNum = actual !== '' && actual !== '-' ? Number(actual) : null
  const diff = actualNum != null ? Math.round((actualNum - balance) * 100) / 100 : null
  const matches = diff != null && Math.abs(diff) < 0.01

  const submit = async () => {
    if (actualNum == null || !Number.isFinite(actualNum)) { setError(`Enter the balance ${account.name} shows.`); return }
    setSaving(true)
    try {
      const res = await balanceAccountsApi.check(account.id, actualNum, note.trim() || null)
      toast.success(Math.abs(res.difference) < 0.01
        ? `${account.name} matches the bank.`
        : `${account.name} fixed: ${res.difference > 0 ? '+' : '−'}${fmtIn(account, Math.abs(res.difference))} recorded.`)
      await onDone()
      onClose()
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat?.actual) setError(flat.actual)
      else toast.error(errorMessage(err, 'Could not save the check.'))
    } finally {
      setSaving(false)
    }
  }

  const sym = account.currency === 'USD' ? '$' : '₱'

  return (
    <Modal open onClose={onClose} title={`Check ${account.name}`} size="md">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Open your {account.name} app and type the balance it shows. If it's different, the difference is added as one
          entry so the app matches your bank again.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">In this app</p>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100"><Amt value={fmtIn(account, balance)} /></p>
          </div>
          <div>
            <label htmlFor="bank-actual" className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">{account.name} shows</label>
            <div className={['flex items-center gap-1.5 rounded-lg border bg-white px-3 dark:bg-gray-800', error ? 'border-red-400' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-gray-600'].join(' ')}>
              <span className="font-bold text-gray-400">{sym}</span>
              <input
                id="bank-actual"
                autoFocus
                type="text"
                inputMode="decimal"
                value={formatWithCommas(actual)}
                onChange={(e) => handleAmountInput(e.target.value, (v) => { setActual(v); setError(undefined) })}
                placeholder="0.00"
                className="w-full bg-transparent py-2 text-base font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
              />
            </div>
          </div>
        </div>
        {error && <p className="-mt-2 text-xs text-red-500">{error}</p>}

        {diff != null && (
          matches ? (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <CheckCircle2 size={16} /> It matches. Saving just marks {account.name} as checked today.
            </p>
          ) : (
            <p className={['rounded-xl px-3 py-2.5 text-sm', diff > 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'].join(' ')}>
              The bank has <b><Amt value={fmtIn(account, Math.abs(diff))} /></b> {diff > 0 ? 'more' : 'less'} than the app.{' '}
              {diff > 0 ? 'Usually interest, a refund or income you didn\'t record.' : 'Usually a fee or a spend you didn\'t record.'}{' '}
              Saving adds one <b>{diff > 0 ? 'Add' : 'Sell'}</b> of that amount, dated today.
            </p>
          )
        )}

        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. forgot a Grab ride" maxLength={100} />

        <div className="modal-footer flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={actualNum == null}>{matches ? 'Mark as checked' : 'Match to bank'}</Button>
        </div>
      </form>
    </Modal>
  )
}
