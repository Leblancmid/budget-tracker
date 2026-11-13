import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BellRing, Share, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { pushApi, pushState, turnOff, turnOn, type PushInfo, type PushState } from '@/lib/push'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

const WHAT = 'New website leads, trades and payments due, your weekly brief, and changes to your account.'

/** Profile → Phone alerts: turn web push on or off for this device, and send a test. */
export function PhoneAlertsCard() {
  const [info, setInfo] = useState<PushInfo | null>(null)
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState<'on' | 'off' | 'test' | null>(null)

  const refresh = useCallback(async () => {
    const [i, s] = await Promise.all([pushApi.info().catch(() => null), pushState()])
    setInfo(i)
    setState(s)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const act = async (kind: 'on' | 'off' | 'test') => {
    setBusy(kind)
    try {
      if (kind === 'on') { await turnOn(info!.public_key!); toast.success('Phone alerts are on for this device.') }
      if (kind === 'off') { await turnOff(); toast.success('Phone alerts are off for this device.') }
      if (kind === 'test') toast.success(await pushApi.test())
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"><BellRing className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phone alerts</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{WHAT}</p>
        </div>
      </div>

      {state === null ? (
        <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : info && !info.configured ? (
        <Note>Phone alerts aren't set up on the server yet. Everything still shows on the bell.</Note>
      ) : state === 'needs-install' ? (
        <Note icon={<Share className="h-4 w-4" />}>
          On iPhone, alerts work in the app on your Home Screen: tap <b>Share</b> → <b>Add to Home Screen</b>, open it from there, and turn alerts on.
        </Note>
      ) : state === 'unsupported' ? (
        <Note>This browser can't get alerts. Try the app on your phone's Home Screen, or Chrome / Edge.</Note>
      ) : state === 'blocked' ? (
        <Note>Alerts are blocked for this app. Allow notifications for it in this device's settings, then come back.</Note>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
            <Smartphone className="h-4 w-4 shrink-0 text-gray-400" />
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
              {state === 'on' ? 'On for this device' : 'Off for this device'}
              {info && info.devices > 0 && <span className="block text-xs text-gray-500">{info.devices} device{info.devices === 1 ? '' : 's'} in total</span>}
            </p>
            {state === 'on'
              ? <Button size="sm" variant="secondary" loading={busy === 'off'} onClick={() => void act('off')}>Turn off</Button>
              : <Button size="sm" loading={busy === 'on'} onClick={() => void act('on')}>Turn on</Button>}
          </div>
          {state === 'on' && (
            <Button size="sm" variant="ghost" className="self-start" loading={busy === 'test'} onClick={() => void act('test')}>Send a test alert</Button>
          )}
        </div>
      )}
    </section>
  )
}

function Note({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
      {icon && <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>}
      <span>{children}</span>
    </p>
  )
}
