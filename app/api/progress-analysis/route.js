// AI progress analysis. Sends the user's recent progress photos + their stats
// to a Groq VISION model for supportive, specific feedback. Falls back to a
// text-only analysis of the numbers if vision isn't available.
import { verifyUser, rateLimit } from "@/lib/serverAuth";

export const runtime = "edge";

const KEY = (process.env.GROQ_API_KEY || "").trim();
const MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
const VISION_MODEL = (process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct").trim();
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are PRIME Coach, a supportive, honest physique coach reviewing a user's progress.
- Be encouraging and specific, never judgmental about appearance.
- Comment on visible changes (posture, leanness, muscle) ONLY if photos are provided, and hedge appropriately ("appears", "looks like") — you cannot measure body fat precisely.
- Tie observations to their numbers (weight trend, goal) and give 2–3 concrete next actions.
- Keep it to a short, warm paragraph plus a tight bullet list. No medical claims.`;

async function callGroq(model, messages, maxTokens) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: maxTokens || 500 }),
  });
  if (!r.ok) throw new Error("groq " + r.status);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content || "").trim();
}

export async function POST(req) {
  const user = await verifyUser(req);
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!rateLimit("analysis:" + user.id, 6, 60000)) return Response.json({ error: "Easy — try again in a minute." }, { status: 429 });
  if (!KEY) return Response.json({ error: "Add GROQ_API_KEY to enable AI analysis." }, { status: 503 });

  let body;
  try { body = await req.json(); } catch (e) { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const context = typeof body?.context === "string" ? body.context.slice(0, 2000) : "";
  const images = Array.isArray(body?.images) ? body.images.filter((u) => typeof u === "string").slice(0, 3) : [];

  // Try vision first when we have photos.
  if (images.length) {
    try {
      const content = [
        { type: "text", text: `My stats: ${context}\n\nReview my progress photos and tell me what's changing and what to focus on next.` },
        ...images.map((url) => ({ type: "image_url", image_url: { url } })),
      ];
      const analysis = await callGroq(VISION_MODEL, [{ role: "system", content: SYSTEM }, { role: "user", content }], 550);
      if (analysis) return Response.json({ analysis, vision: true });
    } catch (e) { /* fall through to text */ }
  }

  // Text-only fallback (no photos or vision failed).
  try {
    const analysis = await callGroq(MODEL, [
      { role: "system", content: SYSTEM },
      { role: "user", content: `My stats: ${context}\n\nI couldn't share readable photos. Based on these numbers, assess my progress and give 2–3 next actions.` },
    ], 450);
    return Response.json({ analysis: (images.length ? "(Couldn't read the photos this time — analysis from your numbers.)\n\n" : "") + analysis, vision: false });
  } catch (e) {
    return Response.json({ error: "Analysis failed — try again shortly." }, { status: 502 });
  }
}
