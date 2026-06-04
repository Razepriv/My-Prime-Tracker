// Server-side proxy to the ExerciseDB (AscendAPI) RapidAPI.
// Keeps the API key on the server — it is read from RAPIDAPI_KEY and never
// shipped to the browser. The client calls /api/exercise?name=<exercise>.
//
// Configure in Vercel (Project → Settings → Environment Variables) and in
// .env.local for local dev:
//   RAPIDAPI_KEY  = your RapidAPI key  (required)
//   RAPIDAPI_HOST = host (optional, defaults to the AscendAPI ExerciseDB host)

import { verifyUser, rateLimit } from "@/lib/serverAuth";

const HOST = process.env.RAPIDAPI_HOST || "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const KEY = process.env.RAPIDAPI_KEY;

// cache upstream responses for a day
export const revalidate = 86400;

function pick(obj, keys) {
  for (const k of keys) if (obj && obj[k]) return obj[k];
  return null;
}
function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an|with|and|or|for)\b/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(req) {
  const user = await verifyUser(req);
  if (!user) return Response.json({ found: false, reason: "auth required" }, { status: 401 });
  if (!rateLimit("ex:" + user.id, 90, 60000)) return Response.json({ found: false, reason: "rate limited" }, { status: 429 });
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "").trim();
  if (!name) return Response.json({ found: false, reason: "no name" });
  if (!KEY) return Response.json({ found: false, reason: "no key configured" });

  const q = encodeURIComponent(name);
  // The exact search path varies by deployment — try the known shapes in order.
  const candidates = [
    `https://${HOST}/api/v1/exercises/search?q=${q}&limit=15`,
    `https://${HOST}/api/v1/exercises?search=${q}&limit=15`,
    `https://${HOST}/api/v1/exercises?name=${q}&limit=15`,
  ];
  const headers = { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST, "Content-Type": "application/json" };

  try {
    let list = [];
    for (const url of candidates) {
      const r = await fetch(url, { headers, next: { revalidate } });
      if (!r.ok) continue;
      const j = await r.json();
      list = Array.isArray(j) ? j : (j.data || j.results || j.exercises || []);
      if (list && list.length) break;
    }
    if (!list || !list.length) return Response.json({ found: false });

    // Confident match only: every meaningful word of the query must appear in the
    // candidate's name. Prefer an exact match, else the shortest qualifying name.
    const words = norm(name).split(" ").filter((w) => w.length > 2);
    const qExact = norm(name);
    const qualified = list
      .map((e) => ({ e, n: norm(e.name) }))
      .filter(({ n }) => n && words.every((w) => n.includes(w)));
    const exact = qualified.find(({ n }) => n === qExact);
    const best = (exact || qualified.sort((a, b) => a.n.length - b.n.length)[0] || {}).e;
    if (!best) return Response.json({ found: false }); // no confident match → client uses the video link

    const image = pick(best, ["gifUrl", "imageUrl", "gif", "image"]);
    const video = pick(best, ["videoUrl", "video"]);
    let instructions = best.instructions || best.exerciseTips || [];
    if (!Array.isArray(instructions)) instructions = typeof instructions === "string" ? [instructions] : [];

    return Response.json({
      found: true,
      name: best.name || name,
      image,
      video,
      target: (best.targetMuscles && best.targetMuscles[0]) || null,
      instructions: instructions.slice(0, 6),
    });
  } catch (e) {
    return Response.json({ found: false, reason: "fetch error" });
  }
}
