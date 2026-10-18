// Ține aplicația disponibilă și fără semnal și afișează notificările.
// Datele programului nu trec pe aici (vin direct de la scriptul Google).
const VERSIUNE = 'po-v67';
const FISIERE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './banda-autonom.png'];

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
    // no-cache: întreabă mereu serverul dacă fișierul s-a schimbat (nu folosi copia browserului de 10 minute)
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copie = r.clone();
      caches.open(VERSIUNE).then(c => c.put(e.request, copie));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// Notificare trimisă de script prin Firebase. Pe iPhone fiecare mesaj trebuie afișat, altfel iOS oprește notificările.
self.addEventListener('push', e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { m = { notification: { body: e.data && e.data.text() } }; }
  const n = m.notification || {}, d = m.data || {};
  const link = (m.fcmOptions && m.fcmOptions.link) || d.link || self.registration.scope;
  e.waitUntil(self.registration.showNotification(n.title || 'Program Oradea', {
    body: n.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: d.id || undefined,
    data: { link }
  }));
});

// Atingerea notificării deschide aplicația direct pe intervenție.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    for (const c of lista) {
      if (c.url.startsWith(self.registration.scope)) return c.focus().then(() => c.navigate(link)).catch(() => self.clients.openWindow(link));
    }
    return self.clients.openWindow(link);
  }));
});
