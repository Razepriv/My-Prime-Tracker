"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import {
  Home, Dumbbell, UtensilsCrossed, TrendingUp, Check, Plus, Minus,
  Moon, Droplets, Flame, Scale, Camera, ChevronLeft, ChevronRight,
  Award, Footprints, Target, Settings, X, Info, LogOut, Mail, Lock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================ STORAGE (Supabase) ============================ */
let CURRENT_USER = null;

async function sGet(key) {
  if (!CURRENT_USER) return null;
  try {
    const { data, error } = await supabase
      .from("user_data").select("value").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch (e) { return null; }
}
async function sSet(key, value) {
  if (!CURRENT_USER) return;
  try {
    await supabase.from("user_data").upsert(
      { user_id: CURRENT_USER, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  } catch (e) {}
}
async function clearAll() {
  if (!CURRENT_USER) return;
  try { await supabase.from("user_data").delete().like("key", "prime-%"); } catch (e) {}
}

/* ============================ DATE HELPERS ============================ */
function dateKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysBetween(start, d) {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86400000);
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function prettyDate(d) { return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
const TOTAL_WEEKS = 28;

/* ============================ PROGRAM DATA ============================ */
const WORKOUTS = {
  fullbody: {
    label: "Full Body", tag: "Foundation",
    ex: [
      { id: "fb_legpress", name: "Leg Press", sets: "3 × 10–12" },
      { id: "fb_latpull", name: "Lat Pulldown", sets: "3 × 10–12" },
      { id: "fb_chestpress", name: "Chest Press (or incline DB press)", sets: "3 × 10–12" },
      { id: "fb_row", name: "Seated Cable Row", sets: "3 × 10–12" },
      { id: "fb_shoulder", name: "Dumbbell Shoulder Press", sets: "2 × 10–12" },
      { id: "fb_plank", name: "Plank", sets: "3 × 30–45 sec" },
    ],
  },
  upperA: {
    label: "Upper A", tag: "Push / Pull",
    ex: [
      { id: "ua_incline", name: "Incline DB Press", sets: "3 × 8–12" },
      { id: "ua_latpull", name: "Lat Pulldown", sets: "3 × 8–12" },
      { id: "ua_row", name: "Seated Row", sets: "3 × 8–12" },
      { id: "ua_shoulder", name: "DB Shoulder Press", sets: "3 × 10–12" },
      { id: "ua_tri", name: "Triceps Pushdown", sets: "3 × 12–15" },
      { id: "ua_curl", name: "DB Curl", sets: "3 × 12–15" },
    ],
  },
  upperB: {
    label: "Upper B", tag: "Push / Pull",
    ex: [
      { id: "ub_chest", name: "Chest Press", sets: "3 × 8–12" },
      { id: "ub_pullup", name: "Assisted Pull-up", sets: "3 × 8–12" },
      { id: "ub_csrow", name: "Chest-Supported Row", sets: "3 × 8–12" },
      { id: "ub_lateral", name: "Lateral Raises", sets: "3 × 12–15" },
      { id: "ub_face", name: "Face Pulls", sets: "3 × 12–15" },
      { id: "ub_hammer", name: "Hammer Curls", sets: "3 × 12–15" },
    ],
  },
  lowerA: {
    label: "Lower A", tag: "Legs",
    ex: [
      { id: "la_legpress", name: "Leg Press", sets: "3 × 10–12" },
      { id: "la_rdl", name: "Romanian Deadlift (light, learn hinge)", sets: "3 × 10–12" },
      { id: "la_curl", name: "Leg Curl", sets: "3 × 10–12" },
      { id: "la_ext", name: "Leg Extension", sets: "3 × 10–12" },
      { id: "la_calf", name: "Calf Raise", sets: "3 × 15–20" },
      { id: "la_knee", name: "Hanging Knee Raise", sets: "3 × 10–12" },
    ],
  },
  lowerB: {
    label: "Lower B", tag: "Legs",
    ex: [
      { id: "lb_goblet", name: "Goblet Squat", sets: "3 × 10–12" },
      { id: "lb_hip", name: "Hip Thrust", sets: "3 × 10–12" },
      { id: "lb_back", name: "Back Extension", sets: "3 × 10–12" },
      { id: "lb_curl", name: "Leg Curl", sets: "3 × 10–12" },
      { id: "lb_calf", name: "Calf Raise", sets: "3 × 15–20" },
      { id: "lb_crunch", name: "Cable Crunch", sets: "3 × 12–15" },
    ],
  },
};

const MEALS = [
  {
    id: "breakfast", title: "Breakfast", protein: "~30g protein",
    nonveg: "3 whole eggs + 2 egg whites omelette (1 tsp oil) + 2 idli or 1 plain dosa. Black coffee / tea, no sugar.",
    veg: "2 moong-dal / besan chilla + 100g paneer bhurji (or a big bowl of thick curd). Black coffee / tea, no sugar.",
  },
  {
    id: "lunch", title: "Lunch · main rice meal", protein: "~45g protein",
    nonveg: "1 cup rice OR 2–3 ragi / jowar rotis + 150g chicken curry or grilled fish. Plenty of low-oil sabzi + salad + small curd.",
    veg: "1 cup rice OR 2–3 ragi / jowar rotis + 1.5 cups dal + 75g soya chunks or paneer. Plenty of low-oil sabzi + salad + small curd.",
  },
  {
    id: "snack", title: "Evening Snack", protein: "~25–30g protein",
    both: "50g dry soya chunks, stir-fried — OR 1 scoop whey in milk — OR boiled eggs + sprouts — OR a roasted chana bowl.",
  },
  {
    id: "dinner", title: "Dinner · light, little/no rice", protein: "~45g protein",
    nonveg: "150–200g chicken or fish + sautéed veg + 2 phulka (or a small millet portion). Optional 1 glass milk before bed.",
    veg: "150g paneer or soya + dal + veg + 2 phulka. Optional 1 glass milk before bed.",
  },
];

const STEP_GOAL = 9000;
const WATER_GOAL = 8;

/* ============================ SCHEDULE LOGIC ============================ */
function getSchedule(startDate, date) {
  const dss = daysBetween(startDate, date);
  if (dss < 0) return { dss, week: 0, phase: 0, workoutKey: null, rest: true, beforeStart: true };
  const week = Math.floor(dss / 7) + 1;
  const dow = date.getDay();
  const phase = week <= 4 ? 1 : 2;
  let workoutKey = null;
  if (phase === 1) {
    if (dow === 1 || dow === 3 || dow === 5) workoutKey = "fullbody";
  } else {
    if (dow === 1) workoutKey = "upperA";
    else if (dow === 4) workoutKey = "upperB";
    else if (dow === 2) workoutKey = "lowerA";
    else if (dow === 5) workoutKey = "lowerB";
  }
  return { dss, week, phase, workoutKey, rest: !workoutKey, beforeStart: false };
}

function blankDay() { return { steps: 0, water: 0, sleep: "", weight: "", ex: {}, meals: {}, notes: "" }; }

function isDayComplete(day, sched) {
  if (!day) return false;
  const mealsOk = MEALS.every((m) => day.meals && day.meals[m.id]);
  let workoutOk = true;
  if (sched.workoutKey) {
    const list = WORKOUTS[sched.workoutKey].ex;
    workoutOk = list.every((e) => day.ex && day.ex[e.id] && day.ex[e.id].done);
  }
  return mealsOk && workoutOk;
}

/* ============================ THEME + SMALL UI ============================ */
const COL = { bg: "#0a0a0c", card: "#141417", line: "#26262b", amber: "#f5b301", amberDim: "#7a5c08" };
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function Ring({ pct, size = 86, stroke = 8, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#26262b" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COL.amber} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}
function Bar({ pct }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: "#26262b" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: COL.amber, transition: "width 0.4s ease", borderRadius: 999 }} />
    </div>
  );
}
function Label({ children }) {
  return <div className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.12em", color: "#6b6b73" }}>{children}</div>;
}
function Spinner() {
  return <div className="min-h-screen flex items-center justify-center" style={{ background: COL.bg, color: COL.amber, fontFamily: FONT }}><Flame size={28} /></div>;
}

/* ============================ CONFIG SCREEN ============================ */
function ConfigScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: COL.bg, fontFamily: FONT }}>
      <div className="rounded-2xl p-6 max-w-md" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="text-xl font-extrabold text-white mb-2">Almost there</div>
        <div className="text-sm" style={{ color: "#9a9aa3" }}>
          This app needs its Supabase keys. Add <span style={{ color: COL.amber }}>NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span style={{ color: COL.amber }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in your Vercel project settings
          (or a local <span style={{ color: COL.amber }}>.env.local</span> file), then redeploy. See the README for exact steps.
        </div>
      </div>
    </div>
  );
}

