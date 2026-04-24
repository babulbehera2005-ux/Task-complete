// FocusTask Service Worker v1.0
const CACHE_NAME = 'focustask-v1';
const ASSETS = ['./index.html', './manifest.json'];

// Install - cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - serve from cache first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'FocusTask', body: 'You have pending tasks!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './manifest.json',
      badge: './manifest.json',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'focustask-reminder',
      renotify: true,
      actions: [
        { action: 'open', title: '📋 Open App' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action !== 'dismiss') {
    e.waitUntil(clients.openWindow('./index.html'));
  }
});

// Background sync for reminders
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDER') {
    const { task, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification('⏰ Task Reminder — FocusTask', {
        body: task,
        vibrate: [300, 100, 300],
        tag: 'reminder-' + Date.now(),
        renotify: true,
        icon: './manifest.json',
      });
    }, delay);
  }
});
