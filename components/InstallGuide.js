"use client";
import { useEffect, useState } from "react";
import { Share, Plus, MoreVertical, Download, Smartphone, Check } from "lucide-react";

const COL = { card: "#141417", line: "#26262b", amber: "#f5b301", inp: "#1d1d22", dim: "#8a8a93" };

// Add-to-home-screen guide for iOS (Safari) and Android (Chrome), plus a native
// install button when the browser offers one (Android/desktop Chrome).
export default function InstallGuide() {
  const [platform, setPlatform] = useState("android");
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPlatform(ios ? "ios" : "android");
    try {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      setInstalled(!!standalone);
    } catch (e) {}
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBIP); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const doInstall = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (e) {} setDeferred(null); };

  const Step = ({ n, icon: Icon, children }) => (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: COL.inp, border: `1px solid ${COL.line}`, color: COL.amber, fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <div style={{ color: "#cfcfd6", fontSize: 14.5, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {children}{Icon ? <Icon size={15} style={{ color: COL.amber }} /> : null}
      </div>
    </div>
  );

  if (installed) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8be0a4", fontSize: 14.5 }}>
        <Check size={16} /> Installed — you&apos;re running PRIME as an app. Nice.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["ios", "iPhone (Safari)"], ["android", "Android (Chrome)"]].map(([k, label]) => (
          <button key={k} onClick={() => setPlatform(k)} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: platform === k ? COL.amber : COL.inp, color: platform === k ? "#000" : "#cfcfd6",
            border: platform === k ? "none" : `1px solid ${COL.line}`,
          }}>{label}</button>
        ))}
      </div>

      {platform === "ios" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Step n="1" icon={Share}>Tap the <b style={{ color: "#fff" }}>Share</b> button in Safari&apos;s toolbar</Step>
          <Step n="2" icon={Plus}>Scroll down and tap <b style={{ color: "#fff" }}>Add to Home Screen</b></Step>
          <Step n="3">Tap <b style={{ color: "#fff" }}>Add</b> — PRIME now opens full-screen like a real app.</Step>
          <div style={{ fontSize: 12.5, color: COL.dim }}>Tip: this only works in <b>Safari</b> on iPhone/iPad, not Chrome.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deferred && (
            <button onClick={doInstall} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: COL.amber, color: "#000", fontWeight: 800, fontSize: 15, padding: "12px 18px", borderRadius: 12, border: "none" }}>
              <Download size={17} /> Install app
            </button>
          )}
          <Step n="1" icon={MoreVertical}>Tap the <b style={{ color: "#fff" }}>⋮ menu</b> (top-right in Chrome)</Step>
          <Step n="2">Tap <b style={{ color: "#fff" }}>Install app</b> or <b style={{ color: "#fff" }}>Add to Home screen</b></Step>
          <Step n="3">Confirm — PRIME appears on your home screen and opens full-screen.</Step>
        </div>
      )}
    </div>
  );
}
