const CACHE_NAME = 'drive-estudiantil-v4.6';
const urlsToCache = ['./', './index.html', './app.js', './manifest.json', './Img/akko.jpeg'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    // CORRECCIÓN CRÍTICA: Ignorar cualquier petición que sea a Cloudflare
    if (event.request.url.includes('trycloudflare.com')) {
        return; // El Service Worker NO toca estas peticiones, van directo a la red
    }

    // Solo usar caché para archivos locales
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cache => { if (cache !== CACHE_NAME) return caches.delete(cache); })
        ))
    );
});