const CACHE_NAME = 'drive-estudiantil-v2.9';
const urlsToCache = ['./', './index.html', './app.js', './manifest.json', './Img/akko.jpeg'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    // REGLA: Si es API o archivos subidos, NO interceptar
    if (event.request.url.includes('/api/') || event.request.url.includes('/uploads/')) {
        return; 
    }

    // Para la interfaz, priorizar caché pero actualizar en segundo plano
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