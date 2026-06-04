"use client";
import { useEffect } from "react";

// Registers the service worker so the app is installable + works offline, and —
// crucially — makes a freshly deployed build actually show up in an already-open
// (bookmarked / installed / "warm") app:
//   - checks for a new worker on launch, on focus, and hourly,
//   - tells a worker that has finished installing to take over right away,
//   - reloads the page once when that new worker takes control.
// Without this, the warm app keeps running the old bundle until it's fully killed.
export default function PWA() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      // Fires only after a *new* worker takes over an already-controlled page
      // (i.e. a real update), so it's safe to reload exactly once.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let cleanup = () => {};

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Only ask a worker to activate when there's already a controller — that
        // distinguishes a genuine update from the very first install (no reload flash).
        const activate = (worker) => {
          if (worker && navigator.serviceWorker.controller) worker.postMessage("SKIP_WAITING");
        };
        // A build that installed in a previous visit may already be waiting.
        activate(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed") activate(nw);
          });
        });

        const check = () => { try { reg.update(); } catch (e) {} };
        const onVis = () => { if (document.visibilityState === "visible") check(); };
        document.addEventListener("visibilitychange", onVis);
        const timer = setInterval(check, 60 * 60 * 1000); // hourly while open
        check();

        cleanup = () => { document.removeEventListener("visibilitychange", onVis); clearInterval(timer); };
      }).catch(() => {});
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleanup();
    };
  }, []);
  return null;
}
