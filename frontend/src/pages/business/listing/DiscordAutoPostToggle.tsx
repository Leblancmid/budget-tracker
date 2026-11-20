import { useState } from 'react'
import { Clock } from 'lucide-react'
import { listingPublishApi, type DiscordAutoPost, type KitImage } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { manilaWeekdayTime as manilaTime } from '@/utils/format'

/**
 * Auto-post every 12 hours (10 AM and 10 PM). In the Listing Kit, switching on saves the image as
 * drawn (image); on the Discord page there's no image to draw, so the saved picture is used.
 */
export function DiscordAutoPostToggle({ status, image, busy = false, onChanged }: {
  status: DiscordAutoPost
  image?: () => Promise<KitImage | null>
  busy?: boolean
  onChanged: () => unknown
}) {
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    setSaving(true)
    try {
      const on = !status.enabled
      const kit = on && image ? await image() : null
      if (on && !kit && !status.image_at) {
        toast.error(image ? 'Nothing to post yet: the Listing Kit image is empty.' : 'No saved picture yet: tap "Post image to Discord" in the Listing Kit first.')
        return
      }
      const r = await listingPublishApi.discordAuto(on, kit)
      toast.success(on ? `Auto-post is on. Next post: ${r.next_at ? manilaTime(r.next_at) : '10:00 AM'}.` : 'Auto-post is off.')
      await onChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change auto-post.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
      {/* relative: keeps the hidden checkbox inside the label, so focusing it doesn't scroll the page away */}
      <label className="relative flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        <Clock size={14} className="shrink-0 text-indigo-500" />
        <span className="flex-1">Auto-post every 12 hours</span>
        <input
          type="checkbox"
          role="switch"
          checked={status.enabled}
          onChange={toggle}
          disabled={saving || busy}
          aria-label="Auto-post to Discord at 10 AM and 10 PM"
          className="peer sr-only"
        />
        <span aria-hidden className="relative h-5 w-9 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-indigo-600 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 peer-disabled:opacity-60 dark:bg-gray-600" />
      </label>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {!status.enabled
          ? 'Posts the saved listing picture to every server at 10:00 AM and 10:00 PM.'
          : status.stale
            ? <span className="text-amber-700 dark:text-amber-300">Paused: what's for sale changed since the saved picture. Tap "Post image to Discord" in the Listing Kit or publish to refresh it.</span>
            : <>Next post: <b>{status.next_at ? manilaTime(status.next_at) : '10:00 AM'}</b>{status.posted_at && <> · last {manilaTime(status.posted_at)}</>}. Posting or publishing from the Listing Kit updates the picture.</>}
      </p>
    </div>
  )
}
