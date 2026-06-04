// Minimal, conservative service worker.
// - Precaches the app shell so it opens offline.
// - Navigations: network-first, fall back to cached /app when offline.
// - Static assets: stale-while-revalidate so a new deploy lands without a manual cache bump.
// - Everything else (Supabase, RapidAPI, etc.) passes straight through.
//
// Update flow: we DON'T skipWaiting automatically. The page (see components/PWA.js)
// detects a freshly installed worker and posts "SKIP_WAITING"; the new worker then
// takes over and the page reloads once — so a bookmarked / installed app actually
// shows the new build instead of the warm, stale one.
const CACHE = "prime-v4";
const SHELL = ["/app", "/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

// The page asks the waiting worker to take over the moment a new build is ready.
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING" || (e.data && e.data.type === "SKIP_WAITING")) self.skipWaiting();
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (Supabase/API)

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("/app")))
    );
    return;
  }
  // static assets: stale-while-revalidate — serve cache instantly, refresh in the background.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
