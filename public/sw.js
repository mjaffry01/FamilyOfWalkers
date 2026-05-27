const CACHE = 'fow-v1'
const SHELL = ['/', '/index.html', '/icon.svg', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  // Firebase & CDN — always network
  if (url.hostname.includes('firebase') || url.hostname.includes('gstatic') ||
      url.hostname.includes('jsdelivr') || url.hostname.includes('googleapis')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})))
    return
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
      }
      return res
    }).catch(() => caches.match('/')))
  )
})