/* ============================ AUTH SCREEN ============================ */
function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    if (!email || !pw) { setMsg({ t: "err", m: "Enter your email and password." }); return; }
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setMsg({ t: "err", m: error.message });
        else if (!data.session) setMsg({ t: "ok", m: "Account created. If email confirmation is on, check your inbox then sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg({ t: "err", m: error.message });
      }
    } catch (e) { setMsg({ t: "err", m: "Something went wrong. Try again." }); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10" style={{ background: COL.bg, fontFamily: FONT }}>
      <div className="mx-auto w-full" style={{ maxWidth: 400 }}>
        <div className="mb-1 text-3xl font-extrabold text-white uppercase" style={{ letterSpacing: "0.05em" }}>
          <span style={{ color: COL.amber }}>Prime</span> Tracker
        </div>
        <div className="mb-8 text-sm" style={{ color: "#8a8a93" }}>
          {mode === "signup" ? "Create an account to save your progress." : "Sign in to continue your journey."}
        </div>

        <div className="space-y-4 rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div>
            <Label>Email</Label>
            <div className="mt-2 flex items-center gap-2 rounded-xl px-3" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }}>
              <Mail size={16} style={{ color: "#6b6b73" }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com"
                className="w-full bg-transparent py-3 text-white outline-none" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="mt-2 flex items-center gap-2 rounded-xl px-3" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }}>
              <Lock size={16} style={{ color: "#6b6b73" }} />
              <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="at least 6 characters"
                className="w-full bg-transparent py-3 text-white outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            </div>
          </div>

          {msg && (
            <div className="text-sm rounded-lg px-3 py-2"
              style={{ background: msg.t === "err" ? "#2a1414" : "#13261a", color: msg.t === "err" ? "#ff8a8a" : "#8be0a4" }}>
              {msg.m}
            </div>
          )}

          <button onClick={submit} disabled={busy}
            className="w-full rounded-xl py-3.5 font-bold uppercase"
            style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null); }}
            className="w-full text-center text-sm" style={{ color: "#8a8a93" }}>
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>

        <div className="text-center mt-6 text-xs uppercase" style={{ color: "#3a3a40", letterSpacing: "0.15em" }}>
          Discipline today · Strength tomorrow · Prime forever
        </div>
      </div>
    </div>
  );
}

