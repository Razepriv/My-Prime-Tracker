import { POSTS } from "@/lib/blog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://primetracker.apexaios.io";

export default function sitemap() {
  const now = new Date();
  // Note: /app is intentionally excluded — it's login-gated and marked noindex.
  const base = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
  const posts = POSTS.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: new Date(p.date + "T00:00:00"),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...base, ...posts];
}
