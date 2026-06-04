// Service worker.
// - Navigations & dynamic requests: network-first (always fresh when online),
//   fall back to cache only when offline.
// - Immutable build assets (/_next/static, icons): cache-first for speed.
// - Auto-updates: new SW activates immediately; the page reloads via the
//   `controllerchange` handler in components/PWA.js.
const CACHE = "prime-v4";
const SHELL = ["/app", "/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: "PRIME", body: e.data ? e.data.text() : "" }; }
  const title = data.title || "PRIME Tracker";
  const opts = { body: data.body || "", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url || "/app" } };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/app";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if (c.url.includes("/app") && "focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

function isImmutable(url) {
  return url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|svg|ico|webmanifest|woff2?)$/.test(url.pathname);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (Supabase/API/OFF)
  if (url.pathname.startsWith("/api/")) return;     // never cache our API

  // Immutable, content-hashed assets → cache-first.
  if (isImmutable(url)) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
    return;
  }

  // Everything else (navigations, RSC, data) → network-first, cache fallback.
  e.respondWith(
    fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/app")))
  );
});
