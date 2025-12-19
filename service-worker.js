/* Basit Service Worker - offline önbellekleme */

// Sürüm güncellendi: v2 (2025-10-31) - cache bust for new app.js interstitial cadence
const CACHE_NAME = 'balon-patlatma-cache-v2';
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'app.js',
];

self.addEventListener('install', event => {
  // Yeni service worker'ı hemen aktif et (eski SW beklenmeden)
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  // AdSense ve diğer reklam scriptlerini cache'leme
  if (event.request.url.includes('googlesyndication.com') || 
      event.request.url.includes('googletagmanager.com') ||
      event.request.url.includes('google-analytics.com')) {
    return; // Bu istekleri service worker'dan geç
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Network hatalarını sessizce geç
        return new Response('', { status: 200 });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
      // Yeni SW aktif olur olmaz sayfaları kontrol et
      await self.clients.claim();
    })()
  );
}); 