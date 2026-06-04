// AI coach — server-side proxy to Groq (OpenAI-compatible chat completions).
// The key stays on the server (GROQ_API_KEY, NOT NEXT_PUBLIC).
//
// Configure in Vercel + .env.local:
//   GROQ_API_KEY = your Groq API key   (required)
//   GROQ_MODEL   = model id (optional, defaults to llama-3.3-70b-versatile)

const KEY = (process.env.GROQ_API_KEY || "").trim();
const MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const runtime = "edge";

const SYSTEM = `You are PRIME Coach, a concise, encouraging strength & nutrition coach inside a fitness app.
Rules:
- Use the user's CONTEXT (goal, targets, weight trend, adherence, cuisine, diet) to give specific, personalised advice.
- Be practical and brief: short paragraphs or tight bullet lists. No medical claims; suggest a doctor for medical issues.
- Respect their diet (veg/non-veg) and cuisine (North/South Indian) when suggesting food.
- When asked for changes, give concrete numbers (calories, protein, sets) but never recommend dangerous deficits.
- Encourage consistency over perfection. Keep a warm, direct tone.`;

export async function POST(req) {
  if (!KEY) return Response.json({ error: "Coach isn't configured. Add GROQ_API_KEY in your environment." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch (e) { return Response.json({ error: "Bad request" }, { status: 400 }); }

  const context = typeof body?.context === "string" ? body.context.slice(0, 4000) : "";
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  // sanitise: only user/assistant turns, capped
  const turns = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!turns.length) return Response.json({ error: "No message" }, { status: 400 });

  const messages = [
    { role: "system", content: SYSTEM + (context ? `\n\nCONTEXT about this user:\n${context}` : "") },
    ...turns,
  ];

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.4, max_tokens: 700 }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      if (r.status === 401) return Response.json({ error: "Groq rejected the API key (401). In Vercel, set GROQ_API_KEY to a valid key from console.groq.com/keys (it starts with “gsk_”), for the Production environment, then redeploy." }, { status: 401 });
      if (r.status === 404 || /model/i.test(t)) return Response.json({ error: `Model “${MODEL}” not available. Set GROQ_MODEL to a current Groq model (e.g. llama-3.3-70b-versatile) and redeploy.` }, { status: 502 });
      return Response.json({ error: `Coach upstream error (${r.status}).`, detail: t.slice(0, 200) }, { status: 502 });
    }
    const j = await r.json();
    const reply = j?.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply just now.";
    return Response.json({ reply });
  } catch (e) {
    return Response.json({ error: "Coach request failed. Try again." }, { status: 502 });
  }
}
