"use client";
import { useEffect } from "react";

// Registers the service worker, keeps it up to date, and reloads the page once
// when a new version takes control — so an installed/bookmarked app refreshes
// on the next launch or focus instead of running stale cached code.
export default function PWA() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    const onControllerChange = () => {
      // Only reload for an *update* (not the very first install), and only once.
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let reg = null;
    const promote = (w) => {
      if (w && w.state === "installed" && navigator.serviceWorker.controller) {
        try { w.postMessage({ type: "SKIP_WAITING" }); } catch (e) {}
      }
    };
    const register = async () => {
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        promote(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (nw) nw.addEventListener("statechange", () => promote(nw));
        });
        reg.update();
      } catch (e) {}
    };

    const onLoad = () => register();
    if (document.readyState === "complete") register();
    else window.addEventListener("load", onLoad);

    // Re-check for a new deploy whenever the app is reopened/focused.
    const checkForUpdate = () => { if (document.visibilityState === "visible" && reg) { try { reg.update(); } catch (e) {} } };
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);
  return null;
}
