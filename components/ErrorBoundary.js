"use client";
import React from "react";

// Catches render crashes so users get a recoverable screen instead of a white
// page, and logs the error to the console (visible in Vercel/her browser).
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("[PRIME] App error:", err, info); } catch (e) {} }
  render() {
    if (this.state.err) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Helvetica, Arial, sans-serif", padding: 24, textAlign: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ color: "#9a9aa3", fontSize: 14, marginBottom: 16 }}>Please reload — your saved data is safe.</div>
            <button onClick={() => { try { location.reload(); } catch (e) {} }} style={{ background: "#f5b301", color: "#000", fontWeight: 700, padding: "10px 18px", borderRadius: 10, border: "none" }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
