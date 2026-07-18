/**
 * نسما ستور — Service Worker
 * استراتيجية Cache First للأصول الثابتة
 * استراتيجية Network First للصفحات HTML
 */

const CACHE_NAME    = 'nasma-v2';
const ASSETS_CACHE  = 'nasma-assets-v2';

/* الأصول التي تُخزَّن عند التثبيت */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/products.html',
  '/cart.html',
  '/checkout.html',
  '/product-detail.html',
  '/style.css',
  '/data.js',
  '/store.js',
  '/assets/images/hero.avif',
  '/assets/images/hero.webp',
  '/assets/images/cat-abaya.avif',
  '/assets/images/cat-abaya.webp',
  '/assets/images/cat-bags.avif',
  '/assets/images/cat-bags.webp',
  '/assets/images/cat-accessories.avif',
  '/assets/images/cat-accessories.webp',
  '/assets/images/prod-1.avif',
  '/assets/images/prod-1.webp',
  '/assets/images/prod-2.avif',
  '/assets/images/prod-2.webp',
];

/* ===== تثبيت — تخزين الأصول مسبقاً ===== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ===== تفعيل — حذف الكاشات القديمة ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== ASSETS_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ===== اعتراض الطلبات ===== */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* تجاهل الطلبات غير HTTP أو الخارجية (Google Fonts مثلاً) */
  if (!url.protocol.startsWith('http')) return;

  /* الصور — Cache First (الأسرع) */
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  /* CSS / JS — Cache First */
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  /* HTML — Network First (لضمان تحديث المحتوى) */
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }
});

/* استراتيجية Cache First */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

/* استراتيجية Network First */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('<h1>غير متصل</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
