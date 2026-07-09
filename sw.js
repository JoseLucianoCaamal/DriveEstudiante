const CACHE_NAME = 'drive-estudiantil-v2.4';

// Aquí listamos los archivos visuales de la app (el "App Shell")
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './Img/akko.jpeg'
];

// 1. Instalar y guardar la interfaz en caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Archivos visuales en caché');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Interceptar las peticiones de red
self.addEventListener('fetch', event => {
    // REGLA CLAVE: Si la petición va hacia tu servidor de Linux (API o descargas), 
    // NO usamos el caché. Queremos los datos frescos de internet.
    if (event.request.url.includes('/api/') || event.request.url.includes('/uploads/')) {
        return; // Deja que el navegador haga su trabajo normal
    }

    // Para los archivos visuales (HTML, JS, Iconos), buscar primero en el caché
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si lo encuentra en caché, lo devuelve al instante. Si no, lo baja de internet.
                return response || fetch(event.request);
            })
    );
});

// 3. Limpiar cachés viejos si actualizamos la versión (ej. a v2)
self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});