const CACHE_PREFIX = "titan-pwa-shell-";
const CACHE = `${CACHE_PREFIX}__TITAN_PWA_SHELL_VERSION__`;
const SHELL = ["/", "/index.html", "/app.mjs", "/styles.css", "/manifest.webmanifest", "/icon.svg", "/icon-180.png", "/icon-192.png", "/icon-512.png"];
const PRIVATE = /^\/(?:api|auth|signin|signout|portal|company|app)(?:\/|$)/;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()).catch(error => caches.delete(CACHE).then(() => { throw error; })));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || PRIVATE.test(url.pathname)) return;
  if (url.pathname === "/" && url.searchParams.has("mode")) {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => url.pathname === "/" ? caches.match("/") : new Response("This page is unavailable offline.", { status: 503, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } })));
    return;
  }
  if (!SHELL.includes(url.pathname)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === "basic") void caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
