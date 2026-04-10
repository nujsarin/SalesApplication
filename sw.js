// Service Worker — Cache-first strategy
const CACHE_NAME = 'sales-app-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './js/db.js',
  './js/auth.js',
  './js/router.js',
  './js/i18n.js',
  './js/pages/home.js',
  './js/pages/salesOrder.js',
  './js/pages/billing.js',
  './js/pages/customer.js',
  './js/pages/calendar.js',
  './js/pages/incentive.js',
  './js/pages/report.js',
  './js/pages/setting.js',
  './js/utils/chart.js',
  './js/utils/export.js',
  './js/utils/date.js',
  'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.filter(u => !u.startsWith('http'))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
