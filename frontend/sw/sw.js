/*
 * Budget service worker: keeps the app itself (its page, scripts, styles and icons) on the device
 * so it opens without a connection. Data is not handled here: the app keeps its own copy of what
 * each page last loaded (src/lib/offline). Built by the "service-worker" plugin in vite.config.ts,
 * which fills in the file list and version below; every deploy gets a new version and the old copy
 * is removed.
 */
const VERSION = '__VERSION__'
const FILES = __FILES__

const CACHE = `budget-app-${VERSION}`
const SCOPE = self.registration.scope
const INDEX = new URL('index.html', SCOPE).href
/** Opening the app waits this long for the server before using the saved page instead */
const NAVIGATION_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll([INDEX, ...FILES.map((f) => new URL(f, SCOPE).href)]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('budget-app-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const base = new URL(SCOPE).pathname
  if (url.origin !== self.location.origin) return
  // Data and uploaded images: always from the server (the app keeps its own copy of data)
  if (url.pathname.startsWith(`${base}api/`) || url.pathname.startsWith(`${base}storage/`)) return

  if (request.mode === 'navigate') {
    // The page: from the server so a new deploy shows straight away, the saved one when offline
    event.respondWith(openPage(request))
    return
  }

  // Scripts, styles, icons: their names change with their content, so a saved copy is always right
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
      }
      return response
    })),
  )
})

async function openPage(request) {
  const saved = () => caches.match(INDEX)
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAVIGATION_TIMEOUT_MS)),
    ])
    if (response.ok) {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(INDEX, copy))
      return response
    }
    return (await saved()) || response
  } catch {
    return (await saved()) || Response.error()
  }
}

// ── Phone alerts (web push): new leads, things due, account changes ─────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Budget'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: new URL('icon-192.png', SCOPE).href,
    badge: new URL('icon-192.png', SCOPE).href,
    // Opening it goes to the page it's about (a path inside the app)
    data: { url: new URL((data.url || '/').replace(/^\//, ''), SCOPE).href },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data && event.notification.data.url ? event.notification.data.url : SCOPE
  event.waitUntil((async () => {
    // Use an open window of the app if there is one, else open a new one
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (client.url.startsWith(SCOPE) && 'focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