/* ============================ ONBOARDING ============================ */
function Onboarding({ onDone }) {
  const [name, setName] = useState("");
  const [startW, setStartW] = useState("120");
  const [goalW, setGoalW] = useState("95");
  const [diet, setDiet] = useState("both");

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10" style={{ background: COL.bg, fontFamily: FONT }}>
      <div className="mx-auto w-full" style={{ maxWidth: 440 }}>
        <div className="mb-1 text-3xl font-extrabold text-white uppercase" style={{ letterSpacing: "0.04em" }}>
          Your <span style={{ color: COL.amber }}>Prime</span>
        </div>
        <div className="mb-8 text-sm" style={{ color: "#8a8a93" }}>
          A 28-week build to your prime physique. Let&apos;s set your starting point.
        </div>

        <div className="space-y-5 rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div>
            <Label>Name (optional)</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="You"
              className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Start weight (kg)</Label>
              <input value={startW} onChange={(e) => setStartW(e.target.value)} inputMode="decimal"
                className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
            </div>
            <div className="flex-1">
              <Label>Goal weight (kg)</Label>
              <input value={goalW} onChange={(e) => setGoalW(e.target.value)} inputMode="decimal"
                className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
            </div>
          </div>
          <div>
            <Label>Diet preference</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[["veg", "Veg"], ["nonveg", "Non-veg"], ["both", "Both"]].map(([k, t]) => (
                <button key={k} onClick={() => setDiet(k)} className="rounded-xl py-2.5 text-sm font-semibold"
                  style={diet === k ? { background: COL.amber, color: "#000" } : { background: "#1d1d22", color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>Height 181 cm · Today becomes Day 1. The plan auto-advances from here.</div>
          <button
            onClick={() => onDone({
              name: name.trim(), startWeight: parseFloat(startW) || 120, goalWeight: parseFloat(goalW) || 95,
              diet, startDate: dateKey(new Date()),
            })}
            className="w-full rounded-xl py-3.5 font-bold uppercase" style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em" }}>
            Start my journey
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ MAIN APP ============================ */
export default function PrimeApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("today");
  const [selDate, setSelDate] = useState(new Date());
  const [day, setDay] = useState(blankDay());
  const [weights, setWeights] = useState([]);
  const [lifts, setLifts] = useState({});
  const [complete, setComplete] = useState([]);
  const [dietView, setDietView] = useState("nonveg");
  const [showSettings, setShowSettings] = useState(false);

  const startDate = profile ? new Date(profile.startDate + "T00:00:00") : new Date();
  const sched = getSchedule(startDate, selDate);
  const key = dateKey(selDate);
  const isToday = key === dateKey(new Date());

  useEffect(() => setMounted(true), []);

  /* ---- auth session ---- */
  useEffect(() => {
    if (!isConfigured) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);

  /* ---- load all data when signed in ---- */
  useEffect(() => {
    CURRENT_USER = session?.user?.id || null;
    if (!session) { setProfile(null); setDataLoading(false); return; }
    setDataLoading(true);
    (async () => {
      const p = await sGet("prime-profile");
      if (p) {
        setProfile(p);
        setDietView(p.diet === "veg" ? "veg" : "nonveg");
        setWeights((await sGet("prime-weights")) || []);
        setLifts((await sGet("prime-lifts")) || {});
        setComplete((await sGet("prime-complete")) || []);
      } else {
        setProfile(null);
      }
      setDataLoading(false);
    })();
  }, [session]);

  /* ---- load selected day ---- */
  useEffect(() => {
    if (!session || !profile) return;
    (async () => { const d = await sGet("prime-day-" + key); setDay(d || blankDay()); })();
  }, [key, session, profile]);

  /* ---- completion sync ---- */
  const syncComplete = useCallback((dayObj) => {
    const done = isDayComplete(dayObj, sched);
    setComplete((prev) => {
      const has = prev.includes(key);
      let next = prev;
      if (done && !has) next = [...prev, key];
      else if (!done && has) next = prev.filter((k) => k !== key);
      if (next !== prev) sSet("prime-complete", next);
      return next;
    });
  }, [key, sched]);

  const saveDay = useCallback((next) => {
    setDay(next);
    sSet("prime-day-" + key, next);
    syncComplete(next);
  }, [key, syncComplete]);

  const setSteps = (v) => saveDay({ ...day, steps: Math.max(0, v) });
  const setWater = (v) => saveDay({ ...day, water: Math.max(0, Math.min(WATER_GOAL, v)) });
  const setSleep = (v) => saveDay({ ...day, sleep: v });
  const setNotes = (v) => saveDay({ ...day, notes: v });

  const setWeight = (v) => {
    const next = { ...day, weight: v };
    saveDay(next);
    const num = parseFloat(v);
    setWeights((prev) => {
      let arr = prev.filter((w) => w.date !== key);
      if (!isNaN(num)) arr.push({ date: key, weight: num });
      arr.sort((a, b) => (a.date < b.date ? -1 : 1));
      sSet("prime-weights", arr);
      return arr;
    });
  };

  const toggleMeal = (id) => saveDay({ ...day, meals: { ...day.meals, [id]: !day.meals?.[id] } });
  const toggleEx = (id) => {
    const cur = day.ex?.[id] || {};
    saveDay({ ...day, ex: { ...day.ex, [id]: { ...cur, done: !cur.done } } });
  };
  const setExWeight = (id, v) => {
    const cur = day.ex?.[id] || {};
    saveDay({ ...day, ex: { ...day.ex, [id]: { ...cur, weight: v } } });
    setLifts((prev) => {
      const ex = prev[id];
      if (!ex || ex.date <= key) {
        const next = { ...prev, [id]: { weight: v, date: key } };
        sSet("prime-lifts", next);
        return next;
      }
      return prev;
    });
  };

  /* ---- derived ---- */
  const streak = (() => {
    const set = new Set(complete);
    let count = 0; let cursor = new Date();
    if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1);
    while (set.has(dateKey(cursor))) { count++; cursor = addDays(cursor, -1); }
    return count;
  })();

  const score = (() => {
    let pts = 0, max = 0;
    max += 4; pts += MEALS.filter((m) => day.meals?.[m.id]).length;
    if (sched.workoutKey) {
      max += 2;
      const list = WORKOUTS[sched.workoutKey].ex;
      const doneCount = list.filter((e) => day.ex?.[e.id]?.done).length;
      pts += (doneCount / list.length) * 2;
    }
    max += 1; if (day.steps >= STEP_GOAL) pts += 1;
    max += 1; if (day.water >= WATER_GOAL) pts += 1;
    const sl = parseFloat(day.sleep); max += 1; if (!isNaN(sl) && sl >= 7) pts += 1;
    return Math.round((pts / max) * 100);
  })();

  const latestWeight = weights.length ? weights[weights.length - 1].weight : (profile ? profile.startWeight : 0);

  /* ---- gates ---- */
  if (!isConfigured) return <ConfigScreen />;
  if (authLoading) return <Spinner />;
  if (!session) return <AuthScreen />;
  if (dataLoading) return <Spinner />;
  if (!profile) {
    return <Onboarding onDone={async (p) => { await sSet("prime-profile", p); setProfile(p); setDietView(p.diet === "veg" ? "veg" : "nonveg"); }} />;
  }

  const dayNum = sched.beforeStart ? 0 : sched.dss + 1;

  /* ============================ VIEWS ============================ */
  const TodayView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Ring pct={score}>
          <div className="text-2xl font-extrabold text-white">{score}%</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>day</div>
        </Ring>
        <div className="flex-1">
          <Label>{sched.beforeStart ? "Starts soon" : `Day ${dayNum} · Week ${sched.week}/${TOTAL_WEEKS}`}</Label>
          <div className="mt-1 text-xl font-bold text-white">
            {score >= 100 ? "Locked in." : score >= 60 ? "Strong work." : score > 0 ? "Keep going." : "Let's begin."}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: COL.amber }}>
            <Flame size={16} /><span className="font-bold">{streak}-day streak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Footprints size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Steps</span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">{day.steps.toLocaleString()}</div>
          <div className="text-xs mb-2" style={{ color: "#6b6b73" }}>goal {STEP_GOAL.toLocaleString()}</div>
          <Bar pct={(day.steps / STEP_GOAL) * 100} />
          <div className="mt-3 flex gap-2">
            {[1000, 2000].map((n) => (
              <button key={n} onClick={() => setSteps(day.steps + n)} className="flex-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: "#1d1d22", color: "#cfcfd6" }}>+{n}</button>
            ))}
            <button onClick={() => setSteps(0)} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: "#1d1d22", color: "#6b6b73" }}>0</button>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Droplets size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Water</span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-2">{day.water}<span className="text-base" style={{ color: "#6b6b73" }}>/{WATER_GOAL}</span></div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <button key={i} onClick={() => setWater(i + 1 === day.water ? i : i + 1)}
                style={{ width: 18, height: 24, borderRadius: 4, background: i < day.water ? COL.amber : "#1d1d22", border: `1px solid ${COL.line}` }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setWater(day.water - 1)} className="flex-1 rounded-lg py-1.5 flex justify-center" style={{ background: "#1d1d22", color: "#cfcfd6" }}><Minus size={14} /></button>
            <button onClick={() => setWater(day.water + 1)} className="flex-1 rounded-lg py-1.5 flex justify-center" style={{ background: "#1d1d22", color: "#cfcfd6" }}><Plus size={14} /></button>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Moon size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Sleep</span>
          </div>
          <div className="flex items-end gap-1">
            <input value={day.sleep} onChange={(e) => setSleep(e.target.value)} inputMode="decimal" placeholder="0" className="w-16 bg-transparent text-2xl font-extrabold text-white outline-none" />
            <span className="text-sm mb-1" style={{ color: "#6b6b73" }}>hrs</span>
          </div>
          <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>target 7–8 hrs</div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Scale size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Weight</span>
          </div>
          <div className="flex items-end gap-1">
            <input value={day.weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="—" className="w-20 bg-transparent text-2xl font-extrabold text-white outline-none" />
            <span className="text-sm mb-1" style={{ color: "#6b6b73" }}>kg</span>
          </div>
          <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>weigh in the morning</div>
        </div>
      </div>

      <button onClick={() => setTab("workout")} className="w-full text-left rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} style={{ color: COL.amber }} />
            <span className="font-bold text-white">{sched.workoutKey ? WORKOUTS[sched.workoutKey].label : "Rest & Recover"}</span>
          </div>
          <ChevronRight size={18} style={{ color: "#6b6b73" }} />
        </div>
        {sched.workoutKey ? (
          <div className="mt-2 text-sm" style={{ color: "#8a8a93" }}>
            {WORKOUTS[sched.workoutKey].ex.filter((e) => day.ex?.[e.id]?.done).length}/{WORKOUTS[sched.workoutKey].ex.length} exercises done
          </div>
        ) : (
          <div className="mt-2 text-sm" style={{ color: "#8a8a93" }}>Easy walk, mobility, hit your step goal. Recovery is where you grow.</div>
        )}
      </button>

      <button onClick={() => setTab("meals")} className="w-full text-left rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={18} style={{ color: COL.amber }} />
            <span className="font-bold text-white">Meals</span>
          </div>
          <ChevronRight size={18} style={{ color: "#6b6b73" }} />
        </div>
        <div className="mt-2 text-sm" style={{ color: "#8a8a93" }}>
          {MEALS.filter((m) => day.meals?.[m.id]).length}/{MEALS.length} logged · target ~2,000–2,100 kcal · 150–170g protein
        </div>
      </button>

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Notes</Label>
        <textarea value={day.notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did today feel? Energy, cravings, wins…"
          className="mt-2 w-full bg-transparent text-sm outline-none resize-none" style={{ color: "#e4e4e7" }} />
      </div>
    </div>
  );

  const WorkoutView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>{`Phase ${sched.phase} · Week ${sched.week}/${TOTAL_WEEKS}`}</Label>
        <div className="mt-1 text-2xl font-extrabold text-white">{sched.workoutKey ? WORKOUTS[sched.workoutKey].label : "Rest Day"}</div>
        <div className="text-sm" style={{ color: COL.amber }}>{sched.workoutKey ? WORKOUTS[sched.workoutKey].tag : "Recovery"}</div>
      </div>

      {sched.workoutKey ? (
        <>
          <div className="space-y-3">
            {WORKOUTS[sched.workoutKey].ex.map((e) => {
              const st = day.ex?.[e.id] || {};
              const last = lifts[e.id];
              return (
                <div key={e.id} className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${st.done ? COL.amberDim : COL.line}` }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleEx(e.id)} className="mt-0.5 flex items-center justify-center shrink-0"
                      style={{ width: 26, height: 26, borderRadius: 8, background: st.done ? COL.amber : "#1d1d22", border: `1px solid ${st.done ? COL.amber : COL.line}` }}>
                      {st.done && <Check size={16} color="#000" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white leading-tight">{e.name}</div>
                      <div className="text-sm" style={{ color: "#8a8a93" }}>{e.sets}</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: "#6b6b73" }}>Weight</span>
                        <input value={st.weight || ""} onChange={(ev) => setExWeight(e.id, ev.target.value)} inputMode="decimal" placeholder="kg"
                          className="w-20 rounded-lg px-2 py-1 text-sm text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
                        {last && last.weight ? (<span className="text-xs" style={{ color: COL.amber }}>last: {last.weight} kg — beat it</span>) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl p-4 space-y-2" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
            <div className="flex items-center gap-2 text-white font-semibold"><Info size={16} style={{ color: COL.amber }} />Coach notes</div>
            <ul className="text-sm space-y-1" style={{ color: "#8a8a93" }}>
              <li>• Warm up: 5 min easy cardio + 1–2 light sets before your first lift.</li>
              <li>• Start lighter than you think — leave 1–2 reps in the tank while you learn.</li>
              <li>• Progressive overload: hit the top of the rep range with good form, then add weight next time.</li>
              {sched.week >= 9 && <li>• You&apos;re strong enough now — start shifting toward barbell squats and deadlifts. Book a trainer to check form first.</li>}
            </ul>
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="text-white font-semibold mb-2">Active recovery</div>
          <ul className="text-sm space-y-1" style={{ color: "#8a8a93" }}>
            <li>• 8,000–10,000 steps — an easy walk, cycle, or light elliptical.</li>
            <li>• 5–10 min mobility / stretching.</li>
            <li>• Hydrate, eat your protein, sleep 7–8 hrs. This is when muscle is built.</li>
          </ul>
        </div>
      )}
    </div>
  );

  const MealsView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Daily target</Label>
        <div className="mt-1 text-white font-bold">~2,000–2,100 kcal · 150–170g protein</div>
        <div className="text-sm mt-1" style={{ color: "#8a8a93" }}>Measure your cooking oil. No liquid sugar. Eggs and soya chunks are your budget MVPs.</div>
        {profile.diet === "both" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[["nonveg", "Non-veg"], ["veg", "Veg"]].map(([k, t]) => (
              <button key={k} onClick={() => setDietView(k)} className="rounded-xl py-2 text-sm font-semibold"
                style={dietView === k ? { background: COL.amber, color: "#000" } : { background: "#1d1d22", color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {MEALS.map((m) => {
          const on = !!day.meals?.[m.id];
          const text = m.both ? m.both : (dietView === "veg" ? m.veg : m.nonveg);
          return (
            <div key={m.id} className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${on ? COL.amberDim : COL.line}` }}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleMeal(m.id)} className="mt-0.5 flex items-center justify-center shrink-0"
                  style={{ width: 26, height: 26, borderRadius: 8, background: on ? COL.amber : "#1d1d22", border: `1px solid ${on ? COL.amber : COL.line}` }}>
                  {on && <Check size={16} color="#000" strokeWidth={3} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white">{m.title}</div>
                    <div className="text-xs font-semibold" style={{ color: COL.amber }}>{m.protein}</div>
                  </div>
                  <div className="text-sm mt-1" style={{ color: "#9a9aa3" }}>{text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const completeSet = new Set(complete);
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const firstDate = addDays(today0, -34);
  const lead = firstDate.getDay();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 0; i < 35; i++) cells.push(addDays(firstDate, i));

  const lost = profile.startWeight - latestWeight;
  const span = Math.max(1, profile.startWeight - profile.goalWeight);
  const goalPct = Math.min(100, Math.max(0, (lost / span) * 100));
  const chartData = weights.map((w) => ({ date: w.date.slice(5), kg: w.weight }));

  const ProgressView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-end justify-between">
          <div>
            <Label>Current</Label>
            <div className="text-4xl font-extrabold text-white">{latestWeight}<span className="text-lg" style={{ color: "#6b6b73" }}> kg</span></div>
          </div>
          <div className="text-right">
            <Label>Lost</Label>
            <div className="text-2xl font-extrabold" style={{ color: lost > 0 ? COL.amber : "#8a8a93" }}>{lost > 0 ? "−" : ""}{Math.abs(lost).toFixed(1)} kg</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs mb-2" style={{ color: "#8a8a93" }}>
          <span>{profile.startWeight} kg start</span>
          <span style={{ color: COL.amber }}>{goalPct.toFixed(0)}% there</span>
          <span>{profile.goalWeight} kg goal</span>
        </div>
        <Bar pct={goalPct} />
      </div>

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Weight trend</Label>
        {mounted && chartData.length >= 2 ? (
          <div style={{ height: 180, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#26262b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#6b6b73", fontSize: 11 }} axisLine={{ stroke: "#26262b" }} tickLine={false} />
                <YAxis tick={{ fill: "#6b6b73", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#1d1d22", border: `1px solid ${COL.line}`, borderRadius: 12, color: "#fff" }} />
                <ReferenceLine y={profile.goalWeight} stroke={COL.amber} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="kg" stroke={COL.amber} strokeWidth={2.5} dot={{ r: 3, fill: COL.amber }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm mt-3" style={{ color: "#8a8a93" }}>Log your weight on a few days to see your trend line.</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <Flame size={18} style={{ color: COL.amber, margin: "0 auto" }} />
          <div className="text-2xl font-extrabold text-white mt-1">{streak}</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>streak</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <Award size={18} style={{ color: COL.amber, margin: "0 auto" }} />
          <div className="text-2xl font-extrabold text-white mt-1">{complete.length}</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>days done</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <Target size={18} style={{ color: COL.amber, margin: "0 auto" }} />
          <div className="text-2xl font-extrabold text-white mt-1">{Math.max(0, sched.week)}</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>of {TOTAL_WEEKS} wks</div>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <Label>Last 5 weeks</Label>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#6b6b73" }}>
            <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: COL.amber, display: "inline-block" }} /> done</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (<div key={i} className="text-center text-xs" style={{ color: "#6b6b73" }}>{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const k = dateKey(c);
            const done = completeSet.has(k);
            const isT = k === dateKey(today0);
            return (
              <div key={i} className="flex items-center justify-center"
                style={{ aspectRatio: "1", borderRadius: 8, background: done ? COL.amber : "#1d1d22", border: isT ? `2px solid ${COL.amber}` : `1px solid ${COL.line}`, color: done ? "#000" : "#6b6b73", fontSize: 11, fontWeight: 700 }}>
                {c.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Camera size={20} style={{ color: COL.amber }} />
        <div className="text-sm" style={{ color: "#9a9aa3" }}>Take a front + side progress photo every 2 weeks. The scale lies on bad days — photos show the real change.</div>
      </div>
    </div>
  );

  const tabs = [
    { id: "today", label: "Today", icon: Home },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "meals", label: "Meals", icon: UtensilsCrossed },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div style={{ background: COL.bg, minHeight: "100vh", fontFamily: FONT }}>
      <div className="mx-auto" style={{ maxWidth: 480 }}>
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ background: COL.bg, borderBottom: `1px solid ${COL.line}` }}>
          <div className="flex items-center justify-between">
            <div className="text-xl font-extrabold text-white uppercase" style={{ letterSpacing: "0.06em" }}>
              {profile.name ? `${profile.name}'s ` : ""}<span style={{ color: COL.amber }}>Prime</span>
            </div>
            <button onClick={() => setShowSettings(true)} style={{ color: "#8a8a93" }}><Settings size={20} /></button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={() => setSelDate(addDays(selDate, -1))} className="p-2 rounded-lg" style={{ background: COL.card }}><ChevronLeft size={18} color="#cfcfd6" /></button>
            <button onClick={() => setSelDate(new Date())} className="text-center">
              <div className="text-sm font-bold text-white">{isToday ? "Today" : prettyDate(selDate)}</div>
              <div className="text-xs" style={{ color: "#6b6b73" }}>{isToday ? prettyDate(selDate) : "tap for today"}</div>
            </button>
            <button onClick={() => setSelDate(addDays(selDate, 1))} className="p-2 rounded-lg" style={{ background: COL.card }}><ChevronRight size={18} color="#cfcfd6" /></button>
          </div>
        </div>

        <div className="px-4 py-4" style={{ paddingBottom: 96 }}>
          {sched.beforeStart && (
            <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: COL.card, border: `1px solid ${COL.line}`, color: "#9a9aa3" }}>
              This day is before your start date. Your plan begins {prettyDate(startDate)}.
            </div>
          )}
          {tab === "today" && TodayView}
          {tab === "workout" && WorkoutView}
          {tab === "meals" && MealsView}
          {tab === "progress" && ProgressView}

          <div className="text-center mt-8 mb-2 text-xs uppercase" style={{ color: "#3a3a40", letterSpacing: "0.15em" }}>
            Discipline today · Strength tomorrow · Prime forever
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20" style={{ background: COL.bg, borderTop: `1px solid ${COL.line}` }}>
          <div className="mx-auto flex" style={{ maxWidth: 480 }}>
            {tabs.map((t) => {
              const Icon = t.icon; const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 py-3">
                  <Icon size={20} color={active ? COL.amber : "#6b6b73"} />
                  <span className="text-xs" style={{ color: active ? COL.amber : "#6b6b73", fontWeight: active ? 700 : 500 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowSettings(false)}>
          <div className="w-full p-5 rounded-t-3xl" style={{ maxWidth: 480, background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ color: "#8a8a93" }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Start weight</Label>
                  <input value={profile.startWeight} onChange={(e) => { const p = { ...profile, startWeight: parseFloat(e.target.value) || 0 }; setProfile(p); sSet("prime-profile", p); }}
                    inputMode="decimal" className="mt-2 w-full rounded-xl px-3 py-2.5 text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
                </div>
                <div className="flex-1">
                  <Label>Goal weight</Label>
                  <input value={profile.goalWeight} onChange={(e) => { const p = { ...profile, goalWeight: parseFloat(e.target.value) || 0 }; setProfile(p); sSet("prime-profile", p); }}
                    inputMode="decimal" className="mt-2 w-full rounded-xl px-3 py-2.5 text-white outline-none" style={{ background: "#1d1d22", border: `1px solid ${COL.line}` }} />
                </div>
              </div>
              <div>
                <Label>Diet preference</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[["veg", "Veg"], ["nonveg", "Non-veg"], ["both", "Both"]].map(([k, t]) => (
                    <button key={k} onClick={() => { const p = { ...profile, diet: k }; setProfile(p); sSet("prime-profile", p); if (k !== "both") setDietView(k); }}
                      className="rounded-xl py-2 text-sm font-semibold"
                      style={profile.diet === k ? { background: COL.amber, color: "#000" } : { background: "#1d1d22", color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="text-xs" style={{ color: "#6b6b73" }}>Started {prettyDate(startDate)} · Day {Math.max(0, dayNum)} · {session?.user?.email}</div>

              <button onClick={async () => { setShowSettings(false); await supabase.auth.signOut(); }}
                className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#1d1d22", color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                <LogOut size={16} /> Sign out
              </button>

              <button
                onClick={async () => {
                  if (confirm("Reset ALL your data and start over? This cannot be undone.")) {
                    await clearAll();
                    setProfile(null); setWeights([]); setLifts({}); setComplete([]); setDay(blankDay()); setSelDate(new Date()); setTab("today"); setShowSettings(false);
                  }
                }}
                className="w-full rounded-xl py-2.5 text-sm font-semibold" style={{ background: "#2a1414", color: "#ff8a8a", border: "1px solid #3a1a1a" }}>
                Reset all data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
