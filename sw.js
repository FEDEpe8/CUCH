const CACHE_NAME = 'viajes-estudiantiles-v2'; // Subí la versión para forzar la actualización
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// sw.js - Escuchar eventos Push del servidor
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    
    const titulo = data.titulo || 'Transporte Estudiantil';
    const opciones = {
        body: data.mensaje || 'Tenés una actualización de tu viaje.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
        vibrate: [200, 100, 200] // Patrón de vibración del celular
    };

    event.waitUntil(
        self.registration.showNotification(titulo, opciones)
    );
});

// Qué pasa cuando el alumno toca la notificación
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Abre la PWA al tocar
    );
});
