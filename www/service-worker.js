/* Basit Service Worker - offline önbellekleme */

const CACHE_NAME = 'balon-patlatma-cache-v1';
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'app.js',
];

self.addEventListener('install', event => {
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
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
}); 