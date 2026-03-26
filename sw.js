// ATENCIÓN: Cada vez que hagas un cambio en tu app.js o index.html en el futuro,
// tenés que cambiar este número (ej: de v4 a v5) para obligar a los celulares a actualizarse.
const CACHE_NAME = 'viajes-estudiantiles-v5'; 
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// 1. Instalar y guardar en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Fuerza al Service Worker a instalarse inmediatamente
});

// 2. NUEVO: Limpiar cachés viejos al activarse
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si el caché no es el actual (v4), lo borra
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Toma el control de la app inmediatamente
});

// 3. Interceptar peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve del caché si está, sino lo busca en internet
        return response || fetch(event.request);
      })
  );
});
