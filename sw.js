// Guarda o app no celular para abrir sem internet.
// O app em si: tenta a internet primeiro (para pegar atualizações) e usa a cópia guardada se estiver offline.
// Bibliotecas e fontes: usa a cópia guardada e atualiza em segundo plano.
const CACHE = 'financas-v28';
const LOGOS = ['nubank', 'sicredi', 'inter', 'mercado-pago', 'caju', 'flash', 'bonuscred', 'shopee', 'riachuelo'].map(n => './logo-' + n + '.png');
const APP = ['./', './index.html', './manifest.webmanifest', './gema-192.png', './gema-512.png', './gema-180.png', ...LOGOS];
const EXTERNOS = /^https:\/\/(cdnjs\.cloudflare\.com\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/|api\.fontshare\.com\/|cdn\.fontshare\.com\/|www\.gstatic\.com\/firebasejs\/|cdn\.jsdelivr\.net\/npm\/@?tesseract)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  if (EXTERNOS.test(req.url)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(guardado => {
      const rede = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => guardado);
      return guardado || rede;
    })));
  }
});
