import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, Eye, ImageIcon, MessageCircle, Minus, Pencil, RefreshCw, Send, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { discordPostsApi, type DiscordPostsPage, type DiscordSlot } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { manilaWeekdayTime as manilaTime } from '@/utils/format'
import { DiscordAutoPostToggle } from './listing/DiscordAutoPostToggle'
import { EditServerModal } from './discord/EditServerModal'
import { getsRun, scheduleLabel } from './discord/schedule'

const NO_PAGE = null as DiscordPostsPage | null
const load = () => discordPostsApi.get()

/** "Today", else "Thu 19" */
function dayLabel(date: string, i: number): string {
  if (i === 0) return 'Today'
  const d = new Date(`${date}T00:00:00+08:00`)
  return `${d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' })} ${d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', day: 'numeric' })}`
}

/** One server in one run: sent, failed (why), not its run, skipped, missed, or not yet */
function SlotCell({ slot, channel, label, scheduled }: { slot: DiscordSlot; channel: string; label: string; scheduled: boolean }) {
  const r = slot.results[channel]
  const [Icon, tone, title] = r
    ? r.ok
      ? [Check, 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', `${label}: sent at ${manilaTime(r.at)}`]
      : [X, 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', `${label}: not sent: ${r.note ?? 'refused'}`]
    : !scheduled
      ? [null, 'text-gray-300 dark:text-gray-700', `${label}: this server isn't set to get this post`]
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
    <div className="flex items-center gap-3">
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
            : <>The picture these buttons and auto-post send. Saved {manilaTime(imageAt)}; posting or publishing from the <Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Listing Kit</Link> updates it.</>}
      </p>
    </div>
  )
}

type Channel = DiscordPostsPage['channels'][number]

/** Your name for a server, else "Channel 3" (every webhook is called Leblanc in Discord) */
const serverName = (c: Channel) => c.label ?? `Channel ${c.no}`

/** A server's name, a pencil for its settings (name, schedule, replace) and a link to open it in Discord */
function ServerName({ channel, onEdit }: { channel: Channel; onEdit: () => void }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`max-w-32 truncate font-semibold ${channel.label ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 italic dark:text-gray-400'}`} title={serverName(channel)}>
        {serverName(channel)}
      </span>
      <button type="button" onClick={onEdit} title="Name and schedule" aria-label={`Edit ${serverName(channel)}`} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
        <Pencil size={11} />
      </button>
      {channel.open_url && (
        <a href={channel.open_url} target="_blank" rel="noreferrer" title="Open this channel in Discord" aria-label={`Open ${serverName(channel)} in Discord`} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-400">
          <ExternalLink size={11} />
        </a>
      )}
    </span>
  )
}

