/* Bump APP_BUILD when publishing a release to trigger iPhone update checks. */
const APP_BUILD = '2026.10.11.1';
const CACHE_PREFIX = 'aesthetic-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_BUILD}`;
const scopeUrl = new URL(self.registration.scope);
const appShell = new URL('index.html', scopeUrl).href;
const coreFiles = [
  appShell,
  new URL('manifest.webmanifest', scopeUrl).href,
  new URL('app-version.json', scopeUrl).href,
  new URL('assets/pwa-icon-180.png', scopeUrl).href,
  new URL('assets/pwa-icon-192.png', scopeUrl).href,
  new URL('assets/pwa-icon-512.png', scopeUrl).href
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(coreFiles)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (new URL(request.url).pathname.includes('/api/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const fresh = await fetch(request);
      if (fresh.ok && (request.destination === 'document' || request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.url.endsWith('.json') || request.url.endsWith('.webmanifest'))) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (error) {
      const cached = await cache.match(request) || await cache.match(appShell);
      if (cached) return cached;
      throw error;
    }
  })());
});
