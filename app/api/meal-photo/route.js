// Estimate a meal's nutrition from a photo using a Groq vision model.
// Returns { food: { name, kcal, protein, carbs, fat } } or an error.
import { verifyUser, rateLimit } from "@/lib/serverAuth";

export const runtime = "edge";

const KEY = (process.env.GROQ_API_KEY || "").trim();
const VISION_MODEL = (process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct").trim();
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You estimate nutrition from a single meal photo. Identify the dish and a typical single-serving estimate.
Reply with ONLY compact JSON, no prose: {"name":"<dish>","kcal":<int>,"protein":<int>,"carbs":<int>,"fat":<int>}.
If the image is unclear, give your best reasonable estimate for what's visible.`;

export async function POST(req) {
  const user = await verifyUser(req);
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!rateLimit("meal:" + user.id, 12, 60000)) return Response.json({ error: "Slow down a moment and try again." }, { status: 429 });
  if (!KEY) return Response.json({ error: "Add GROQ_API_KEY to enable photo logging." }, { status: 503 });

  let body;
  try { body = await req.json(); } catch (e) { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const image = typeof body?.image === "string" ? body.image : "";
  if (!image || image.length < 50) return Response.json({ error: "No image" }, { status: 400 });

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL, temperature: 0.3, max_tokens: 200,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Estimate the nutrition for this meal." },
            { type: "image_url", image_url: { url: image } },
          ] },
        ],
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      if (r.status === 401) return Response.json({ error: "AI key rejected (401)." }, { status: 401 });
      if (r.status === 404 || /model|vision|image/i.test(t)) return Response.json({ error: "Vision model unavailable — set GROQ_VISION_MODEL to a current Groq vision model." }, { status: 502 });
      return Response.json({ error: `Analysis error (${r.status}).` }, { status: 502 });
    }
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return Response.json({ error: "Couldn't read the meal — try a clearer photo or add it manually." }, { status: 422 });
    let parsed;
    try { parsed = JSON.parse(m[0]); } catch (e) { return Response.json({ error: "Couldn't parse the estimate — try again." }, { status: 422 }); }
    const food = {
      name: String(parsed.name || "Meal").slice(0, 60),
      kcal: Math.max(0, Math.round(Number(parsed.kcal) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
    };
    if (!food.kcal) return Response.json({ error: "Couldn't estimate calories — add it manually." }, { status: 422 });
    return Response.json({ food });
  } catch (e) {
    return Response.json({ error: "Analysis failed — try again." }, { status: 502 });
  }
}
