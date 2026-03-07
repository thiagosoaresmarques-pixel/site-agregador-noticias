/**
 * Síntese News — Service Worker
 * Cache-first strategy for static assets, network-first for pages
 */
const CACHE_NAME = 'sintese-news-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
    '/wp-content/themes/sintese-news/style.css',
    '/wp-content/themes/sintese-news/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Non-critical: some assets may not exist yet
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for pages, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests and admin pages
    if (request.method !== 'GET') return;
    if (request.url.includes('/wp-admin') || request.url.includes('/wp-login')) return;

    // HTML pages: network-first
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful page loads
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    // Serve from cache if offline
                    return caches.match(request).then((cached) => {
                        return cached || new Response(
                            '<html><body style="background:#0a0a0f;color:#e4e4e7;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1>📡 Sem conexão</h1><p>Você está offline. Verifique sua conexão e tente novamente.</p></div></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                // Cache CSS, JS, fonts, images
                if (response.ok && /\.(css|js|woff2?|png|jpg|svg|webp)$/i.test(request.url)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
