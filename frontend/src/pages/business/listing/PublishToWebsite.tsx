import { useState } from 'react'
import { ExternalLink, Globe, MessageCircle, RefreshCw, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { listingPublishApi, type KitImage, type ListingPublishPreview } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

const SITE_URL = 'https://leblancmid.pages.dev'
const NO_PREVIEW = null as ListingPublishPreview | null

/**
 * Publish to website: the unsold accounts (with a screenshot) go to leblancmid.pages.dev.
 * Sold ones drop off; prices show only where "Show price" is ticked.
 * kitImage: draws the Listing Kit image for Discord (null when there's nothing to draw).
 */
export function PublishToWebsite({ kitImage }: { kitImage: () => Promise<KitImage | null> }) {
  const { data: preview, loading, error, refetch } = useAsyncData(listingPublishApi.preview, NO_PREVIEW)
  const [confirming, setConfirming] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [posting, setPosting]       = useState(false)

  /** The image, or null if it can't be drawn (the publish still goes ahead) */
  const safeImage = async () => { try { return await kitImage() } catch { return null } }

  const postToDiscord = async () => {
    setPosting(true)
    try {
      const kit = await safeImage()
      if (!kit) { toast.error('Nothing to post yet: the Listing Kit image is empty.'); return }
      await listingPublishApi.postToDiscord(kit)
      toast.success('Posted the Listing Kit image to Discord.')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not post to Discord.'))
    } finally {
      setPosting(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    try {
      const r = await listingPublishApi.publish(await safeImage())
      // Pushed counts even when nothing new was written (e.g. finishing a push that failed before)
      if (!r.changed && !r.pushed) toast.success('The website is already up to date.')
      else if (r.pushed) toast.success(`Published ${r.count} listing${r.count === 1 ? '' : 's'}. The website updates in about a minute.`)
      else toast.success(`Saved ${r.count} listings to the website repo. Push it to go live.`)
      // The Discord listings channel: posted, nothing changed, or it failed (off: say nothing)
      const d = r.discord
      if (d?.on) {
        if (d.posted) toast.success('Posted the Listing Kit image to Discord.')
        else if (!d.changed) toast.success('Nothing changed for sale, so nothing was posted to Discord. Use "Post image to Discord" to post it anyway.')
        else if (!d.image) toast.error('The Listing Kit image was empty, so nothing was posted to Discord.')
        else toast.error('Discord refused the image. Check the webhook link (php artisan listings:discord tests it).')
      }
      // Buyers who asked to be notified about one of these: the list is in #inquiries
      if (r.alerted) toast.success(`${r.alerted} buyer request${r.alerted === 1 ? '' : 's'} matched. See #inquiries for who to message.`)
      setConfirming(false)
      await refetch()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not publish.'))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-indigo-500" />
        <h2 className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Website</h2>
        <a href={SITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Open <ExternalLink size={12} />
        </a>
      </div>

      {loading && !preview ? (
        <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : error || !preview ? (
        <div className="flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          Couldn't check the website listings.
          <button onClick={() => refetch()} className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><RefreshCw size={13} /> Retry</button>
        </div>
      ) : !preview.configured ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 break-words dark:bg-amber-900/20 dark:text-amber-200 [&_code]:break-all">
          Publishing is off. Add <code>LISTING_SITE_PATH=C:\Users\michaeln\Desktop\Dev\Leblanc</code> to the backend <code>.env</code> on this PC (then run the after-deploy script so it's picked up).
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <b>{preview.listings.length}</b> account{preview.listings.length === 1 ? '' : 's'} will be on the website. Sold ones are removed;
            prices show only where <i>Show price</i> is ticked.
          </p>
          {preview.listings.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {preview.listings.map((l) => (
                <li key={l.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {l.featured && <Star size={10} className="fill-amber-400 text-amber-400" />}
                  Lv {l.level} {l.category}{l.price ? ` · ${l.price}` : ''}
                </li>
              ))}
            </ul>
          )}
          {preview.skipped.length > 0 && (
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer font-semibold">{preview.skipped.length} not included</summary>
              <ul className="mt-1 flex flex-col gap-0.5">
                {preview.skipped.map((s) => <li key={s.id}>{s.name}: {s.reason}</li>)}
              </ul>
            </details>
          )}
          <Button icon={<Globe className="h-4 w-4" />} onClick={() => setConfirming(true)} disabled={publishing}>
            Publish to website
          </Button>
        </>
      )}

      {/* The Discord listings channel: works whether or not publishing is set up on this PC */}
      {preview?.discord && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
          <Button variant="secondary" icon={<MessageCircle className="h-4 w-4" />} onClick={postToDiscord} loading={posting} disabled={publishing}>
            Post image to Discord
          </Button>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Posts the Listing Kit image and caption to your listings channel. Publishing also posts it when what's for sale changed.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={publish}
        loading={publishing}
        title="Publish to website"
        confirmLabel="Publish"
        message={`Update ${SITE_URL.replace('https://', '')} with these ${preview?.listings.length ?? 0} accounts? This commits and pushes the Leblanc repo, and the live site changes in about a minute.`}
      />
    </Card>
  )
}
