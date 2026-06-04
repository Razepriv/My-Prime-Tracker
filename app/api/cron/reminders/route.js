// Daily reminder push. Vercel Cron hits this hourly; we send to each user whose
// chosen local reminder hour matches now. No-op unless push env is configured.
//
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (optional)
import webpush from "web-push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SR = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const VPUB = (process.env.VAPID_PUBLIC_KEY || "").trim();
const VPRIV = (process.env.VAPID_PRIVATE_KEY || "").trim();

function authed(req) {
  const s = process.env.CRON_SECRET;
  if (!s) return true; // allow if no secret configured
  return (req.headers.get("authorization") || "") === `Bearer ${s}`;
}

async function loadRows() {
  const r = await fetch(`${URL}/rest/v1/user_data?select=user_id,key,value&key=in.(prime-profile,prime-push)`, {
    headers: { apikey: SR, Authorization: `Bearer ${SR}` },
  });
  if (!r.ok) return [];
  return r.json();
}

export async function GET(req) {
  if (!authed(req)) return new Response("unauthorized", { status: 401 });
  if (!URL || !SR || !VPUB || !VPRIV) return Response.json({ skipped: "push env not configured" });
  webpush.setVapidDetails("mailto:noreply@prime-tracker.app", VPUB, VPRIV);

  const rows = await loadRows();
  const byUser = {};
  for (const row of rows) { (byUser[row.user_id] = byUser[row.user_id] || {})[row.key] = row.value; }

  const nowMin = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  let sent = 0, failed = 0;
  const jobs = [];
  for (const uid of Object.keys(byUser)) {
    const prof = byUser[uid]["prime-profile"];
    const subs = byUser[uid]["prime-push"];
    const rem = prof && prof.reminders;
    if (!prof || !Array.isArray(subs) || !subs.length || !rem || !rem.enabled) continue;
    const [h] = (rem.time || "19:00").split(":").map((n) => parseInt(n));
    const tz = typeof rem.tz === "number" ? rem.tz : 0; // minutes east of UTC
    const localHour = Math.floor((((nowMin + tz) % 1440) + 1440) % 1440 / 60);
    if (localHour !== (h || 19)) continue;
    const payload = JSON.stringify({ title: "PRIME Tracker", body: "Time to train and log your day 💪", url: "/app" });
    for (const sub of subs) {
      jobs.push(webpush.sendNotification(sub, payload).then(() => { sent++; }).catch(() => { failed++; }));
    }
  }
  await Promise.all(jobs);
  return Response.json({ ok: true, sent, failed });
}
