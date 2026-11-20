import { useState, type FormEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { discordPostsApi, type DiscordChannel, type DiscordSchedule } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { SCHEDULE_OPTIONS } from './schedule'

/**
 * A server's settings: your name for it (only in this app), when it gets auto-posts, and whether a
 * new post replaces your previous one there. Opened fresh for each server (keyed by the caller).
 */
export function EditServerModal({ channel, onClose, onSaved }: {
  channel: DiscordChannel
  onClose: () => void
  onSaved: () => unknown
}) {
  const [name, setName]         = useState(channel.label ?? '')
  const [schedule, setSchedule] = useState<DiscordSchedule>(channel.schedule ?? 'both')
  const [replace, setReplace]   = useState(channel.replace ?? true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | undefined>()

  const save = async (e?: FormEvent) => {
    e?.preventDefault()
    if (name.trim().length > 40) { setError('40 characters at most.'); return }
    // Only what changed
    const changes: { name?: string; schedule?: DiscordSchedule; replace?: boolean } = {}
    if (name.trim() !== (channel.label ?? '')) changes.name = name.trim()
    if (schedule !== channel.schedule) changes.schedule = schedule
    if (replace !== channel.replace) changes.replace = replace
    if (Object.keys(changes).length === 0) { onClose(); return }
    setSaving(true)
    try {
      await discordPostsApi.update(channel.key, changes)
      toast.success('Saved.')
      await onSaved()
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not save.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Channel ${channel.no}`} size="sm">
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            label="Name (only in this app)"
            value={name}
            maxLength={40}
            autoFocus
            placeholder={`Channel ${channel.no}`}
            onChange={(e) => { setName(e.target.value); setError(undefined) }}
            error={error}
          />
          {channel.open_url && (
            <a href={channel.open_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 self-start text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Not sure which server? Open its channel in Discord <ExternalLink size={11} />
            </a>
          )}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Auto-post here</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {SCHEDULE_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`relative flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm has-focus-visible:ring-2 has-focus-visible:ring-indigo-400 ${schedule === o.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'}`}
              >
                {/* relative label: the hidden radio stays inside it (no page jump on focus) */}
                <input type="radio" name="schedule" value={o.value} checked={schedule === o.value} onChange={() => setSchedule(o.value)} className="sr-only" />
                <span className="font-semibold">{o.label}</span>
                <span className="text-[11px] opacity-75">{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="mt-0.5 size-4 rounded accent-indigo-600" />
          <span>
            <span className="font-medium">Replace my previous post</span>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400">A new post deletes your last one here, so the channel shows only your latest listing.</span>
          </span>
        </label>

        <div className="modal-footer flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}
