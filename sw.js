// Service worker : l'appli s'ouvre tout de suite (et même hors ligne) depuis le cache,
// puis se met à jour en arrière-plan pour la prochaine ouverture.
const CACHE = 'depenses-v6.1';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Seulement les fichiers de l'appli : les appels à Google passent toujours par le réseau
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(cache => cache.match(e.request, { ignoreSearch: true }).then(enCache => {
    const reseau = fetch(e.request).then(rep => {
      if (rep.ok) cache.put(e.request, rep.clone());
      return rep;
    }).catch(() => enCache);
    return enCache || reseau;
  })));
});