/** Who a server's posts brought to the website in the last 30 days (tap for the last 7) */
function ServerReach({ reach }: { reach: NonNullable<Channel['reach']> }) {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  const detail = `Last 30 days: ${plural(reach.visitors_30, 'visitor')} and ${plural(reach.requests_30, 'request')} from this server's posts. Last 7 days: ${plural(reach.visitors_7, 'visitor')}.`
  return (
    <button
      type="button"
      onClick={() => toast.success(detail)}
      title={detail}
      className={`flex items-center gap-1 text-[10px] font-semibold ${reach.requests_30 > 0 ? 'text-emerald-600 dark:text-emerald-400' : reach.visitors_30 > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
    >
      <Eye size={10} /> {plural(reach.visitors_30, 'visitor')} · {plural(reach.requests_30, 'request')} <span className="font-normal opacity-75">· 30d</span>
    </button>
  )
}

/** How many servers a run reached, of those set to get it, e.g. "9/10" */
function slotCount(slot: DiscordSlot, keys: string[]): string {
  if (slot.skipped) return 'skip'
  const tried = keys.filter((k) => slot.results[k])
  if (tried.length === 0) return slot.due ? '–' : ''
  return `${tried.filter((k) => slot.results[k].ok).length}/${Math.max(keys.length, tried.length)}`
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

  // The saved picture to every server at once
  const [postingAll, setPostingAll] = useState(false)
  const postAll = async () => {
    setPostingAll(true)
    try {
      const r = await discordPostsApi.sendAll()
      if (r.sent === r.total) toast.success(r.total === 1 ? 'Posted to your server.' : `Posted to all ${r.total} servers.`)
      else toast.error(r.message)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not post to Discord.'))
    } finally {
      setPostingAll(false)
      await refetch()
    }
  }

  // The server whose settings are open (name, schedule, replace)
  const [editing, setEditing] = useState<Channel | null>(null)

  /** The servers set to get the 10 AM / 10 PM run (the "Reached" row counts against these) */
  const keysFor = (run: 'am' | 'pm') => (data?.channels ?? []).filter((c) => getsRun(c.schedule, run)).map((c) => c.key)
  const auto = data?.auto
  const nameOf = (key: string | null) => {
    const c = data?.channels.find((x) => x.key === key)
    return c ? serverName(c) : 'a removed server'
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
          {/* The saved picture, post it to every server now, and auto-post */}
          {auto && (
            <Card className="flex flex-col gap-3 p-4">
              <SavedPicture imageAt={auto.image_at} stale={auto.stale} />
              <Button
                variant="secondary"
                icon={<MessageCircle className="h-4 w-4" />}
                onClick={postAll}
                loading={postingAll}
                disabled={sending !== null}
              >
                Post to all {data.channels.length} server{data.channels.length === 1 ? '' : 's'}
              </Button>
              <DiscordAutoPostToggle status={auto} busy={postingAll || sending !== null} onChanged={refetch} />
            </Card>
          )}

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
                            <ServerName channel={c} onEdit={() => setEditing(c)} />
                            <span className={`block text-[10px] ${c.alive === false ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {c.alive === false ? 'Webhook deleted' : `#${c.no} · ${scheduleLabel(c.schedule)} · ${c.last_sent_at ? `last ${manilaTime(c.last_sent_at)}` : 'nothing sent yet'}`}
                            </span>
                            {c.reach && <ServerReach reach={c.reach} />}
                          </div>
                          <button
                            type="button"
                            onClick={() => send(c.key, serverName(c))}
                            disabled={sending !== null}
                            title={`Send the picture to ${serverName(c)} now`}
                            aria-label={`Send to ${serverName(c)}`}
                            className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          >
                            {sending === c.key ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>
                      </th>
                      {data.days.map((d) => [
                        <SlotCell key={`${d.date}-am`} slot={d.am} channel={c.key} label={`${dayLabel(d.date, 1)} 10 AM`} scheduled={getsRun(c.schedule, 'am')} />,
                        <SlotCell key={`${d.date}-pm`} slot={d.pm} channel={c.key} label={`${dayLabel(d.date, 1)} 10 PM`} scheduled={getsRun(c.schedule, 'pm')} />,
                      ])}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left dark:bg-gray-900">Reached</th>
                    {data.days.map((d) => [
                      <td key={`${d.date}-am`} className="px-0.5 text-center">{slotCount(d.am, keysFor('am'))}</td>,
                      <td key={`${d.date}-pm`} className="px-0.5 text-center">{slotCount(d.pm, keysFor('pm'))}</td>,
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
              <span className="flex items-center gap-1"><span className="w-3 text-center text-gray-400">·</span> Not this server's time</span>
            </div>
          </Card>

          <p className="-mt-2 text-[11px] text-gray-400 dark:text-gray-500">
            Not sure which server is which? Tap <ExternalLink size={10} className="inline" /> to open its channel in Discord. The pencil sets its name (only in this app: Discord still shows Leblanc), when it gets auto-posts, and whether a new post replaces your last one.
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

      {/* Keyed by server: opens with that server's settings */}
      {editing && <EditServerModal key={editing.key} channel={editing} onClose={() => setEditing(null)} onSaved={refetch} />}
    </div>
  )
}
