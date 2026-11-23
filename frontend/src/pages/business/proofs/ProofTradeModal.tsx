import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Star, Trash2, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { proofTradesApi, type ProofTrade, type ProofTradeFields } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { todayManila } from '@/utils/format'

const MAX_FILES = 20
const MAX_MB = 10

/** Previews for files picked but not uploaded yet (object URLs, freed when they change) */
function usePreviews(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return urls
}

/**
 * Add or edit a proven trade: title, value, date, a quote, and screenshots. Opened fresh for each
 * trade (keyed by the caller). Editing saves only what changed; screenshots of an existing trade
 * are added, made the cover or removed straight away.
 */
export function ProofTradeModal({ trade, onClose, onSaved }: {
  trade: ProofTrade | null
  onClose: () => void
  onSaved: () => unknown
}) {
  const [title, setTitle]       = useState(trade?.title ?? '')
  const [value, setValue]       = useState(trade ? String(trade.value) : '')
  const [currency, setCurrency] = useState<ProofTrade['currency']>(trade?.currency ?? 'EUR')
  const [tradedOn, setTradedOn] = useState(trade?.traded_on ?? '')
  const [quote, setQuote]       = useState(trade?.quote ?? '')
  const [quoteBy, setQuoteBy]   = useState(trade?.quote_by ?? '')
  const [published, setPublished] = useState(trade?.published ?? true)
  const [images, setImages]     = useState(trade?.images ?? [])
  const [files, setFiles]       = useState<File[]>([])
  const [saving, setSaving]     = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const picker = useRef<HTMLInputElement>(null)
  const previews = usePreviews(files)

  /** Too many or too big: say so before uploading */
  const pick = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const big = picked.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (big) { setErrors({ images: `${big.name} is over ${MAX_MB} MB.` }); return }
    // Up to MAX_FILES per upload: the ones picked now (plus those waiting, for a new trade)
    if (picked.length + (trade ? 0 : files.length) > MAX_FILES) {
      setErrors({ images: `Up to ${MAX_FILES} screenshots at a time.` }); return
    }
    setErrors((e) => ({ ...e, images: '' }))
    if (trade) void upload(picked)
    else setFiles((f) => [...f, ...picked])
  }

  /** Existing trade: upload right away */
  const upload = async (picked: File[]) => {
    if (!trade || picked.length === 0) return
    setImageBusy(true)
    try {
      const t = await proofTradesApi.addImages(trade.id, picked)
      setImages(t.images)
      toast.success(`${picked.length} screenshot${picked.length === 1 ? '' : 's'} added.`)
      await onSaved()
    } catch (err) {
      setErrors({ images: errorMessage(err, 'Could not upload.') })
    } finally {
      setImageBusy(false)
    }
  }

  const imageAction = async (action: () => Promise<ProofTrade>) => {
    setImageBusy(true)
    try {
      const t = await action()
      setImages(t.images)
      await onSaved()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change the screenshot.'))
    } finally {
      setImageBusy(false)
    }
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const amount = Number(value.replace(/[,\s€$₱]/g, ''))
    if (!title.trim()) errs.title = 'Give it a title, e.g. "Top melee trade".'
    if (!Number.isFinite(amount) || amount <= 0) errs.value = 'The trade\'s value, e.g. 9000.'
    if (tradedOn && tradedOn > todayManila()) errs.traded_on = 'That date hasn\'t happened yet.'
    if (!trade && files.length === 0) errs.images = 'Add at least one screenshot.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    const fields: ProofTradeFields = {
      title: title.trim(), value: amount, currency, traded_on: tradedOn || null,
      quote: quote.trim() || null, quote_by: quoteBy.trim() || null, published,
    }
    setSaving(true)
    try {
      if (trade) {
        // Only what changed
        const changed = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== (trade as unknown as Record<string, unknown>)[k])) as ProofTradeFields
        if (Object.keys(changed).length) await proofTradesApi.update(trade.id, changed)
        toast.success('Saved. Publish to website to show the change.')
      } else {
        await proofTradesApi.create(fields, files)
        toast.success('Added. Publish to website to show it.')
      }
      await onSaved()
      onClose()
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k.startsWith('images') ? 'images' : k, String(v)])))
      else toast.error(errorMessage(err, 'Could not save.'))
    } finally {
      setSaving(false)
    }
  }

  const thumbs = trade
    ? images.map((img, i) => ({ key: `i${img.id}`, src: img.thumb_url, cover: i === 0, id: img.id }))
    : previews.map((src, i) => ({ key: `f${i}`, src, cover: i === 0, id: null as number | null, index: i }))

  return (
    <Modal open onClose={onClose} title={trade ? 'Edit proven trade' : 'Add a proven trade'} size="lg">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Top melee trade" error={errors.title} autoFocus />
        <div className="grid grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] gap-3">
          <Input label="Value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="9000" error={errors.value} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as ProofTrade['currency'])}
            options={[{ value: 'EUR', label: '€' }, { value: 'USD', label: '$' }, { value: 'PHP', label: '₱' }]} />
          <Input label="Date (optional)" type="date" value={tradedOn} onChange={(e) => setTradedOn(e.target.value)} max={todayManila()} error={errors.traded_on} />
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
          <Input label="Highlight quote (optional)" value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={300} placeholder="The goats, biggest trade in history" error={errors.quote} />
          <Input label="Said by" value={quoteBy} onChange={(e) => setQuoteBy(e.target.value)} maxLength={40} placeholder="Flecha" error={errors.quote_by} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Screenshots <span className="font-normal text-gray-400">(the first is the cover)</span></p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {thumbs.map((t) => (
              <div key={t.key} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <img src={t.src} alt="" className="size-full object-cover" />
                {t.cover && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
                <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1">
                  {trade && !t.cover && t.id != null && (
                    <button type="button" disabled={imageBusy} onClick={() => imageAction(() => proofTradesApi.makeCover(t.id!))}
                      title="Make cover" aria-label="Make this the cover" className="rounded bg-black/60 p-1 text-white hover:bg-black/80"><Star size={12} /></button>
                  )}
                  <button type="button" disabled={imageBusy}
                    onClick={() => (trade && t.id != null ? imageAction(() => proofTradesApi.removeImage(t.id!)) : setFiles((f) => f.filter((_, i) => i !== ('index' in t ? t.index : -1))))}
                    title="Remove" aria-label="Remove this screenshot" className="rounded bg-black/60 p-1 text-white hover:bg-red-600">
                    {trade ? <Trash2 size={12} /> : <X size={12} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => picker.current?.click()} disabled={imageBusy}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400">
              <ImagePlus size={18} /> {imageBusy ? 'Uploading…' : 'Add'}
            </button>
          </div>
          <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
            onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
          {errors.images
            ? <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.images}</p>
            : <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">PNG, JPG or WebP, up to {MAX_MB} MB each. They're resized and saved as WebP.</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 rounded accent-indigo-600" />
          Show on the website
        </label>

        <div className="modal-footer flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{trade ? 'Save' : 'Add trade'}</Button>
        </div>
      </form>
    </Modal>
  )
}
