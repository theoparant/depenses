// Service worker : l'appli s'ouvre tout de suite (et même hors ligne) depuis le cache,
// puis se met à jour en arrière-plan pour la prochaine ouverture.
const CACHE = 'depenses-v7.2';
const CACHE_LOGOS = 'depenses-logos'; // logos des commerces : gardés d'une version à l'autre
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE && k !== CACHE_LOGOS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Logos (favicons Google) : d'abord le cache, pour qu'ils s'affichent aussi sans réseau
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/s2/favicons')) {
    e.respondWith(caches.open(CACHE_LOGOS).then(cache => cache.match(e.request.url).then(enCache => enCache ||
      fetch(e.request.url, { mode: 'no-cors' }).then(rep => { cache.put(e.request.url, rep.clone()); return rep; }))));
    return;
  }
  // Seulement les fichiers de l'appli : les appels à Google Apps Script passent toujours par le réseau
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(cache => cache.match(e.request, { ignoreSearch: true }).then(enCache => {
    const reseau = fetch(e.request).then(rep => {
      if (rep.ok) cache.put(e.request, rep.clone());
      return rep;
    }).catch(() => enCache);
    return enCache || reseau;
  })));
});
