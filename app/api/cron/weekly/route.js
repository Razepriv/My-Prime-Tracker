// Weekly AI check-in push. Vercel Cron runs this weekly; for each subscribed
// user it builds a short context, asks Groq for a 1–2 sentence nudge (falls
// back to a static message), and pushes it. No-op unless push env is set.
import webpush from "web-push";
import { weightTrend } from "@/lib/adaptive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SR = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const VPUB = (process.env.VAPID_PUBLIC_KEY || "").trim();
const VPRIV = (process.env.VAPID_PRIVATE_KEY || "").trim();
const GROQ = (process.env.GROQ_API_KEY || "").trim();
const MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();

function authed(req) {
  const s = process.env.CRON_SECRET;
  if (!s) return true;
  return (req.headers.get("authorization") || "") === `Bearer ${s}`;
}

async function coachLine(prof, weights) {
  const trend = weightTrend(weights || []);
  const ctx = `Goal: ${prof.goal}. Current ${weights?.length ? weights[weights.length - 1].weight : prof.startWeight}kg → target ${prof.goalWeight}kg. Weekly trend ${trend.slopePerWeek.toFixed(2)} kg/wk.`;
  if (!GROQ) {
    const moving = Math.abs(trend.slopePerWeek) > 0.05;
    return moving ? "Your weekly check-in is ready — you're trending toward your goal. Keep the streak alive! 💪" : "Weekly check-in: log consistently this week and the results will follow. You've got this.";
  }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL, temperature: 0.5, max_tokens: 80,
        messages: [
          { role: "system", content: "You are a fitness coach. Write ONE short, warm, specific push-notification (max 160 chars). No greeting, no emojis spam (one max)." },
          { role: "user", content: `Weekly check-in based on: ${ctx}` },
        ],
      }),
    });
    if (!r.ok) throw new Error("groq");
    const j = await r.json();
    return (j?.choices?.[0]?.message?.content || "").trim().slice(0, 180) || "Your weekly check-in is ready.";
  } catch (e) {
    return "Your weekly check-in is ready — keep showing up. 💪";
  }
}

export async function GET(req) {
  if (!authed(req)) return new Response("unauthorized", { status: 401 });
  if (!URL || !SR || !VPUB || !VPRIV) return Response.json({ skipped: "push env not configured" });
  webpush.setVapidDetails("mailto:noreply@prime-tracker.app", VPUB, VPRIV);

  const r = await fetch(`${URL}/rest/v1/user_data?select=user_id,key,value&key=in.(prime-profile,prime-push,prime-weights)`, {
    headers: { apikey: SR, Authorization: `Bearer ${SR}` },
  });
  if (!r.ok) return Response.json({ error: "load failed" }, { status: 502 });
  const rows = await r.json();
  const byUser = {};
  for (const row of rows) { (byUser[row.user_id] = byUser[row.user_id] || {})[row.key] = row.value; }

  let sent = 0;
  const uids = Object.keys(byUser).slice(0, 500);
  for (const uid of uids) {
    const prof = byUser[uid]["prime-profile"];
    const subs = byUser[uid]["prime-push"];
    if (!prof || !Array.isArray(subs) || !subs.length) continue;
    if (prof.reminders && prof.reminders.weekly === false) continue;
    const body = await coachLine(prof, byUser[uid]["prime-weights"]);
    const payload = JSON.stringify({ title: "PRIME weekly check-in", body, url: "/app" });
    await Promise.all(subs.map((s) => webpush.sendNotification(s, payload).then(() => { sent++; }).catch(() => {})));
  }
  return Response.json({ ok: true, sent });
}
