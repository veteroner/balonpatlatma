/* PopGo Service Worker
 * Strateji: NETWORK-FIRST (app shell için) + offline cache yedeği.
 * Neden: eski "cache-first" yaklaşımı güncelleme sonrası ESKİ arayüzü
 * sunuyordu (index.html/style.css/app.js cache'ten geliyordu, network'e
 * hiç bakmadan). Capacitor'da "network" = yerel paketlenmiş dosya, anında
 * gelir; böylece her açılışta güncel sürüm yüklenir, offline'da cache devreye girer.
 */

// Sürümü her yayında artır (eski cache'leri otomatik temizler)
const CACHE_NAME = 'popgo-cache-v5';

const CORE_ASSETS = [
  '.',
  'index.html',
  'style.css',
  'redesign.css',
  'splash-screen.css',
  'splash-screen.js',
  'app.js',
];

self.addEventListener('install', event => {
  self.skipWaiting(); // yeni SW'yi hemen aktif et
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // eski sürüm cache'lerini sil
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url;

  // Reklam / analitik isteklerini SW'den geçir (asla cache'leme)
  if (url.includes('googlesyndication.com') ||
      url.includes('googletagmanager.com') ||
      url.includes('google-analytics.com') ||
      url.includes('doubleclick.net') ||
      url.includes('googleads')) {
    return;
  }

  // Yalnızca GET isteklerini yönet
  if (req.method !== 'GET') return;

  // NETWORK-FIRST: taze sürümü al, cache'i güncelle; offline'da cache'e düş
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      // başarılı aynı-origin yanıtları offline yedeği olarak sakla
      if (fresh && fresh.status === 200 && url.startsWith(self.location.origin)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      const cached = await caches.match(req);
      return cached || new Response('', { status: 200 });
    }
  })());
});
