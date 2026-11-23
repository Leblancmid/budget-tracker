import { Copy, ExternalLink, MessageCircle, Phone, User as UserIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Amt } from '@/components/ui/Amt'
import type { LikelyBuyer } from '@/api/business'
import { toast } from '@/lib/toast'
import { formatCurrency, formatShortDate } from '@/utils/format'

/** A buyer's contact as a link (WhatsApp number → wa.me) or text to copy (Discord name) */
function ContactLink({ contact }: { contact: NonNullable<LikelyBuyer['contact']> }) {
  const digits = contact.contact.replace(/\D/g, '')
  if (contact.method === 'whatsapp' && digits.length >= 8) {
    return (
      <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Phone size={12} /> {contact.contact} <ExternalLink size={10} />
      </a>
    )
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(contact.contact); toast.success('Copied. Paste it in Discord to find them.') }
    catch { toast.error(`Their Discord: ${contact.contact}`) }
  }
  return (
    <button type="button" onClick={copy} title="Copy" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
      <MessageCircle size={12} /> {contact.contact} <Copy size={10} />
    </button>
  )
}

/** Past buyers of accounts like this one: who to message before posting ads. */
export function LikelyBuyersModal({ title, buyers, onClose }: { title: string; buyers: LikelyBuyer[]; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Who bought one like ${title}`} size="md">
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        They bought the same build within 40 levels. Message them before posting ads: regulars buy faster.
      </p>
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        {buyers.map((b) => (
          <li key={b.name} className="flex items-start gap-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              <UserIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {b.name}
                {b.similar > 1 && <span className="ml-1.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">bought {b.similar} like this</span>}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {b.closest.description}
                {b.closest.price_php != null && <> for <Amt value={formatCurrency(b.closest.price_php)} /></>}
                {b.closest.sold_on && <span className="text-gray-400"> · {formatShortDate(b.closest.sold_on)}</span>}
              </p>
              {b.contact
                ? <ContactLink contact={b.contact} />
                : <p className="text-[11px] text-gray-400 dark:text-gray-500">No contact saved: find them by name in your Discord DMs.</p>}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
