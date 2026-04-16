// Service worker for offline caching (placeholder for Workbox)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
// Workbox will inject precaching during build
