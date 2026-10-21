import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/toast'
import { flattenApiErrors } from '@/utils/api'
import { ACCOUNT_COLORS, ACCOUNT_ICONS, colorOf, iconOf } from '@/utils/balanceAccounts'
import type { BalanceAccountPayload } from '@/api/master'
import type { BalanceAccountConfig, BalanceCurrency } from '@/types'

interface ManageBalanceAccountsModalProps {
  open: boolean
  onClose: () => void
  accounts: BalanceAccountConfig[]
  /** Open straight into the "new account" form */
  startWithNew?: boolean
  onCreate:  (data: BalanceAccountPayload) => Promise<unknown>
  onUpdate:  (id: number, data: Partial<BalanceAccountPayload> & { hidden?: boolean }) => Promise<unknown>
  onReorder: (ids: number[]) => Promise<unknown>
  onDelete:  (id: number) => Promise<unknown>
}

const BLANK: BalanceAccountPayload = { name: '', currency: 'PHP', color: 'blue', icon: 'wallet' }

export function ManageBalanceAccountsModal({ open, onClose, accounts, startWithNew, onCreate, onUpdate, onReorder, onDelete }: ManageBalanceAccountsModalProps) {
  // null = list view; 'new' = create form; account = edit form
  const [editing, setEditing] = useState<BalanceAccountConfig | 'new' | null>(null)
  const [form, setForm]       = useState<BalanceAccountPayload>(BLANK)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)
  const [busyId, setBusyId]   = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setConfirmDelete(null)
    if (startWithNew) openForm('new')
    else setEditing(null)
  }, [open, startWithNew]) // eslint-disable-line react-hooks/exhaustive-deps

  const openForm = (target: BalanceAccountConfig | 'new') => {
    setErrors({})
    setEditing(target)
    setForm(target === 'new'
      ? BLANK
      : { name: target.name, currency: target.currency, color: target.color, icon: target.icon })
  }

  const save = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Give the account a name.' }); return }
    setSaving(true)
    try {
      if (editing === 'new') {
        await onCreate({ ...form, name: form.name.trim() })
        toast.success(`${form.name.trim()} added.`)
      } else if (editing) {
        await onUpdate(editing.id, { ...form, name: form.name.trim() })
        toast.success('Account updated.')
      }
      if (startWithNew && editing === 'new') onClose()
      else setEditing(null)
    } catch (err: unknown) {
      setErrors(flattenApiErrors(err) ?? { name: 'Could not save the account.' })
    } finally {
      setSaving(false)
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const ids = accounts.map((a) => a.id)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    try { await onReorder(ids) } catch { toast.error('Could not reorder accounts.') }
  }

  const toggleHidden = async (a: BalanceAccountConfig) => {
    setBusyId(a.id)
    try { await onUpdate(a.id, { hidden: !a.hidden_at }) }
    catch { toast.error('Could not update the account.') }
    finally { setBusyId(null) }
  }

  const remove = async (a: BalanceAccountConfig) => {
    setBusyId(a.id)
    try {
      await onDelete(a.id)
      toast.success(`${a.name} deleted.`)
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Could not delete the account.')
    } finally {
      setBusyId(null)
      setConfirmDelete(null)
    }
  }

  const title = editing === null ? 'Manage Accounts' : editing === 'new' ? 'New Account' : `Edit ${editing.name}`

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {editing === null ? (
        /* ── List view ───────────────────────────────────────────── */
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Choose which accounts appear on your Balance page, their currency, colour, icon and order.
          </p>

          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60 rounded-xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            {accounts.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No accounts yet.</p>
            )}
            {accounts.map((a, i) => {
              const c = colorOf(a.color)
              const Icon = iconOf(a.icon)
              const hidden = !!a.hidden_at
              return (
                <div key={a.id} className={['flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900', hidden ? 'opacity-55' : ''].join(' ')}>
                  <div className="flex flex-col">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                      className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === accounts.length - 1} title="Move down"
                      className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.iconTile].join(' ')}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {a.name}
                      {hidden && <span className="ml-2 text-[10px] font-semibold uppercase text-gray-400">Hidden</span>}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {a.currency} · {a.entry_count} entr{a.entry_count === 1 ? 'y' : 'ies'}
                    </p>
                  </div>

                  {confirmDelete === a.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">Delete?</span>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>No</Button>
                      <Button size="sm" variant="danger" loading={busyId === a.id} onClick={() => remove(a)}>Delete</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => toggleHidden(a)} disabled={busyId === a.id}
                        title={hidden ? 'Show on Balance page' : 'Hide from Balance page'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors">
                        {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button type="button" onClick={() => openForm(a)} title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(a.id)} disabled={a.entry_count > 0}
                        title={a.entry_count > 0 ? 'Has entries — hide it instead, or delete its entries first' : 'Delete'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <span className={['h-2.5 w-2.5 shrink-0 rounded-full', c.swatch].join(' ')} />
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => openForm('new')}>Add Account</Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        /* ── Create / edit form ──────────────────────────────────── */
        <div className="flex flex-col gap-4">
          {/* Live preview */}
          {(() => {
            const c = colorOf(form.color)
            const Icon = iconOf(form.icon)
            return (
              <div className={['flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 px-4 py-3', c.soft].join(' ')}>
                <div className={['flex h-10 w-10 items-center justify-center rounded-xl', c.iconTile].join(' ')}><Icon size={18} /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{form.name.trim() || 'Account name'}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{form.currency} balance</p>
                </div>
                <p className={['ml-auto text-lg font-bold', c.text].join(' ')}>{form.currency === 'PHP' ? '₱' : '$'}0.00</p>
              </div>
            )
          })()}

          <Input
            label="Name"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors({}) }}
            error={errors.name}
            placeholder="e.g. GCash, Wise, Cold wallet"
            autoFocus
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Currency</p>
            <div className="flex gap-2">
              {(['PHP', 'USD'] as BalanceCurrency[]).map((cur) => (
                <button key={cur} type="button" onClick={() => setForm((f) => ({ ...f, currency: cur }))}
                  className={[
                    'flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors',
                    form.currency === cur
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}>
                  {cur === 'PHP' ? '₱ Philippine Peso' : '$ US Dollar'}
                </button>
              ))}
            </div>
            {editing !== 'new' && editing && editing.entry_count > 0 && form.currency !== editing.currency && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                Its {editing.entry_count} existing entries will be read as {form.currency} amounts from now on.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Colour</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACCOUNT_COLORS).map(([key, c]) => (
                <button key={key} type="button" title={c.label} onClick={() => setForm((f) => ({ ...f, color: key }))}
                  className={[
                    'h-7 w-7 rounded-full transition-transform', c.swatch,
                    form.color === key ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-110',
                  ].join(' ')} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Icon</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Object.entries(ACCOUNT_ICONS).map(([key, { label, Icon }]) => (
                <button key={key} type="button" title={label} onClick={() => setForm((f) => ({ ...f, icon: key }))}
                  className={[
                    'flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-medium transition-colors',
                    form.icon === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                  ].join(' ')}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {startWithNew && editing === 'new' ? <span /> : (
              <Button variant="secondary" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => setEditing(null)} disabled={saving}>Back</Button>
            )}
            <div className="flex gap-2">
              {startWithNew && editing === 'new' && <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>}
              <Button onClick={save} loading={saving}>{editing === 'new' ? 'Add Account' : 'Save Changes'}</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
