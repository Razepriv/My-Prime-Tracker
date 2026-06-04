import { notFound } from "next/navigation";
import { POSTS, getPost, sortedPosts } from "@/lib/blog";

const COL = { bg: "#0a0a0c", card: "#141417", line: "#26262b", amber: "#f5b301", dim: "#8a8a93" };
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date },
    twitter: { card: "summary", title: post.title, description: post.excerpt },
  };
}

function fmt(d) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch (e) { return d; }
}

function Block({ b }) {
  if (b.h) return <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "28px 0 0", letterSpacing: "-.01em" }}>{b.h}</h2>;
  if (b.ul) return (
    <ul style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {b.ul.map((it, i) => (
        <li key={i} style={{ color: "#cfcfd6", fontSize: 16.5, lineHeight: 1.6, display: "flex", gap: 10 }}>
          <span style={{ color: COL.amber }}>•</span><span>{it}</span>
        </li>
      ))}
    </ul>
  );
  if (b.tip) return (
    <div style={{ margin: "20px 0 0", background: "rgba(245,179,1,.08)", border: `1px solid #7a5c08`, borderRadius: 14, padding: "14px 16px", color: "#e7e7ea", fontSize: 15.5, lineHeight: 1.6 }}>
      <strong style={{ color: COL.amber }}>Tip: </strong>{b.tip}
    </div>
  );
  return <p style={{ color: "#cfcfd6", fontSize: 16.5, lineHeight: 1.7, margin: "14px 0 0" }}>{b.p}</p>;
}

export default function BlogPost({ params }) {
  const post = getPost(params.slug);
  if (!post) return notFound();
  const more = sortedPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "PRIME Tracker" },
    publisher: { "@type": "Organization", name: "PRIME Tracker" },
  };

  return (
    <div style={{ background: COL.bg, minHeight: "100vh", fontFamily: FONT }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,12,.8)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COL.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/blog" style={{ color: COL.dim, fontSize: 14, textDecoration: "none" }}>← All articles</a>
          <a href="/app" style={{ background: COL.amber, color: "#000", fontWeight: 800, fontSize: 14, padding: "9px 18px", borderRadius: 11, textDecoration: "none" }}>Open app</a>
        </div>
      </header>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
        <div style={{ color: COL.amber, fontSize: 12.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>{post.tag}</div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(28px,5vw,40px)", letterSpacing: "-.02em", margin: "10px 0 0", lineHeight: 1.1 }}>{post.title}</h1>
        <div style={{ color: "#6b6b73", fontSize: 14, marginTop: 12 }}>{fmt(post.date)} · {post.readMins} min read</div>
        <p style={{ color: COL.dim, fontSize: 18, lineHeight: 1.6, margin: "18px 0 0" }}>{post.excerpt}</p>
        <div style={{ height: 1, background: COL.line, margin: "26px 0 0" }} />
        {post.body.map((b, i) => <Block key={i} b={b} />)}

        {/* CTA */}
        <div style={{ marginTop: 36, borderRadius: 18, padding: "24px", textAlign: "center", background: "linear-gradient(135deg, rgba(245,179,1,.12), rgba(245,179,1,.02))", border: `1px solid #7a5c08` }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>Put this into practice</div>
          <p style={{ color: COL.dim, fontSize: 15, lineHeight: 1.6, margin: "8px auto 0", maxWidth: 460 }}>PRIME Tracker turns these principles into a personalised plan — calories, workouts, recipes and progress, free.</p>
          <a href="/app" style={{ display: "inline-block", marginTop: 16, background: COL.amber, color: "#000", fontWeight: 800, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>Start free</a>
        </div>
      </article>

      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 70px" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Keep reading</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 14 }}>
          {more.map((p) => (
            <a key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: "none", background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: COL.amber, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{p.tag}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15.5, marginTop: 8, lineHeight: 1.3 }}>{p.title}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
