import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Clock, ImageIcon, Minus, RefreshCw, Send, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { discordPostsApi, type DiscordPostsPage, type DiscordSlot } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

const NO_PAGE = null as DiscordPostsPage | null
const load = () => discordPostsApi.get()

/** e.g. "Fri 10:00 PM", in Manila time like the schedule */
const manilaTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', hour: 'numeric', minute: '2-digit' })

/** "Today", else "Thu 19" */
function dayLabel(date: string, i: number): string {
  if (i === 0) return 'Today'
  const d = new Date(`${date}T00:00:00+08:00`)
  return `${d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' })} ${d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', day: 'numeric' })}`
}

/** One server in one run: sent, failed (why), skipped, missed, or not yet */
function SlotCell({ slot, channel, label }: { slot: DiscordSlot; channel: string; label: string }) {
  const r = slot.results[channel]
  const [Icon, tone, title] = r
    ? r.ok
      ? [Check, 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', `${label}: sent at ${manilaTime(r.at)}`]
      : [X, 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', `${label}: not sent: ${r.note ?? 'refused'}`]
    : slot.skipped
      ? [Minus, 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', `${label}: skipped: ${slot.skipped}`]
      : slot.due
        ? [Minus, 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500', `${label}: no post (auto-post was off, or the server PC was)`]
        : [null, 'text-gray-300 dark:text-gray-700', `${label}: not yet`]
  // Tapping says why (phones have no hover tooltip)
  const explain = () => (r && !r.ok ? toast.error(title) : toast.success(title))
  return (
    <td className="px-0.5 py-1 text-center">
      <button type="button" onClick={explain} title={title} aria-label={title} className={`mx-auto flex size-6 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${tone}`}>
        {Icon ? <Icon size={13} strokeWidth={2.5} /> : '·'}
      </button>
    </td>
  )
}

/**
 * The picture Send and auto-post use (saved when you post or publish from the Listing Kit).
 * Reloads when a newer one is saved (imageAt).
 */
function SavedPicture({ imageAt, stale }: { imageAt: string | null; stale: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!imageAt) return
    let objectUrl: string | null = null
    let live = true
    discordPostsApi.image()
      .then((blob) => { if (live) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); setFailed(false) } })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [imageAt])

  return (
    <Card className="flex items-center gap-3 p-3">
      {imageAt && url && !failed ? (
        <a href={url} target="_blank" rel="noreferrer" title="Open the full picture" className="shrink-0">
          <img src={url} alt="The saved listing picture" className="h-16 w-24 rounded-md object-cover object-top ring-1 ring-gray-200 dark:ring-gray-700" />
        </a>
      ) : (
        <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <ImageIcon size={20} />
        </span>
      )}
      <p className="flex-1 text-xs text-gray-600 dark:text-gray-300">
        {!imageAt
          ? <>No saved picture yet. Tap <b>Post image to Discord</b> or publish from the <Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Listing Kit</Link>, then Send works here.</>
          : stale
            ? <span className="text-amber-700 dark:text-amber-300">This picture is out of date: what's for sale changed. Post or publish from the <Link to="/business/listing" className="font-semibold underline">Listing Kit</Link> to refresh it before sending.</span>
            : <>What <b>Send</b> and auto-post post. Saved {manilaTime(imageAt)}; posting or publishing from the Listing Kit updates it.</>}
      </p>
    </Card>
  )
}

/** How many servers a run reached, e.g. "9/10" */
function slotCount(slot: DiscordSlot, keys: string[]): string {
  if (slot.skipped) return 'skip'
  const tried = keys.filter((k) => slot.results[k])
  if (tried.length === 0) return slot.due ? '–' : ''
  return `${tried.filter((k) => slot.results[k].ok).length}/${keys.length}`
}

/**
 * Discord: did the Listing Kit image reach each server at 10 AM and 10 PM, over the last week,
 * and the posts you made yourself.
 */
export default function DiscordPosts() {
  const { data, loading, error, refetch } = useAsyncData(load, NO_PAGE)
  const [refreshing, setRefreshing] = useState(false)

  // Re-asks Discord for the webhook names (they're kept an hour otherwise)
  const refresh = async () => {
    setRefreshing(true)
    try {
      await discordPostsApi.get(true)
      await refetch()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not refresh.'))
    } finally {
      setRefreshing(false)
    }
  }

  // Send the saved picture to one server (the key being sent, for its spinner)
  const [sending, setSending] = useState<string | null>(null)
  const send = async (key: string, name: string) => {
    setSending(key)
    try {
      await discordPostsApi.send(key)
      toast.success(`Sent to ${name}.`)
      await refetch()
    } catch (err) {
      toast.error(errorMessage(err, `Could not send to ${name}.`))
      await refetch()
    } finally {
      setSending(null)
    }
  }

  const keys = data?.channels.map((c) => c.key) ?? []
  const auto = data?.auto
  const nameOf = (key: string | null) => {
    const c = data?.channels.find((x) => x.key === key)
    return c ? c.name ?? `Channel ${c.no}` : 'a removed server'
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Discord</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Your listing image in each server, at 10 AM and 10 PM</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing || loading}
          title="Refresh (also re-reads the server names from Discord)"
          aria-label="Refresh"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <Card className="h-48 animate-pulse p-4"><span className="sr-only">Loading</span></Card>
      ) : error || !data ? (
        <Card className="flex items-center justify-between gap-2 p-4 text-sm text-gray-500 dark:text-gray-400">
          Couldn't load the Discord posts.
          <button onClick={() => refetch()} className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><RefreshCw size={13} /> Retry</button>
        </Card>
      ) : data.channels.length === 0 ? (
        <Card className="p-4 text-sm text-gray-600 dark:text-gray-300">
          No Discord channels yet. Add the webhook links to <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">LISTING_DISCORD_WEBHOOK</code> in the
          backend <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">.env</code> (separated by commas), then run the after-deploy script.
        </Card>
      ) : (
        <>
          {/* Auto-post: on / off / paused, and the next run */}
          <Card className="flex items-center gap-3 p-4">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${auto?.enabled && !auto.stale ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'}`}>
              {auto?.enabled && !auto.stale ? <Clock size={17} /> : <AlertTriangle size={17} />}
            </span>
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
              {!auto?.enabled
                ? <>Auto-post is off. Turn it on in the <Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Listing Kit</Link>.</>
                : auto.stale
                  ? <>Auto-post is paused: what's for sale changed since the saved picture. Post or publish from the <Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Listing Kit</Link> to refresh it.</>
                  : <>Auto-post is on. Next post <b>{auto.next_at ? manilaTime(auto.next_at) : '10:00 AM'}</b> to {data.channels.length} server{data.channels.length === 1 ? '' : 's'}.</>}
            </p>
          </Card>

          {auto && <SavedPicture imageAt={auto.image_at} stale={auto.stale} />}

          {/* The grid: a row per server, two runs per day */}
          <Card className="p-0">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-gray-500 dark:text-gray-400">
                    <th rowSpan={2} className="sticky left-0 z-10 min-w-36 bg-white px-3 py-2 text-left font-semibold dark:bg-gray-900">Server</th>
                    {data.days.map((d, i) => (
                      <th key={d.date} colSpan={2} className={`px-1 pt-2 text-center font-semibold ${i === 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{dayLabel(d.date, i)}</th>
                    ))}
                  </tr>
                  <tr className="text-[10px] text-gray-400 dark:text-gray-500">
                    {data.days.map((d) => (
                      <th key={d.date} colSpan={2} className="px-1 pb-1">
                        <div className="flex justify-around"><span>AM</span><span>PM</span></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.channels.map((c) => (
                    <tr key={c.key}>
                      <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-normal dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="block max-w-40 truncate font-semibold text-gray-800 dark:text-gray-100" title={c.name ?? undefined}>
                              {c.name ?? `Channel ${c.no}`}
                            </span>
                            <span className={`block text-[10px] ${c.alive === false ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {c.alive === false ? 'Webhook deleted' : c.last_sent_at ? `#${c.no} · last sent ${manilaTime(c.last_sent_at)}` : `#${c.no} · nothing sent yet`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => send(c.key, c.name ?? `Channel ${c.no}`)}
                            disabled={sending !== null}
                            title={`Send the picture to ${c.name ?? `Channel ${c.no}`} now`}
                            aria-label={`Send to ${c.name ?? `Channel ${c.no}`}`}
                            className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          >
                            {sending === c.key ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>
                      </th>
                      {data.days.map((d) => [
                        <SlotCell key={`${d.date}-am`} slot={d.am} channel={c.key} label={`${dayLabel(d.date, 1)} 10 AM`} />,
                        <SlotCell key={`${d.date}-pm`} slot={d.pm} channel={c.key} label={`${dayLabel(d.date, 1)} 10 PM`} />,
                      ])}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left dark:bg-gray-900">Reached</th>
                    {data.days.map((d) => [
                      <td key={`${d.date}-am`} className="px-0.5 text-center">{slotCount(d.am, keys)}</td>,
                      <td key={`${d.date}-pm`} className="px-0.5 text-center">{slotCount(d.pm, keys)}</td>,
                    ])}
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> Sent</span>
              <span className="flex items-center gap-1"><X size={12} className="text-red-600" /> Not sent (tap for why)</span>
              <span className="flex items-center gap-1"><Minus size={12} className="text-amber-600" /> Skipped (listings changed)</span>
              <span className="flex items-center gap-1"><Minus size={12} className="text-gray-400" /> No post (off, or the PC was off)</span>
            </div>
          </Card>

          <p className="-mt-2 text-[11px] text-gray-400 dark:text-gray-500">
            Names come from each webhook's name in Discord: rename a webhook to its server's name (Server Settings → Integrations → Webhooks), then refresh.
          </p>

          {/* Posts you made yourself */}
          <Card className="flex flex-col gap-2 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100"><Send size={14} className="text-indigo-500" /> Your posts this week</h2>
            {data.own.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">None: "Post image to Discord" and publishing show here.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {data.own.map((p) => (
                  <li key={`${p.kind}-${p.at}`} className="flex items-center gap-2 py-1.5">
                    <span className="flex-1 text-gray-700 dark:text-gray-200">
                      {p.kind === 'publish' ? 'Publish' : p.kind === 'single' ? `Sent to ${nameOf(p.channel_key)}` : 'Post image to Discord'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{manilaTime(p.at)}</span>
                    <span className={`w-12 text-right text-xs font-semibold ${p.sent === p.total ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{p.sent}/{p.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
