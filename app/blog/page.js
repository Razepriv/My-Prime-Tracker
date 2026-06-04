import { sortedPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — fitness, nutrition & Indian diet guides",
  description: "Evidence-based, no-nonsense guides on fat loss, muscle building, protein, Indian diets and training — from the team behind PRIME Tracker.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "PRIME Tracker Blog", description: "Fitness, nutrition and Indian diet guides.", type: "website" },
};

const COL = { bg: "#0a0a0c", card: "#141417", line: "#26262b", amber: "#f5b301", dim: "#8a8a93" };
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function fmt(d) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch (e) { return d; }
}

export default function BlogIndex() {
  const posts = sortedPosts();
  const featured = posts[0];
  const rest = posts.slice(1);
  return (
    <div style={{ background: COL.bg, minHeight: "100vh", fontFamily: FONT }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,12,.8)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COL.line}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ color: "#fff", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 17, textDecoration: "none" }}>
            <span style={{ color: COL.amber }}>Prime</span> Tracker
          </a>
          <a href="/app" style={{ background: COL.amber, color: "#000", fontWeight: 800, fontSize: 14, padding: "9px 18px", borderRadius: 11, textDecoration: "none" }}>Open app</a>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ color: COL.amber, fontWeight: 800, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}>The PRIME Blog</div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(30px,5vw,44px)", letterSpacing: "-.02em", margin: "10px 0 0" }}>Train smart. Eat smart. Stay consistent.</h1>
        <p style={{ color: COL.dim, fontSize: 17, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 640 }}>
          Practical, science-backed guides on fat loss, muscle, protein and Indian nutrition — the same thinking that powers the app.
        </p>

        {/* featured */}
        <a href={`/blog/${featured.slug}`} style={{ display: "block", marginTop: 32, textDecoration: "none", background: "linear-gradient(135deg, rgba(245,179,1,.10), rgba(245,179,1,.02))", border: `1px solid ${COL.line}`, borderRadius: 20, padding: 24 }}>
          <span style={{ color: COL.amber, fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>{featured.tag} · Featured</span>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(22px,3.5vw,30px)", margin: "10px 0 0", letterSpacing: "-.01em" }}>{featured.title}</h2>
          <p style={{ color: COL.dim, fontSize: 15.5, lineHeight: 1.6, marginTop: 10 }}>{featured.excerpt}</p>
          <div style={{ color: "#6b6b73", fontSize: 13, marginTop: 12 }}>{fmt(featured.date)} · {featured.readMins} min read</div>
        </a>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16, marginTop: 16 }}>
          {rest.map((p) => (
            <a key={p.slug} href={`/blog/${p.slug}`} style={{ display: "flex", flexDirection: "column", textDecoration: "none", background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 18, padding: 20 }}>
              <span style={{ color: COL.amber, fontSize: 11.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>{p.tag}</span>
              <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: "10px 0 0", lineHeight: 1.25 }}>{p.title}</h3>
              <p style={{ color: COL.dim, fontSize: 14, lineHeight: 1.55, marginTop: 8, flex: 1 }}>{p.excerpt}</p>
              <div style={{ color: "#6b6b73", fontSize: 12.5, marginTop: 12 }}>{fmt(p.date)} · {p.readMins} min</div>
            </a>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${COL.line}`, padding: "26px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ color: "#fff", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 14, textDecoration: "none" }}><span style={{ color: COL.amber }}>Prime</span> Tracker</a>
          <div style={{ color: "#3a3a40", fontSize: 11.5, letterSpacing: ".15em", textTransform: "uppercase" }}>Discipline today · Strength tomorrow · Prime forever</div>
        </div>
      </footer>
    </div>
  );
}
