// Server-side helpers shared by API routes (work in both edge & node runtimes —
// they only use fetch + in-memory state).

// Verify a Supabase access token by asking Supabase who it belongs to.
export async function verifyUser(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!token || !url || !anon) return null;
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (e) { return null; }
}

// Best-effort in-memory rate limiter (per serverless instance). Returns false
// when the caller has exceeded `max` requests within `windowMs`.
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return false; }
  arr.push(now);
  buckets.set(key, arr);
  // opportunistic cleanup
  if (buckets.size > 5000) buckets.clear();
  return true;
}

// Authorize a cron call via "Authorization: Bearer <CRON_SECRET>" header OR a
// "?key=<CRON_SECRET>" query param (works with any external scheduler).
// If CRON_SECRET isn't set, allow (so it still runs before you lock it down).
export function cronAuthed(req) {
  const s = process.env.CRON_SECRET;
  if (!s) return true;
  if ((req.headers.get("authorization") || "") === `Bearer ${s}`) return true;
  try { if (new URL(req.url).searchParams.get("key") === s) return true; } catch (e) {}
  return false;
}
