import { Coins, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { RucoyTxKind } from '@/components/modals/RucoyTransactionModal'

/** First step of "Add Transaction": choose an account sale or a gold trade. */
export function TypePickerModal({ open, onClose, onPick }: {
  open: boolean
  onClose: () => void
  onPick: (kind: RucoyTxKind) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add Transaction" size="sm">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onPick('account')}
          className="flex items-center gap-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-900/10 px-5 py-4 text-left hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Account</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Track an account sale with gold pricing</p>
          </div>
        </button>
        <button
          onClick={() => onPick('gold')}
          className="flex items-center gap-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-5 py-4 text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Gold</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Record a gold sale with gold and PHP pricing</p>
          </div>
        </button>
      </div>
    </Modal>
  )
}
