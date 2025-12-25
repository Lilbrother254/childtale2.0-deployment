// ChildTale "Instant Magic" Service Worker
const CACHE_NAME = 'childtale-magic-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/manifest.json',
    // External Fonts & Scripts (We try to cache them for offline usage)
    'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700;900&family=Nunito:wght@400;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/svg2pdf.js/2.2.0/svg2pdf.umd.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('🪄 Magic Cache: Opened (' + CACHE_NAME + ')');

            // Resilient individual caching to prevent atomic failure
            const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    await cache.put(url, response);
                    return true;
                } catch (error) {
                    console.warn(`⚠️ Magic Cache: Failed to cache ${url} -`, error.message);
                    return false;
                }
            });

            await Promise.all(cachePromises);
            console.log('🪄 Magic Cache: Pre-caching attempt complete');
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('🧹 Clearing Old Magic:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Stale-While-Revalidate Strategy for shell assets
self.addEventListener('fetch', (event) => {
    // 1. Skip non-GET and chrome-extension/data/etc
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    // 2. CRITICAL BYPASS: Never intercept Supabase Auth, DB, or Edge Functions (Sparky)
    // We want these to always be direct and fast.
    if (event.request.url.includes('supabase.co') || event.request.url.includes('/functions/v1/')) {
        return; // Let browser handle normally
    }

    // 3. Asset Logic
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Only cache successful local shell assets
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Silently fail network update if offline
            });

            // Return cache immediately (Instant Magic), or wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
