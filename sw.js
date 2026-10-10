// Ține aplicația disponibilă și fără semnal. Datele programului nu trec pe aici (vin direct de la scriptul Google).
const VERSIUNE = 'po-v5';
const FISIERE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIUNE).then(c => c.addAll(FISIERE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(chei => Promise.all(chei.filter(k => k !== VERSIUNE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Întâi rețeaua (ca să vină mereu ultima versiune a aplicației), copia salvată doar dacă nu e semnal.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(VERSIUNE).then(c => c.put(e.request, copie));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
