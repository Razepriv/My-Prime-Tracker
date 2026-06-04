"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import {
  Home, Dumbbell, UtensilsCrossed, TrendingUp, Check, Plus, Minus,
  Moon, Droplets, Flame, Scale, Camera, ChevronLeft, ChevronRight,
  Award, Footprints, Target, Settings, X, Info, LogOut, Mail, Lock,
  Play, Upload, Trash2, User, Activity, Leaf, Beef, Timer, RotateCcw,
  Sparkles, Send, Smartphone, Bell, Trophy, ScanLine, Share2, Users,
} from "lucide-react";
import InstallGuide from "@/components/InstallGuide";
import { ACHIEVEMENTS, evaluate as evalAchievements, meta as achMeta } from "@/lib/achievements";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { WORKOUTS, getSchedule, demoUrl, exSearch, goalPlan, resolveExercise, prepWeeksFor, EXPERIENCE, EQUIPMENT } from "@/lib/workouts";
import { targets, bmi, bmiBand, ACTIVITY, GOALS, clampNum, goalPace } from "@/lib/calc";
import { computeAdaptive } from "@/lib/adaptive";
import {
  buildPlan, composePlan, fillRemaining, foodById, sumLog, searchFoods, MEAL_ORDER, MEAL_LABEL,
  COUNTRIES, COUNTRY_ORDER, cuisineFor, countryHasRegions,
} from "@/lib/foods";

/* ============================ STORAGE (Supabase) ============================ */
let CURRENT_USER = null;
// write-status listener so the UI can surface save failures instead of losing data silently
let SYNC_LISTENER = null;
function setSyncListener(fn) { SYNC_LISTENER = fn; }
function notifySync(status) { if (SYNC_LISTENER) SYNC_LISTENER(status); }

async function sGet(key) {
  if (!CURRENT_USER) return null;
  try {
    const { data, error } = await supabase
      .from("user_data").select("value").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch (e) { return null; }
}
// Batch-fetch several keys in one round-trip → object keyed by key.
async function sGetMany(keys) {
  if (!CURRENT_USER || !keys.length) return {};
  try {
    const { data, error } = await supabase.from("user_data").select("key,value").in("key", keys);
    if (error || !data) return {};
    const out = {};
    for (const row of data) out[row.key] = row.value;
    return out;
  } catch (e) { return {}; }
}
// Fetch all rows whose key starts with prefix (used for day history).
async function sGetPrefix(prefix) {
  if (!CURRENT_USER) return [];
  try {
    const { data, error } = await supabase.from("user_data").select("key,value").like("key", prefix + "%");
    if (error || !data) return [];
    return data;
  } catch (e) { return []; }
}
async function sSet(key, value) {
  if (!CURRENT_USER) return false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await supabase.from("user_data").upsert(
        { user_id: CURRENT_USER, key, value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" }
      );
      if (!error) { notifySync({ ok: true }); return true; }
    } catch (e) { /* retry */ }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  notifySync({ ok: false });
  return false;
}
async function clearAll() {
  if (!CURRENT_USER) return;
  try { await supabase.from("user_data").delete().like("key", "prime-%"); } catch (e) {}
}
const PHOTO_URL_TTL = 60 * 60 * 24 * 7; // 7 days

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Authorization header carrying the Supabase access token for our API routes.
async function authHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const tok = data?.session?.access_token;
    return tok ? { Authorization: `Bearer ${tok}` } : {};
  } catch (e) { return {}; }
}

// Downscale a chosen photo to a small JPEG data URL (keeps payloads light).
function fileToScaledDataURL(file, max = 768, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL("image/jpeg", quality)); } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Fire a system notification (via the service worker when possible). No-op
// unless the user has granted permission.
function notify(title, body) {
  try {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, icon: "/icon.svg", badge: "/icon.svg" })).catch(() => {});
    } else {
      new Notification(title, { body, icon: "/icon.svg" });
    }
  } catch (e) {}
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
const STEP_GOAL = 9000;
const WATER_GOAL = 8;

/* ============================ THEME + SMALL UI ============================ */
const COL = { bg: "#0a0a0c", card: "#141417", line: "#26262b", amber: "#f5b301", amberDim: "#7a5c08", inp: "#1d1d22" };
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
function Bar({ pct, color = COL.amber }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: "#26262b" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, transition: "width 0.4s ease", borderRadius: 999 }} />
    </div>
  );
}
function Label({ children }) {
  return <div className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.12em", color: "#6b6b73" }}>{children}</div>;
}
function Spinner() {
  return <div className="min-h-screen flex items-center justify-center" style={{ background: COL.bg, color: COL.amber, fontFamily: FONT }}><Flame size={28} /></div>;
}
function Input(props) {
  return <input {...props} className={"w-full rounded-xl px-3 py-3 text-white outline-none " + (props.className || "")}
    style={{ background: COL.inp, border: `1px solid ${COL.line}`, ...(props.style || {}) }} />;
}
function Pills({ options, value, onChange, cols = 3 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map(([k, t]) => (
        <button key={k} type="button" onClick={() => onChange(k)} className="rounded-xl py-2.5 px-2 text-sm font-semibold"
          style={value === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
          {t}
        </button>
      ))}
    </div>
  );
}
function MacroBar({ name, value, target, color }) {
  const pct = target ? (value / target) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#9a9aa3" }}>
        <span>{name}</span><span>{Math.round(value)}{target ? ` / ${target}g` : "g"}</span>
      </div>
      <Bar pct={pct} color={color} />
    </div>
  );
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
          (or a local <span style={{ color: COL.amber }}>.env.local</span> file), then redeploy.
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

  const forgot = async () => {
    if (!email) { setMsg({ t: "err", m: "Enter your email first, then tap reset." }); return; }
    setBusy(true); setMsg(null);
    try {
      const redirectTo = typeof window !== "undefined" ? window.location.origin + "/app" : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: "Password reset link sent — check your email." });
    } catch (e) { setMsg({ t: "err", m: "Couldn't send the reset email. Try again." }); }
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
            <div className="mt-2 flex items-center gap-2 rounded-xl px-3" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
              <Mail size={16} style={{ color: "#6b6b73" }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com"
                className="w-full bg-transparent py-3 text-white outline-none" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="mt-2 flex items-center gap-2 rounded-xl px-3" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
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
          <button onClick={submit} disabled={busy} className="w-full rounded-xl py-3.5 font-bold uppercase"
            style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null); }}
            className="w-full text-center text-sm" style={{ color: "#8a8a93" }}>
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
          {mode === "signin" && (
            <button onClick={forgot} disabled={busy} className="w-full text-center text-xs" style={{ color: "#6b6b73" }}>Forgot password?</button>
          )}
        </div>
        <div className="text-center mt-6 text-xs uppercase" style={{ color: "#3a3a40", letterSpacing: "0.15em" }}>
          Discipline today · Strength tomorrow · Prime forever
        </div>
      </div>
    </div>
  );
}

/* ============================ PASSWORD RECOVERY ============================ */
function RecoveryScreen({ onDone }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const save = async () => {
    if (pw.length < 6) { setMsg("Use at least 6 characters."); return; }
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) setMsg(error.message); else onDone();
    } catch (e) { setMsg("Couldn't update — try again."); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen flex flex-col justify-center px-6" style={{ background: COL.bg, fontFamily: FONT }}>
      <div className="mx-auto w-full" style={{ maxWidth: 400 }}>
        <div className="text-2xl font-extrabold text-white mb-2">Set a new password</div>
        <div className="space-y-4 rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
          {msg && <div className="text-sm rounded-lg px-3 py-2" style={{ background: "#2a1414", color: "#ff8a8a" }}>{msg}</div>}
          <button onClick={save} disabled={busy} className="w-full rounded-xl py-3.5 font-bold uppercase" style={{ background: COL.amber, color: "#000", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save password"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ ONBOARDING (multi-step) ============================ */
const DEFAULT_PROFILE = {
  name: "", sex: "male", age: "28", heightCm: "175", startWeight: "80", goalWeight: "72",
  goal: "prime", goalMonths: "4", activity: "moderate", experience: "beginner", equipment: "gym",
  workoutDays: [1, 3, 5],
  country: "india", region: "north", diet: "nonveg",
};

const DOW_LABELS = [["0", "S"], ["1", "M"], ["2", "T"], ["3", "W"], ["4", "T"], ["5", "F"], ["6", "S"]];
function WeekdayPicker({ value, onChange }) {
  const set = new Set(value || []);
  const toggle = (d) => {
    const next = new Set(set);
    next.has(d) ? next.delete(d) : next.add(d);
    onChange([...next].sort((a, b) => a - b));
  };
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DOW_LABELS.map(([k, label]) => {
        const d = parseInt(k);
        const on = set.has(d);
        return (
          <button key={k} type="button" aria-label={`Toggle day ${label}`} onClick={() => toggle(d)} className="rounded-lg py-2 text-sm font-bold"
            style={on ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{label}</button>
        );
      })}
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ ...DEFAULT_PROFILE });
  const [startDate, setStartDate] = useState(dateKey(new Date()));
  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const steps = ["About you", "Your body", "Your goal", "Training", "Your food"];
  const today = dateKey(new Date());
  const valid = (() => {
    if (step === 0) { const a = parseFloat(p.age); return a >= 13 && a <= 100; }
    if (step === 1) {
      const h = parseFloat(p.heightCm), sw = parseFloat(p.startWeight), gw = parseFloat(p.goalWeight);
      return h >= 120 && h <= 230 && sw >= 30 && sw <= 300 && gw >= 30 && gw <= 300;
    }
    if (step === 2) { const m = parseFloat(p.goalMonths); return m >= 1 && m <= 60; }
    return true;
  })();
  const t = targets(
    { ...p, sex: p.sex, age: p.age, heightCm: p.heightCm, activity: p.activity, goal: p.goal },
    p.startWeight
  );

  const finish = () => onDone({
    name: p.name.trim(),
    sex: p.sex,
    age: parseInt(p.age) || 28,
    heightCm: parseFloat(p.heightCm) || 175,
    startWeight: parseFloat(p.startWeight) || 80,
    goalWeight: parseFloat(p.goalWeight) || 72,
    goal: p.goal,
    goalMonths: parseFloat(p.goalMonths) || 4,
    activity: p.activity,
    experience: p.experience,
    equipment: p.equipment,
    workoutDays: (p.workoutDays && p.workoutDays.length) ? p.workoutDays : [1, 3, 5],
    country: p.country,
    region: countryHasRegions(p.country) ? p.region : "any",
    diet: p.diet,
    startDate: startDate || dateKey(new Date()),
  });

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10" style={{ background: COL.bg, fontFamily: FONT }}>
      <div className="mx-auto w-full" style={{ maxWidth: 440 }}>
        <div className="mb-1 text-3xl font-extrabold text-white uppercase" style={{ letterSpacing: "0.04em" }}>
          Your <span style={{ color: COL.amber }}>Prime</span>
        </div>
        <div className="mb-5 text-sm" style={{ color: "#8a8a93" }}>{steps[step]} · step {step + 1} of {steps.length}</div>
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 rounded-full" style={{ height: 4, background: i <= step ? COL.amber : COL.line }} />
          ))}
        </div>

        <div className="space-y-5 rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          {step === 0 && (
            <>
              <div><Label>Name (optional)</Label><div className="mt-2"><Input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="You" /></div></div>
              <div><Label>Sex (for calorie maths)</Label><div className="mt-2"><Pills cols={2} options={[["male", "Male"], ["female", "Female"]]} value={p.sex} onChange={(v) => set("sex", v)} /></div></div>
              <div><Label>Age</Label><div className="mt-2"><Input value={p.age} onChange={(e) => set("age", e.target.value)} inputMode="numeric" /></div></div>
            </>
          )}
          {step === 1 && (
            <>
              <div><Label>Height (cm)</Label><div className="mt-2"><Input value={p.heightCm} onChange={(e) => set("heightCm", e.target.value)} inputMode="decimal" /></div></div>
              <div className="flex gap-3">
                <div className="flex-1"><Label>Current weight (kg)</Label><div className="mt-2"><Input value={p.startWeight} onChange={(e) => set("startWeight", e.target.value)} inputMode="decimal" /></div></div>
                <div className="flex-1"><Label>Goal weight (kg)</Label><div className="mt-2"><Input value={p.goalWeight} onChange={(e) => set("goalWeight", e.target.value)} inputMode="decimal" /></div></div>
              </div>
              <div className="text-xs" style={{ color: "#6b6b73" }}>BMI now: {bmi(p.startWeight, p.heightCm) || "—"}</div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <Label>Main goal</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(GOALS).map(([k, g]) => (
                    <button key={k} type="button" onClick={() => set("goal", k)} className="w-full text-left rounded-xl px-4 py-3"
                      style={p.goal === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                      <div className="font-bold">{g.label}</div>
                      <div className="text-xs" style={{ color: p.goal === k ? "#5a4500" : "#8a8a93" }}>{g.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Activity level</Label>
                <select value={p.activity} onChange={(e) => set("activity", e.target.value)}
                  className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                  {Object.entries(ACTIVITY).map(([k, a]) => <option key={k} value={k} style={{ background: COL.inp }}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Reach my goal weight in… (months)</Label>
                <input value={p.goalMonths} onChange={(e) => set("goalMonths", e.target.value)} inputMode="decimal"
                  className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
                {(() => {
                  const pace = goalPace({ goalWeight: p.goalWeight, goalMonths: p.goalMonths, startWeight: p.startWeight }, p.startWeight);
                  if (!pace) return <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>We&apos;ll personalise your calories to hit this.</div>;
                  return (
                    <div className="text-xs mt-1" style={{ color: pace.clamped ? "#f5b301" : "#6b6b73" }}>
                      ≈ {Math.abs(pace.cappedPerWeek).toFixed(2)} kg/week.
                      {pace.clamped ? ` That pace is aggressive — for safety we'll aim for ~${pace.realisticMonths} months instead.` : " A safe, sustainable pace."}
                    </div>
                  );
                })()}
              </div>
              <div className="rounded-xl p-3" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                <div className="text-xs" style={{ color: "#6b6b73" }}>Your daily target (auto-calculated)</div>
                <div className="text-white font-bold text-lg">{targets({ ...p, goalMonths: p.goalMonths }, p.startWeight).calories} kcal · {targets({ ...p }, p.startWeight).protein}g protein</div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div>
                <Label>Your experience</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(EXPERIENCE).map(([k, x]) => (
                    <button key={k} type="button" onClick={() => set("experience", k)} className="w-full text-left rounded-xl px-4 py-3"
                      style={p.experience === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                      <div className="font-bold">{x.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: p.experience === k ? "#5a4500" : "#8a8a93" }}>{x.note}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Where will you train?</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(EQUIPMENT).map(([k, x]) => (
                    <button key={k} type="button" onClick={() => set("equipment", k)} className="w-full text-left rounded-xl px-4 py-2.5"
                      style={p.equipment === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                      <span className="font-bold">{x.label}</span> <span className="text-xs">· {x.note}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Which days will you train?</Label>
                <div className="mt-2"><WeekdayPicker value={p.workoutDays} onChange={(v) => set("workoutDays", v)} /></div>
                <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>Recommended: <span style={{ color: COL.amber }}>3 days</span> to start (e.g. Mon/Wed/Fri); 4 once you progress. Rest days are auto-scheduled around them.</div>
              </div>
              <div>
                <Label>Start date</Label>
                <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}`, colorScheme: "dark" }} />
                <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>Today is fine — or pick a future day if you want to start later. Day 1 begins then.</div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div>
                <Label>Country</Label>
                <select value={p.country} onChange={(e) => set("country", e.target.value)}
                  className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                  {COUNTRY_ORDER.map((c) => <option key={c} value={c} style={{ background: COL.inp }}>{COUNTRIES[c].label}</option>)}
                </select>
                <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>Meals are tailored to your country&apos;s cuisine (India has the deepest menu); universal staples show everywhere.</div>
              </div>
              {countryHasRegions(p.country) && (
                <div><Label>Regional cuisine</Label><div className="mt-2"><Pills cols={2} options={[["north", "North Indian"], ["south", "South Indian"]]} value={p.region} onChange={(v) => set("region", v)} /></div></div>
              )}
              <div><Label>Diet preference</Label><div className="mt-2"><Pills options={[["veg", "Veg"], ["nonveg", "Non-veg"], ["both", "Both"]]} value={p.diet} onChange={(v) => set("diet", v)} /></div></div>
            </>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="rounded-xl py-3.5 px-5 font-bold"
              style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>Back</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => valid && setStep(step + 1)} disabled={!valid} className="flex-1 rounded-xl py-3.5 font-bold uppercase"
              style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em", opacity: valid ? 1 : 0.45 }}>Next</button>
          ) : (
            <button onClick={finish} className="flex-1 rounded-xl py-3.5 font-bold uppercase"
              style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em" }}>Start my journey</button>
          )}
        </div>
      </div>
    </div>
  );
}

function blankDay() { return { steps: 0, water: 0, sleep: "", weight: "", ex: {}, food: [], notes: "" }; }

/* ===== exercise media (gif + video) from the ExerciseDB proxy, with fallback ===== */
const EX_MEDIA_CACHE = {};
function ExerciseMedia({ name, query, fallbackHref }) {
  const q = query || name;
  const [m, setM] = useState(EX_MEDIA_CACHE[q]);
  useEffect(() => {
    let on = true;
    if (EX_MEDIA_CACHE[q] !== undefined) { setM(EX_MEDIA_CACHE[q]); return; }
    authHeaders()
      .then((h) => fetch("/api/exercise?name=" + encodeURIComponent(q), { headers: h }))
      .then((r) => r.json())
      .then((d) => { EX_MEDIA_CACHE[q] = d; if (on) setM(d); })
      .catch(() => { EX_MEDIA_CACHE[q] = { found: false }; if (on) setM({ found: false }); });
    return () => { on = false; };
  }, [q]);

  const videoHref = (m && m.found && m.video) ? m.video : fallbackHref;
  return (
    <div>
      {m && m.found && m.image && (
        <img src={m.image} alt={name} loading="lazy" onError={(ev) => { ev.currentTarget.style.display = "none"; }}
          style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 12, marginTop: 8, background: "#000" }} />
      )}
      <a href={videoHref} target="_blank" rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
        style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}>
        <Play size={12} /> {(m && m.found && m.video) ? "Watch video" : "Watch demo"}
      </a>
    </div>
  );
}

/* ============================ SET LOGGING ============================ */
function parseSetCount(s) { if (!/[×x]/i.test(s || "")) return 1; const m = (s || "").match(/(\d+)/); return m ? Math.min(6, Math.max(1, parseInt(m[1]))) : 3; }
function ensureSets(e, st, extra = 0) {
  if (st && Array.isArray(st.sets) && st.sets.length) return st.sets.map((x) => ({ w: x.w ?? "", reps: x.reps ?? "", done: !!x.done }));
  const n = Math.max(1, parseSetCount(e.sets) + extra);
  const seed = st?.weight || "";
  return Array.from({ length: n }, (_, i) => ({ w: i === 0 ? seed : "", reps: "", done: !!st?.done }));
}

function RestTimer({ suggest = 90 }) {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (sec <= 0) { setRunning(false); try { navigator.vibrate && navigator.vibrate(220); } catch (e) {} return; }
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, sec]);
  const start = (s) => { setSec(s); setRunning(true); };
  const mm = String(Math.floor(sec / 60)).padStart(1, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const options = Array.from(new Set([suggest, 60, 90, 120])).sort((a, b) => a - b);
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: running ? COL.amber : "#6b6b73" }}>
        <Timer size={13} /> {running || sec > 0 ? `${mm}:${ss}` : "Rest"}
      </div>
      {options.map((s) => (
        <button key={s} onClick={() => start(s)} className="rounded-lg px-2 py-1 text-xs font-semibold"
          style={s === suggest ? { background: COL.amberDim, color: "#000", border: `1px solid ${COL.amber}` } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{s}s</button>
      ))}
      {(running || sec > 0) && (
        <button onClick={() => { setRunning(false); setSec(0); }} className="rounded-lg px-2 py-1 text-xs" style={{ background: COL.inp, color: "#6b6b73" }}><RotateCcw size={12} /></button>
      )}
    </div>
  );
}

function ExerciseCard({ e, initial, last, onPersist, restSec = 90 }) {
  const [sets, setSets] = useState(initial);
  const allDone = sets.length > 0 && sets.every((s) => s.done);
  const doneCount = sets.filter((s) => s.done).length;

  const commit = (next) => { setSets(next); onPersist(next); };
  const setField = (i, field, val) => setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  const blurPersist = () => onPersist(sets);
  const toggleSet = (i) => commit(sets.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)));
  const toggleAll = () => commit(sets.map((s) => ({ ...s, done: !allDone })));
  const addSet = () => commit([...sets, { w: sets[sets.length - 1]?.w || "", reps: "", done: false }]);
  const removeSet = () => sets.length > 1 && commit(sets.slice(0, -1));

  return (
    <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${allDone ? COL.amberDim : COL.line}` }}>
      <div className="flex items-start gap-3">
        <button aria-label={allDone ? "Mark all sets not done" : "Mark all sets done"} onClick={toggleAll} className="mt-0.5 flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, borderRadius: 8, background: allDone ? COL.amber : COL.inp, border: `1px solid ${allDone ? COL.amber : COL.line}` }}>
          {allDone && <Check size={16} color="#000" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-white leading-tight">{e.name}</div>
            <span className="text-xs shrink-0" style={{ color: "#6b6b73" }}>{doneCount}/{sets.length} sets</span>
          </div>
          <div className="text-xs" style={{ color: COL.amber }}>{e.muscle} · {e.sets}</div>
          {e.cue && <div className="text-sm mt-1" style={{ color: "#8a8a93" }}>{e.cue}</div>}
          {last && last.weight ? <div className="text-xs mt-1" style={{ color: COL.amber }}>last best: {last.weight} kg — beat it</div> : null}
          <ExerciseMedia name={e.name} query={e.search || exSearch(e.id, e.name)} fallbackHref={demoUrl(e.name)} />

          {/* per-set grid */}
          <div className="mt-3 space-y-1.5">
            <div className="grid items-center gap-2 text-xs" style={{ gridTemplateColumns: "22px 1fr 1fr 30px", color: "#6b6b73" }}>
              <span>#</span><span>Weight (kg)</span><span>Reps</span><span></span>
            </div>
            {sets.map((s, i) => (
              <div key={i} className="grid items-center gap-2" style={{ gridTemplateColumns: "22px 1fr 1fr 30px" }}>
                <span className="text-xs" style={{ color: "#6b6b73" }}>{i + 1}</span>
                <input value={s.w} onChange={(ev) => setField(i, "w", ev.target.value)} onBlur={blurPersist} inputMode="decimal" placeholder="kg"
                  className="rounded-lg px-2 py-1.5 text-sm text-white outline-none w-full" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
                <input value={s.reps} onChange={(ev) => setField(i, "reps", ev.target.value)} onBlur={blurPersist} inputMode="numeric" placeholder="reps"
                  className="rounded-lg px-2 py-1.5 text-sm text-white outline-none w-full" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
                <button aria-label={`Set ${i + 1} ${s.done ? "done" : "not done"}`} onClick={() => toggleSet(i)} className="flex items-center justify-center"
                  style={{ width: 28, height: 28, borderRadius: 7, background: s.done ? COL.amber : COL.inp, border: `1px solid ${s.done ? COL.amber : COL.line}` }}>
                  {s.done && <Check size={14} color="#000" strokeWidth={3} />}
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={addSet} className="rounded-lg px-2 py-1 text-xs font-semibold flex items-center gap-1" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}><Plus size={11} /> Set</button>
              {sets.length > 1 && <button onClick={removeSet} className="rounded-lg px-2 py-1 text-xs font-semibold flex items-center gap-1" style={{ background: COL.inp, color: "#6b6b73" }}><Minus size={11} /> Set</button>}
            </div>
          </div>

          <RestTimer suggest={restSec} />
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
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [recipeFood, setRecipeFood] = useState(null);
  const [syncErr, setSyncErr] = useState(false);
  const [dietQuery, setDietQuery] = useState("");
  const [showScan, setShowScan] = useState(false);
  const [showMeal, setShowMeal] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [analysis, setAnalysis] = useState({ busy: false, text: null });
  const [coach, setCoach] = useState(null); // null | { starter }
  const [showTour, setShowTour] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [achToast, setAchToast] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [recent, setRecent] = useState([]);
  const [dayDate, setDayDate] = useState(null);
  const lastSave = useRef(Promise.resolve());

  const startDate = profile ? new Date(profile.startDate + "T00:00:00") : new Date();
  const sched = getSchedule(startDate, selDate, daysBetween, { prepWeeks: prepWeeksFor(profile?.experience), workoutDays: profile?.workoutDays });
  const key = dateKey(selDate);
  const isToday = key === dateKey(new Date());

  useEffect(() => setMounted(true), []);

  /* ---- surface save failures ---- */
  useEffect(() => {
    setSyncListener((s) => setSyncErr(!s.ok));
    return () => setSyncListener(null);
  }, []);

  /* ---- show the walkthrough once, after the profile exists ---- */
  useEffect(() => {
    if (profile && typeof window !== "undefined") {
      try { if (!localStorage.getItem(TOUR_KEY)) setShowTour(true); } catch (e) {}
    }
  }, [profile]);

  /* ---- auth session ---- */
  useEffect(() => {
    if (!isConfigured) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "PASSWORD_RECOVERY") setRecovery(true); setSession(s); });
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);

  /* ---- load all data when signed in ---- */
  useEffect(() => {
    CURRENT_USER = session?.user?.id || null;
    if (!session) { setProfile(null); setDataLoading(false); return; }
    setDataLoading(true);
    (async () => {
      const core = await sGetMany(["prime-profile", "prime-weights", "prime-lifts", "prime-complete", "prime-achievements", "prime-recent"]);
      const p = core["prime-profile"];
      if (p) {
        setProfile(p);
        setWeights(core["prime-weights"] || []);
        setLifts(core["prime-lifts"] || {});
        setComplete(core["prime-complete"] || []);
        setAchievements(core["prime-achievements"] || []);
        setRecent(core["prime-recent"] || []);
        loadPhotos();
        loadHistory();
      } else {
        setProfile(null);
      }
      setDataLoading(false);
    })();
  }, [session]);

  /* ---- day history (for the adaptive engine) ---- */
  async function loadHistory() {
    const rows = await sGetPrefix("prime-day-");
    const days = rows.map((r) => ({ date: r.key.replace("prime-day-", ""), ...(r.value || {}) }));
    setHistory(days);
  }

  /* ---- load selected day (race-guarded; tracks which date `day` belongs to) ---- */
  useEffect(() => {
    if (!session || !profile) return;
    let active = true;
    const k = key;
    (async () => {
      const d = await sGet("prime-day-" + k);
      if (!active) return; // a newer date was selected before this resolved
      setDay({ ...blankDay(), ...(d || {}) });
      setDayDate(k);
    })();
    return () => { active = false; };
  }, [key, session, profile]);

  const latestWeight = weights.length ? weights[weights.length - 1].weight : (profile ? profile.startWeight : 0);
  // adaptive maintenance from real intake vs weight trend
  const adaptive = profile ? computeAdaptive(weights, history) : { ready: false, maintenance: 0, trend: { slopePerWeek: 0 }, intake: { avg: 0, days: 0 } };
  const useAdaptive = profile && profile.adaptive !== false && adaptive.ready;
  const T = profile
    ? targets(profile, latestWeight, useAdaptive ? { maintenance: adaptive.maintenance } : {})
    : { calories: 0, protein: 0, carbs: 0, fat: 0, tdee: 0, bmr: 0, adaptive: false };
  const consumed = sumLog(day.food);
  const STEPG = profile ? goalPlan(profile.goal).stepGoal : STEP_GOAL;

  /* ---- completion / scoring ----
     A day "counts" at 70% of the day-score, so training OR solid nutrition
     earns credit (strict all-sets-done + 90% protein starved the streak). */
  const dayScore = useCallback((dayObj) => {
    if (!dayObj) return 0;
    const cons = sumLog(dayObj.food);
    let pts = 0, max = 0;
    max += 4; pts += Math.min(1, T.protein ? cons.protein / T.protein : 0) * 4;
    if (sched.workoutKey) {
      max += 2;
      const list = WORKOUTS[sched.workoutKey].ex;
      const doneCount = list.filter((e) => dayObj.ex?.[e.id]?.done).length;
      pts += (doneCount / list.length) * 2;
    }
    max += 1; if ((dayObj.steps || 0) >= STEPG) pts += 1;
    max += 1; if ((dayObj.water || 0) >= WATER_GOAL) pts += 1;
    const sl = parseFloat(dayObj.sleep); max += 1; if (!isNaN(sl) && sl >= 7) pts += 1;
    return max > 0 ? pts / max : 0;
  }, [sched.workoutKey, T.protein, STEPG]);

  const isDayComplete = useCallback((dayObj) => dayScore(dayObj) >= 0.7, [dayScore]);

  const syncComplete = useCallback((dayObj) => {
    const done = isDayComplete(dayObj);
    setComplete((prev) => {
      const has = prev.includes(key);
      let next = prev;
      if (done && !has) next = [...prev, key];
      else if (!done && has) next = prev.filter((k) => k !== key);
      if (next !== prev) sSet("prime-complete", next);
      return next;
    });
  }, [key, isDayComplete]);

  const saveDay = useCallback((next) => {
    setDay(next);
    sSet("prime-day-" + key, next);
    syncComplete(next);
    setHistory((prev) => {
      const rest = prev.filter((d) => d.date !== key);
      return [...rest, { date: key, ...next }];
    });
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

  const liftKey = (id) => id + ":" + (profile?.equipment || "gym");
  const updateEx = (e, sets) => {
    const allDone = sets.length > 0 && sets.every((s) => s.done);
    const topDone = sets.filter((s) => s.done && parseFloat(s.w)).map((s) => parseFloat(s.w));
    const best = topDone.length ? Math.max(...topDone) : "";
    saveDay({ ...day, ex: { ...day.ex, [e.id]: { sets, done: allDone, weight: best } } });
    if (best) {
      const lk = liftKey(e.id);
      setLifts((prev) => {
        const ex = prev[lk];
        if (!ex || ex.date <= key || (parseFloat(ex.weight) || 0) < best) {
          const next = { ...prev, [lk]: { weight: best, date: key } };
          sSet("prime-lifts", next);
          return next;
        }
        return prev;
      });
    }
  };

  /* ---- food log ---- */
  const addFood = (f, slot) => {
    const item = { fid: f.id || null, name: f.name, kcal: f.kcal || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0, qty: 1, slot: slot || f.meal || "snack" };
    saveDay({ ...day, food: [...(day.food || []), item] });
    setRecent((prev) => {
      const snap = { name: item.name, kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat, meal: item.slot };
      const next = [snap, ...prev.filter((r) => r.name !== snap.name)].slice(0, 10);
      sSet("prime-recent", next);
      return next;
    });
  };
  const logPlanItems = (planItems) => {
    const add = planItems.map((f) => ({ fid: f.id, name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, qty: f.qty || 1, slot: f.slot || f.meal || "snack" }));
    saveDay({ ...day, food: [...(day.food || []), ...add] });
  };
  const removeFood = (idx) => saveDay({ ...day, food: day.food.filter((_, i) => i !== idx) });
  const setFoodQty = (idx, delta) => {
    const arr = day.food.map((it, i) => i === idx ? { ...it, qty: Math.max(1, (it.qty || 1) + delta) } : it);
    saveDay({ ...day, food: arr });
  };

  /* ---- profile editing ---- */
  const updateProfile = (patch) => { const p = { ...profile, ...patch }; setProfile(p); lastSave.current = sSet("prime-profile", p); };

  // Save & apply: flush the focused field, wait for the write, THEN reload —
  // so the last edit can't be lost to the page unload.
  const saveAndApply = async () => {
    try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 60)); // let the blur's onUpdate fire
    try { await lastSave.current; } catch (e) {}
    try { window.location.reload(); } catch (e) {}
  };

  /* ---- export all my data (no lock-in) ---- */
  const exportData = async () => {
    try {
      const { data } = await supabase.from("user_data").select("key,value");
      const blob = new Blob([JSON.stringify({ app: "PRIME Tracker", exportedAt: new Date().toISOString(), data: data || [] }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "prime-tracker-data.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {}
  };

  /* ---- share ---- */
  const shareStreak = async () => {
    const text = `I'm on a ${streak}-day streak on PRIME Tracker 💪 building my prime physique.`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try { if (navigator.share) { await navigator.share({ title: "PRIME Tracker", text, url }); return; } } catch (e) { return; }
    try { window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank"); } catch (e) {}
  };

  const analyzeProgress = async () => {
    setAnalysis({ busy: true, text: null });
    try {
      const imgs = photos.slice().reverse().slice(0, 2).map((p) => p.url).filter(Boolean);
      const r = await fetch("/api/progress-analysis", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ context: coachContext, images: imgs }),
      });
      const j = await r.json();
      setAnalysis({ busy: false, text: j.analysis || j.error || "Couldn't analyze right now." });
    } catch (e) { setAnalysis({ busy: false, text: "Couldn't reach the analyzer — check your connection." }); }
  };

  /* ---- photos (Supabase Storage) ---- */
  async function loadPhotos() {
    const meta = (await sGet("prime-photos")) || [];
    const withUrls = await Promise.all(meta.map(async (m) => {
      try {
        const { data } = await supabase.storage.from("progress").createSignedUrl(m.path, PHOTO_URL_TTL);
        return { ...m, url: data?.signedUrl || null };
      } catch (e) { return { ...m, url: null }; }
    }));
    setPhotos(withUrls);
  }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState(null);
  async function uploadPhoto(file) {
    if (!file || !CURRENT_USER) return;
    setPhotoBusy(true); setPhotoErr(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${CURRENT_USER}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("progress").upload(path, file, { upsert: false, contentType: file.type });
      if (error) { setPhotoErr("Upload failed. Make sure the 'progress' storage bucket exists (see README)."); setPhotoBusy(false); return; }
      const meta = (await sGet("prime-photos")) || [];
      const next = [...meta, { path, date: dateKey(new Date()), week: Math.max(1, sched.week || 1) }];
      await sSet("prime-photos", next);
      await loadPhotos();
    } catch (e) { setPhotoErr("Upload failed. Check your connection and bucket setup."); }
    setPhotoBusy(false);
  }
  async function deletePhoto(p) {
    try { await supabase.storage.from("progress").remove([p.path]); } catch (e) {}
    const meta = (await sGet("prime-photos")) || [];
    const next = meta.filter((m) => m.path !== p.path);
    await sSet("prime-photos", next);
    await loadPhotos();
  }

  /* ---- derived ---- */
  const streak = (() => {
    const set = new Set(complete);
    let count = 0; let cursor = new Date();
    if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1);
    while (set.has(dateKey(cursor))) { count++; cursor = addDays(cursor, -1); }
    return count;
  })();

  const score = Math.round(dayScore(day) * 100);

  /* ---- achievements + reminders ---- */
  const towardKg = profile ? (profile.goalWeight <= profile.startWeight ? profile.startWeight - latestWeight : latestWeight - profile.startWeight) : 0;
  const goalHit = profile ? (profile.goalWeight <= profile.startWeight ? latestWeight <= profile.goalWeight : latestWeight >= profile.goalWeight) : false;
  const achStats = {
    streak, daysDone: complete.length,
    prepDone: !!(profile && prepWeeksFor(profile.experience) > 0 && !sched.prep && !sched.beforeStart && sched.week >= 1),
    proteinHit: T.protein ? consumed.protein >= T.protein : false,
    stepsHit: day.steps >= STEPG, towardKg, goalHit,
  };
  useEffect(() => {
    if (!profile) return;
    const unlocked = evalAchievements(achStats);
    const fresh = unlocked.filter((id) => !achievements.includes(id));
    if (fresh.length) {
      const next = Array.from(new Set([...achievements, ...unlocked]));
      setAchievements(next); sSet("prime-achievements", next);
      fresh.forEach((id) => { const m = achMeta(id); if (m) notify("🏆 " + m.title, m.desc); });
      if (fresh.length === 1) { const m = achMeta(fresh[0]); setAchToast({ title: m.title, desc: m.desc }); }
      else setAchToast({ title: `${fresh.length} achievements unlocked!`, desc: fresh.map((id) => achMeta(id)?.title).filter(Boolean).join(", ") });
      setTimeout(() => setAchToast(null), 6000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achStats.streak, achStats.daysDone, achStats.prepDone, achStats.proteinHit, achStats.stepsHit, achStats.towardKg, achStats.goalHit]);

  useEffect(() => {
    if (!profile?.reminders?.enabled) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const parts = (profile.reminders.time || "19:00").split(":").map((n) => parseInt(n));
    const now = new Date(); const target = new Date(); target.setHours(parts[0] || 19, parts[1] || 0, 0, 0);
    if (target <= now) return;
    const t = setTimeout(() => notify("PRIME reminder", "Time to train and log your day 💪"), target - now);
    return () => clearTimeout(t);
  }, [profile?.reminders?.enabled, profile && profile.reminders && profile.reminders.time]);

  /* ---- gates ---- */
  if (!isConfigured) return <ConfigScreen />;
  if (authLoading) return <Spinner />;
  if (recovery) return <RecoveryScreen onDone={() => setRecovery(false)} />;
  if (!session) return <AuthScreen />;
  if (dataLoading) return <Spinner />;
  if (!profile) {
    return <Onboarding onDone={async (p) => { await sSet("prime-profile", p); setProfile(p); }} />;
  }

  const dayNum = sched.beforeStart ? 0 : sched.dss + 1;
  const region = profile.region || "any";
  const diet = profile.diet || "both";
  const cuisine = cuisineFor(profile.country);
  const plan = buildPlan(cuisine, region, diet);
  const gp = goalPlan(profile.goal);

  const coachContext = [
    `Name: ${profile.name || "(none)"}; sex ${profile.sex}; age ${profile.age}; height ${profile.heightCm}cm.`,
    `Goal: ${(GOALS[profile.goal] || {}).label}. Diet: ${diet}. Country: ${(COUNTRIES[profile.country] || {}).label || profile.country || "—"}${countryHasRegions(profile.country) ? ` (${region} Indian)` : ""}; cuisine ${cuisine}.`,
    `Current weight ${latestWeight}kg, goal ${profile.goalWeight}kg, BMI ${bmi(latestWeight, profile.heightCm)}.`,
    `Daily targets: ${T.calories} kcal, ${T.protein}g protein, ${T.carbs}g carbs, ${T.fat}g fat${T.adaptive ? " (adaptive/measured)" : " (formula)"}; maintenance≈${T.tdee}.`,
    useAdaptive
      ? `Weight trend ${adaptive.trend.slopePerWeek >= 0 ? "+" : ""}${adaptive.trend.slopePerWeek.toFixed(2)} kg/wk over ${adaptive.intake.days} logged days; avg intake ${adaptive.intake.avg} kcal.`
      : `Not enough data for adaptive targets yet (${adaptive.intake.days} logged days).`,
    `Today so far: ${Math.round(consumed.kcal)} kcal, ${Math.round(consumed.protein)}g protein. Streak ${streak} days. Program week ${Math.max(0, sched.week)}/${TOTAL_WEEKS}.`,
  ].join(" ");

  /* ============================ NUTRITION CARD ============================ */
  const NutritionCard = (
    <div className="rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
      <div className="flex items-center gap-5">
        <Ring pct={T.calories ? (consumed.kcal / T.calories) * 100 : 0}>
          <div className="text-xl font-extrabold text-white">{Math.round(consumed.kcal)}</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>/ {T.calories}</div>
        </Ring>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Calories today</Label>
            <span className="text-xs" style={{ color: COL.amber }}>{Math.max(0, T.calories - Math.round(consumed.kcal))} left</span>
          </div>
          <MacroBar name="Protein" value={consumed.protein} target={T.protein} color="#8be0a4" />
          <MacroBar name="Carbs" value={consumed.carbs} target={T.carbs} color="#5aa9e6" />
          <MacroBar name="Fat" value={consumed.fat} target={T.fat} color="#f5b301" />
        </div>
      </div>
    </div>
  );

  const AdaptiveCard = useAdaptive ? (
    <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.amberDim}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Activity size={15} style={{ color: COL.amber }} />
        <span className="font-bold text-white text-sm">Adaptive target is on</span>
      </div>
      <div className="text-sm" style={{ color: "#9a9aa3" }}>
        Measured from your last {adaptive.intake.days} logged days: your real maintenance is ≈ <span style={{ color: COL.amber }}>{adaptive.maintenance} kcal</span>
        {" "}(weight trend {adaptive.trend.slopePerWeek >= 0 ? "+" : ""}{adaptive.trend.slopePerWeek.toFixed(2)} kg/wk). Your daily goal auto-adjusts to keep you on pace.
      </div>
    </div>
  ) : null;

  /* ============================ TODAY ============================ */
  const TodayView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Ring pct={score}>
          <div className="text-2xl font-extrabold text-white">{score}%</div>
          <div className="text-xs" style={{ color: "#6b6b73" }}>day</div>
        </Ring>
        <div className="flex-1">
          <Label>{sched.beforeStart ? "Starts soon" : `Day ${dayNum} · ${sched.weekLabel}`}</Label>
          <div className="mt-1 text-xl font-bold text-white">
            {score >= 100 ? "Locked in." : score >= 60 ? "Strong work." : score > 0 ? "Keep going." : "Let's begin."}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: COL.amber }}>
            <Flame size={16} /><span className="font-bold">{streak}-day streak</span>
          </div>
        </div>
      </div>

      {NutritionCard}
      {AdaptiveCard}

      <button onClick={() => setCoach({ starter: "Give me a short weekly check-in: am I on track for my goal, and what 1–2 things should I adjust this week?" })}
        className="w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(245,179,1,.12), rgba(245,179,1,.02))", border: `1px solid ${COL.amberDim}` }}>
        <Sparkles size={20} style={{ color: COL.amber }} />
        <div className="flex-1">
          <div className="font-bold text-white">Ask PRIME Coach</div>
          <div className="text-sm" style={{ color: "#9a9aa3" }}>Weekly check-in, meal ideas, plateau help — tailored to your data.</div>
        </div>
        <ChevronRight size={18} style={{ color: "#6b6b73" }} />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Footprints size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Steps</span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">{day.steps.toLocaleString()}</div>
          <div className="text-xs mb-2" style={{ color: "#6b6b73" }}>goal {STEPG.toLocaleString()}</div>
          <Bar pct={(day.steps / STEPG) * 100} />
          <div className="mt-3 flex gap-2">
            {[1000, 2000].map((n) => (
              <button key={n} onClick={() => setSteps(day.steps + n)} className="flex-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: COL.inp, color: "#cfcfd6" }}>+{n}</button>
            ))}
            <button onClick={() => setSteps(0)} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: COL.inp, color: "#6b6b73" }}>0</button>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#cfcfd6" }}>
            <Droplets size={16} style={{ color: COL.amber }} /><span className="text-sm font-semibold">Water</span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-2">{day.water}<span className="text-base" style={{ color: "#6b6b73" }}>/{WATER_GOAL}</span></div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <button key={i} aria-label={`Set water to ${i + 1} glasses`} onClick={() => setWater(i + 1 === day.water ? i : i + 1)}
                style={{ width: 18, height: 24, borderRadius: 4, background: i < day.water ? COL.amber : COL.inp, border: `1px solid ${COL.line}` }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button aria-label="Remove a glass of water" onClick={() => setWater(day.water - 1)} className="flex-1 rounded-lg py-1.5 flex justify-center" style={{ background: COL.inp, color: "#cfcfd6" }}><Minus size={14} /></button>
            <button aria-label="Add a glass of water" onClick={() => setWater(day.water + 1)} className="flex-1 rounded-lg py-1.5 flex justify-center" style={{ background: COL.inp, color: "#cfcfd6" }}><Plus size={14} /></button>
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
            {WORKOUTS[sched.workoutKey].ex.filter((e) => day.ex?.[e.id]?.done).length}/{WORKOUTS[sched.workoutKey].ex.length} exercises done · tap for videos
          </div>
        ) : (
          <div className="mt-2 text-sm" style={{ color: "#8a8a93" }}>Easy walk, mobility, hit your step goal. Recovery is where you grow.</div>
        )}
      </button>

      <button onClick={() => setTab("diet")} className="w-full text-left rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={18} style={{ color: COL.amber }} />
            <span className="font-bold text-white">Diet & Recipes</span>
          </div>
          <ChevronRight size={18} style={{ color: "#6b6b73" }} />
        </div>
        <div className="mt-2 text-sm" style={{ color: "#8a8a93" }}>
          {(day.food || []).length} items logged · {Math.round(consumed.kcal)} / {T.calories} kcal · tap to plan meals
        </div>
      </button>

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Notes</Label>
        <textarea value={day.notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did today feel? Energy, cravings, wins…"
          className="mt-2 w-full bg-transparent text-sm outline-none resize-none" style={{ color: "#e4e4e7" }} />
      </div>
    </div>
  );

  /* ============================ WORKOUT ============================ */
  const WorkoutView = (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>{sched.prep ? sched.weekLabel : `${sched.weekLabel} · ${gp.focus}`}</Label>
        <div className="mt-1 text-2xl font-extrabold text-white">{sched.workoutKey ? WORKOUTS[sched.workoutKey].label : "Rest Day"}</div>
        <div className="text-sm" style={{ color: COL.amber }}>{sched.workoutKey ? WORKOUTS[sched.workoutKey].tag : "Recovery"}</div>
        {sched.prep && (
          <div className="text-xs mt-2" style={{ color: "#9a9aa3" }}>
            Easy on purpose — light loads, full range, perfect technique. This primes your joints, tendons and movement patterns so the main program is safe and effective.
          </div>
        )}
        {sched.deload && (
          <div className="text-xs mt-2" style={{ color: "#9a9aa3" }}>
            <b style={{ color: COL.amber }}>Deload week.</b> One less set per exercise and lighter loads (~10–20%). Planned recovery so you come back stronger — don&apos;t skip it.
          </div>
        )}
      </div>

      {sched.workoutKey ? (
        <>
          {dayDate !== key ? (
            <div className="rounded-2xl p-5 text-sm" style={{ background: COL.card, border: `1px solid ${COL.line}`, color: "#8a8a93" }}>Loading your sets…</div>
          ) : (
          <div className="space-y-3">
            {WORKOUTS[sched.workoutKey].ex.map((base) => {
              const e = resolveExercise(base, profile.equipment);
              return (
                <ExerciseCard
                  key={e.id + "-" + key}
                  e={e}
                  initial={ensureSets(e, day.ex?.[e.id], sched.prep ? 0 : (sched.deload ? -1 : gp.extraSets))}
                  last={lifts[liftKey(e.id)]}
                  onPersist={(sets) => updateEx(e, sets)}
                  restSec={sched.prep ? 60 : gp.restSec}
                />
              );
            })}
          </div>
          )}

          <div className="rounded-2xl p-4 space-y-2" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
            <div className="flex items-center gap-2 text-white font-semibold"><Activity size={16} style={{ color: COL.amber }} />{sched.prep ? "Foundation guidance" : `Conditioning · ${gp.focus}`}</div>
            <ul className="text-sm space-y-1" style={{ color: "#8a8a93" }}>
              {sched.prep ? (
                <>
                  <li>• Keep effort at ~5–6/10 (RPE) — you should finish each set feeling you had several reps left.</li>
                  <li>• Add 10–20 min easy Zone-2 cardio (walk/cycle) after the session.</li>
                  <li>• Some soreness is normal; sharp pain is not. Prioritise sleep, protein and water.</li>
                </>
              ) : (
                gp.conditioning.map((c, i) => <li key={i}>• {c}</li>)
              )}
              <li>• Step target today: <span style={{ color: COL.amber }}>{STEPG.toLocaleString()}</span></li>
            </ul>
          </div>

          <div className="rounded-2xl p-4 space-y-2" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
            <div className="flex items-center gap-2 text-white font-semibold"><Info size={16} style={{ color: COL.amber }} />Coach notes</div>
            <ul className="text-sm space-y-1" style={{ color: "#8a8a93" }}>
              <li>• Warm up: 5 min easy cardio + 1–2 light sets before your first lift.</li>
              <li>• Tap <span style={{ color: COL.amber }}>Watch demo</span> on any exercise for a form video.</li>
              <li>• Progressive overload: hit the top of the rep range with good form, then add weight.</li>
              {sched.week >= 9 && <li>• You&apos;re strong enough now — start shifting toward barbell squats and deadlifts.</li>}
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

  /* ============================ DIET ============================ */
  const DietView = (
    <div className="space-y-4">
      {NutritionCard}

      {recent.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <Label>Quick log · recent</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((r, i) => (
              <button key={i} onClick={() => addFood(r, r.meal)} className="rounded-full px-3 py-1.5 text-xs flex items-center gap-1" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                <Plus size={11} style={{ color: COL.amber }} /> {r.name.length > 24 ? r.name.slice(0, 24) + "…" : r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between">
          <Label>Cuisine & diet</Label>
          <span className="text-xs" style={{ color: "#6b6b73" }}>changes your plan</span>
        </div>
        {countryHasRegions(profile.country) && (
          <div className="mt-2"><Pills cols={2} options={[["north", "North Indian"], ["south", "South Indian"]]} value={region} onChange={(v) => updateProfile({ region: v })} /></div>
        )}
        <div className="mt-2"><Pills options={[["veg", "Veg"], ["nonveg", "Non-veg"], ["both", "Both"]]} value={diet} onChange={(v) => updateProfile({ diet: v })} /></div>
      </div>

      {/* auto-composed plan that targets your calories */}
      {(() => {
        const auto = composePlan(cuisine, region, diet, T.calories, T.protein);
        const pctK = T.calories ? Math.round((auto.totals.kcal / T.calories) * 100) : 0;
        return (
          <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.amberDim}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><Target size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">Today&apos;s suggested plan</span></div>
              <button onClick={() => logPlanItems(auto.items)} className="rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1" style={{ background: COL.amber, color: "#000" }}><Plus size={12} /> Log all</button>
            </div>
            <div className="text-xs mb-2" style={{ color: "#8a8a93" }}>
              {Math.round(auto.totals.kcal)} kcal ({pctK}% of {T.calories}) · {Math.round(auto.totals.protein)}g protein
            </div>
            <div className="space-y-1.5">
              {auto.items.map((f) => (
                <button key={f.slot} onClick={() => setRecipeFood(f)} className="w-full text-left flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                  <span className="text-sm text-white truncate">{MEAL_LABEL[f.slot]}: {f.name}{f.qty > 1 ? ` ×${f.qty}` : ""}</span>
                  <span className="text-xs shrink-0" style={{ color: "#6b6b73" }}>{f.kcal * f.qty} kcal</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* fill what's left of today's target */}
      {(() => {
        const leftK = Math.round(T.calories - consumed.kcal);
        const leftP = Math.round(T.protein - consumed.protein);
        if (consumed.kcal <= 0 || leftK < 200) return null;
        const fill = fillRemaining(cuisine, region, diet, leftK, leftP);
        if (!fill.items.length) return null;
        return (
          <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><Plus size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">Fill remaining</span></div>
              <button onClick={() => logPlanItems(fill.items)} className="rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1" style={{ background: COL.amber, color: "#000" }}><Plus size={12} /> Log these</button>
            </div>
            <div className="text-xs mb-2" style={{ color: "#8a8a93" }}>{leftK} kcal &amp; {Math.max(0, leftP)}g protein left — these cover ~{Math.round(fill.totals.kcal)} kcal.</div>
            <div className="space-y-1.5">
              {fill.items.map((f, idx) => (
                <button key={idx} onClick={() => setRecipeFood(f)} className="w-full text-left flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                  <span className="text-sm text-white truncate">{f.name}</span>
                  <span className="text-xs shrink-0" style={{ color: "#6b6b73" }}>{f.kcal} kcal · {f.protein}g P</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* search any food */}
      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Search foods</Label>
        <input value={dietQuery} onChange={(e) => setDietQuery(e.target.value)} placeholder="e.g. paneer, banana, biryani…"
          className="mt-2 w-full rounded-xl px-3 py-2.5 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => setShowMeal(true)} className="rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}>
            <Sparkles size={15} /> Snap a meal
          </button>
          <button onClick={() => setShowScan(true)} className="rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}>
            <ScanLine size={15} /> Scan barcode
          </button>
        </div>
        {dietQuery.trim() && (
          <div className="mt-3 space-y-2">
            {searchFoods(dietQuery).length === 0 ? (
              <div className="text-sm" style={{ color: "#8a8a93" }}>No match. Try the custom-food add below.</div>
            ) : searchFoods(dietQuery).map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                <button onClick={() => setRecipeFood(f)} className="text-left flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{f.name}</div>
                  <div className="text-xs" style={{ color: "#6b6b73" }}>{f.kcal} kcal · {f.protein}g P · tap for recipe</div>
                </button>
                <button onClick={() => addFood(f, f.meal)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1" style={{ background: COL.amber, color: "#000" }}><Plus size={12} /> Log</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* logged foods */}
      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <Label>Today&apos;s food log</Label>
        {(day.food || []).length === 0 ? (
          <div className="text-sm mt-2" style={{ color: "#8a8a93" }}>Nothing logged yet. Tap “+ Log” on a meal below to track calories.</div>
        ) : (
          <div className="mt-2 space-y-2">
            {day.food.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{it.name}</div>
                  <div className="text-xs" style={{ color: "#6b6b73" }}>{Math.round(it.kcal * it.qty)} kcal · {Math.round(it.protein * it.qty)}g P</div>
                </div>
                <button onClick={() => setFoodQty(i, -1)} className="rounded-md px-2 py-1" style={{ background: COL.inp, color: "#cfcfd6" }}><Minus size={12} /></button>
                <span className="text-sm text-white w-5 text-center">{it.qty}</span>
                <button onClick={() => setFoodQty(i, 1)} className="rounded-md px-2 py-1" style={{ background: COL.inp, color: "#cfcfd6" }}><Plus size={12} /></button>
                <button onClick={() => removeFood(i)} className="rounded-md px-2 py-1" style={{ background: "#2a1414", color: "#ff8a8a" }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* suggested plan by slot */}
      {MEAL_ORDER.filter((slot) => plan[slot]).map((slot) => (
        <div key={slot} className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed size={16} style={{ color: COL.amber }} />
            <span className="font-bold text-white">{MEAL_LABEL[slot]}</span>
          </div>
          <div className="space-y-2">
            {plan[slot].map((f) => (
              <div key={f.id} className="rounded-xl p-3" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setRecipeFood(f)} className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {f.diet === "veg" ? <Leaf size={13} style={{ color: "#8be0a4" }} /> : <Beef size={13} style={{ color: "#ff8a8a" }} />}
                      <span className="font-semibold text-white">{f.name}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#8a8a93" }}>{f.kcal} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F</div>
                    <div className="text-xs mt-0.5" style={{ color: COL.amber }}>Tap for full recipe →</div>
                  </button>
                  <button onClick={() => addFood(f, slot)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                    style={{ background: COL.amber, color: "#000" }}><Plus size={12} /> Log</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <QuickAdd onAdd={(f) => addFood(f, "snack")} />

      <button onClick={() => setShowCommunity(true)} className="w-full rounded-2xl p-4 flex items-center justify-between" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center gap-2"><Users size={18} style={{ color: COL.amber }} /><span className="font-bold text-white">Community recipes</span></div>
        <ChevronRight size={18} style={{ color: "#6b6b73" }} />
      </button>
    </div>
  );

  /* ============================ PROGRESS ============================ */
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
  const myBmi = bmi(latestWeight, profile.heightCm);
  const band = bmiBand(myBmi);

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
        <div className="mt-3 text-xs" style={{ color: "#6b6b73" }}>BMI {myBmi || "—"} · <span style={{ color: band.color }}>{band.label}</span></div>
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
                <Tooltip contentStyle={{ background: COL.inp, border: `1px solid ${COL.line}`, borderRadius: 12, color: "#fff" }} />
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

      {streak >= 1 && (
        <button onClick={shareStreak} className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 font-semibold" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
          <Share2 size={16} style={{ color: COL.amber }} /> Share my {streak}-day streak
        </button>
      )}

      {/* progress photos */}
      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Camera size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">Progress photos</span></div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" style={{ background: COL.amber, color: "#000" }}>
              <Camera size={12} /> {photoBusy ? "…" : "Camera"}
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={photoBusy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
            </label>
            <label className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}>
              <Upload size={12} /> {photoBusy ? "…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" disabled={photoBusy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
            </label>
          </div>
        </div>
        {photoErr && <div className="text-xs mb-2 rounded-lg px-3 py-2" style={{ background: "#2a1414", color: "#ff8a8a" }}>{photoErr}</div>}
        {photos.length === 0 ? (
          <div className="text-sm" style={{ color: "#8a8a93" }}>Add a front + side photo every 2 weeks. The scale lies on bad days — photos show the real change.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.slice().reverse().map((p) => (
              <div key={p.path} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4", background: COL.inp }}>
                {p.url ? <img src={p.url} alt={p.date} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="flex items-center justify-center h-full text-xs" style={{ color: "#6b6b73" }}>…</div>}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-xs" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>Wk {p.week}</div>
                <button aria-label="Delete photo" onClick={() => deletePhoto(p)} className="absolute top-1 right-1 rounded-md p-1" style={{ background: "rgba(0,0,0,0.6)", color: "#ff8a8a" }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {photos.length >= 1 && (
        <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 mb-2"><Sparkles size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">AI progress analysis</span></div>
          <button onClick={analyzeProgress} disabled={analysis.busy} className="w-full rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2" style={{ background: COL.amber, color: "#000", opacity: analysis.busy ? 0.6 : 1 }}>
            <Sparkles size={15} /> {analysis.busy ? "Analyzing your photos…" : "Analyze my progress"}
          </button>
          {analysis.text && (
            <div className="mt-2 rounded-xl p-3 text-sm whitespace-pre-wrap" style={{ background: COL.inp, border: `1px solid ${COL.line}`, color: "#cfcfd6", lineHeight: 1.55 }}>{analysis.text}</div>
          )}
          <div className="text-xs mt-2" style={{ color: "#6b6b73" }}>Uses your latest photos + weight trend. Photos are sent securely for this analysis only.</div>
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Trophy size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">Achievements</span></div>
          <span className="text-xs" style={{ color: "#6b6b73" }}>{achievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = achievements.includes(a.id);
            return (
              <div key={a.id} className="rounded-xl p-3 flex items-center gap-2" style={{ background: got ? "rgba(245,179,1,.10)" : COL.inp, border: `1px solid ${got ? COL.amberDim : COL.line}`, opacity: got ? 1 : 0.6 }}>
                <Trophy size={16} style={{ color: got ? COL.amber : "#4a4a52", flexShrink: 0 }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: got ? "#fff" : "#8a8a93" }}>{a.title}</div>
                  <div className="text-xs truncate" style={{ color: "#6b6b73" }}>{a.desc}</div>
                </div>
              </div>
            );
          })}
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
                style={{ aspectRatio: "1", borderRadius: 8, background: done ? COL.amber : COL.inp, border: isT ? `2px solid ${COL.amber}` : `1px solid ${COL.line}`, color: done ? "#000" : "#6b6b73", fontSize: 11, fontWeight: 700 }}>
                {c.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "today", label: "Today", icon: Home },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "diet", label: "Diet", icon: UtensilsCrossed },
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
            <div className="flex items-center gap-3">
              <button onClick={() => setCoach({ starter: null })} style={{ color: COL.amber }} aria-label="AI coach"><Sparkles size={20} /></button>
              <button onClick={() => setShowSettings(true)} style={{ color: "#8a8a93" }} aria-label="Settings"><Settings size={20} /></button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button aria-label="Previous day" onClick={() => setSelDate(addDays(selDate, -1))} className="p-2 rounded-lg" style={{ background: COL.card }}><ChevronLeft size={18} color="#cfcfd6" /></button>
            <button aria-label="Jump to today" onClick={() => setSelDate(new Date())} className="text-center">
              <div className="text-sm font-bold text-white">{isToday ? "Today" : prettyDate(selDate)}</div>
              <div className="text-xs" style={{ color: "#6b6b73" }}>{isToday ? prettyDate(selDate) : "tap for today"}</div>
            </button>
            <button aria-label="Next day" onClick={() => setSelDate(addDays(selDate, 1))} className="p-2 rounded-lg" style={{ background: COL.card }}><ChevronRight size={18} color="#cfcfd6" /></button>
          </div>
        </div>

        {syncErr && (
          <div className="px-4 pt-2">
            <div className="rounded-xl px-3 py-2 text-xs flex items-center justify-between" style={{ background: "#2a1414", color: "#ff8a8a", border: "1px solid #3a1a1a" }}>
              <span>Couldn&apos;t save your last change — check your connection.</span>
              <button onClick={() => setSyncErr(false)} style={{ color: "#ff8a8a" }}><X size={14} /></button>
            </div>
          </div>
        )}
        <div className="px-4 py-4" style={{ paddingBottom: 96 }}>
          {sched.beforeStart && (
            <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: COL.card, border: `1px solid ${COL.line}`, color: "#9a9aa3" }}>
              This day is before your start date. Your plan begins {prettyDate(startDate)}.
            </div>
          )}
          {tab === "today" && TodayView}
          {tab === "workout" && WorkoutView}
          {tab === "diet" && DietView}
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

      {/* recipe modal */}
      {recipeFood && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setRecipeFood(null)}>
          <div className="w-full p-5 rounded-t-3xl overflow-y-auto" style={{ maxWidth: 480, maxHeight: "85vh", background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <div className="text-xl font-extrabold text-white">{recipeFood.name}</div>
              <button aria-label="Close recipe" onClick={() => setRecipeFood(null)} style={{ color: "#8a8a93" }}><X size={22} /></button>
            </div>
            <div className="text-xs mb-3" style={{ color: "#8a8a93" }}>{recipeFood.serving}</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[["kcal", recipeFood.kcal, "kcal"], ["P", recipeFood.protein, "g"], ["C", recipeFood.carbs, "g"], ["F", recipeFood.fat, "g"]].map(([l, v, u]) => (
                <div key={l} className="rounded-xl p-2 text-center" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                  <div className="text-lg font-extrabold text-white">{v}</div>
                  <div className="text-xs" style={{ color: "#6b6b73" }}>{l === "kcal" ? "kcal" : l}{l !== "kcal" ? ` (${u})` : ""}</div>
                </div>
              ))}
            </div>
            <Label>Ingredients</Label>
            <ul className="mt-2 mb-4 space-y-1">
              {recipeFood.ingredients.map((ing, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: "#cfcfd6" }}><span style={{ color: COL.amber }}>•</span>{ing}</li>
              ))}
            </ul>
            <Label>Method</Label>
            <ol className="mt-2 mb-4 space-y-2">
              {recipeFood.recipe.map((stp, i) => (
                <li key={i} className="text-sm flex gap-3" style={{ color: "#cfcfd6" }}>
                  <span className="shrink-0 flex items-center justify-center font-bold" style={{ width: 22, height: 22, borderRadius: 6, background: COL.inp, color: COL.amber, fontSize: 12 }}>{i + 1}</span>
                  <span>{stp}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => { addFood(recipeFood, recipeFood.meal); setRecipeFood(null); setTab("diet"); }}
              className="w-full rounded-xl py-3 font-bold uppercase flex items-center justify-center gap-2" style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em" }}>
              <Plus size={16} /> Log this meal
            </button>
          </div>
        </div>
      )}

      {/* first-run walkthrough */}
      {showTour && <Tour profile={profile} onUpdate={updateProfile} onClose={() => setShowTour(false)} />}

      {/* community recipes */}
      {showCommunity && <CommunityModal profile={profile} onAdd={(f) => addFood(f, "snack")} onView={(f) => setRecipeFood(f)} onClose={() => setShowCommunity(false)} />}

      {/* AI meal photo */}
      {showMeal && <MealPhotoModal onAdd={(f) => addFood(f, "snack")} onClose={() => setShowMeal(false)} />}

      {/* barcode scanner */}
      {showScan && <BarcodeModal onAdd={(f) => addFood(f, "snack")} onClose={() => setShowScan(false)} />}

      {/* AI coach */}
      {coach && <CoachSheet context={coachContext} starter={coach.starter} onClose={() => setCoach(null)} />}

      {/* achievement toast */}
      {achToast && (
        <div className="fixed left-1/2 z-50" style={{ bottom: 90, transform: "translateX(-50%)", maxWidth: 440, width: "92%" }}>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: COL.card, border: `1px solid ${COL.amber}`, boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
            <Trophy size={22} style={{ color: COL.amber }} />
            <div><div className="text-white font-bold text-sm">Achievement unlocked</div><div className="text-xs" style={{ color: "#9a9aa3" }}>{achToast.title} — {achToast.desc}</div></div>
          </div>
        </div>
      )}

      {/* settings / profile sheet */}
      {showSettings && (
        <SettingsSheet
          profile={profile} session={session} startDate={startDate} dayNum={dayNum} targets={T}
          onClose={() => setShowSettings(false)}
          onReplayTour={() => { setShowSettings(false); setShowTour(true); }}
          onExport={exportData}
          onSaveApply={saveAndApply}
          onUpdate={updateProfile}
          onSignOut={async () => { setShowSettings(false); await supabase.auth.signOut(); }}
          onReset={async () => {
            if (confirm("Reset ALL your data and start over? This cannot be undone.")) {
              try {
                const meta = (await sGet("prime-photos")) || [];
                if (meta.length) await supabase.storage.from("progress").remove(meta.map((m) => m.path));
              } catch (e) {}
              await clearAll();
              setProfile(null); setWeights([]); setLifts({}); setComplete([]); setPhotos([]); setHistory([]); setAchievements([]); setRecent([]); setDay(blankDay()); setSelDate(new Date()); setTab("today"); setShowSettings(false);
            }
          }}
        />
      )}
    </div>
  );
}

/* ============================ COMMUNITY RECIPES ============================ */
function CommunityModal({ profile, onAdd, onView, onClose }) {
  const [tab, setTab] = useState("browse");
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "", region: profile.region || "any", diet: profile.diet || "veg", steps: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await supabase.from("shared_foods").select("*").order("created_at", { ascending: false }).limit(60);
      setItems(data || []);
    } catch (e) { setItems([]); }
  };
  useEffect(() => { load(); }, []);

  const publish = async () => {
    if (!form.name || !parseFloat(form.kcal)) { setMsg("Add at least a name and calories."); return; }
    setBusy(true); setMsg(null);
    try {
      const recipe = form.steps.split("\n").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("shared_foods").insert({
        author: CURRENT_USER, name: form.name.slice(0, 60),
        kcal: Math.round(parseFloat(form.kcal) || 0), protein: Math.round(parseFloat(form.protein) || 0),
        carbs: Math.round(parseFloat(form.carbs) || 0), fat: Math.round(parseFloat(form.fat) || 0),
        region: form.region, diet: form.diet, recipe,
      });
      if (error) { setMsg(error.message.includes("does not exist") ? "Run the latest schema.sql to enable Community." : error.message); setBusy(false); return; }
      setForm({ ...form, name: "", kcal: "", protein: "", carbs: "", fat: "", steps: "" });
      setTab("browse"); await load();
    } catch (e) { setMsg("Couldn't publish — try again."); }
    setBusy(false);
  };

  const list = (items || []).filter((f) => !q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ maxWidth: 480, height: "86vh", background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2"><Users size={18} style={{ color: COL.amber }} /><div className="text-lg font-bold text-white">Community recipes</div></div>
          <button aria-label="Close" onClick={onClose} style={{ color: "#8a8a93" }}><X size={20} /></button>
        </div>
        <div className="px-4 pt-3 flex gap-2">
          {[["browse", "Browse"], ["publish", "Publish"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="flex-1 rounded-xl py-2 text-sm font-bold" style={tab === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{l}</button>
          ))}
        </div>

        {tab === "browse" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shared recipes…" />
            {items === null ? (
              <div className="text-sm" style={{ color: "#8a8a93" }}>Loading…</div>
            ) : list.length === 0 ? (
              <div className="text-sm" style={{ color: "#8a8a93" }}>No recipes yet — be the first to publish one!</div>
            ) : list.map((f) => (
              <div key={f.id} className="rounded-xl p-3" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => onView({ ...f, serving: "1 serving", ingredients: [], recipe: f.recipe || [] })} className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{f.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#8a8a93" }}>{f.kcal} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F{f.region && f.region !== "any" ? ` · ${f.region}` : ""}</div>
                    {f.recipe && f.recipe.length ? <div className="text-xs mt-0.5" style={{ color: COL.amber }}>Tap for recipe →</div> : null}
                  </button>
                  <button onClick={() => onAdd(f)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1" style={{ background: COL.amber, color: "#000" }}><Plus size={12} /> Log</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Recipe name" />
            <div className="flex gap-2">
              <Input value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} inputMode="numeric" placeholder="kcal" />
              <Input value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} inputMode="numeric" placeholder="protein" />
            </div>
            <div className="flex gap-2">
              <Input value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} inputMode="numeric" placeholder="carbs" />
              <Input value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} inputMode="numeric" placeholder="fat" />
            </div>
            <Pills options={[["veg", "Veg"], ["nonveg", "Non-veg"]]} cols={2} value={form.diet} onChange={(v) => setForm({ ...form, diet: v })} />
            <textarea value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} rows={5} placeholder="Method — one step per line" className="w-full rounded-xl px-3 py-2.5 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
            {msg && <div className="text-xs" style={{ color: "#ff8a8a" }}>{msg}</div>}
            <button onClick={publish} disabled={busy} className="w-full rounded-xl py-3 font-bold uppercase" style={{ background: COL.amber, color: "#000", opacity: busy ? 0.6 : 1 }}>{busy ? "Publishing…" : "Publish to community"}</button>
            <div className="text-xs" style={{ color: "#6b6b73" }}>Shared publicly with other PRIME users. You can only edit/remove your own.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ AI MEAL PHOTO ============================ */
function MealPhotoModal({ onAdd, onClose }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [est, setEst] = useState(null);
  const [preview, setPreview] = useState(null);

  const pick = async (file) => {
    if (!file) return;
    setBusy(true); setMsg(null); setEst(null);
    try {
      const dataUrl = await fileToScaledDataURL(file);
      setPreview(dataUrl);
      const r = await fetch("/api/meal-photo", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ image: dataUrl }) });
      const j = await r.json();
      if (j.food) setEst(j.food); else setMsg(j.error || "Couldn't analyze this photo.");
    } catch (e) { setMsg("Couldn't process the photo — try another."); }
    setBusy(false);
  };
  const field = (k, label, w) => (
    <div style={{ width: w }}>
      <div className="text-xs mb-1" style={{ color: "#6b6b73" }}>{label}</div>
      <Input value={est[k]} onChange={(e) => setEst({ ...est, [k]: k === "name" ? e.target.value : (parseFloat(e.target.value) || 0) })} inputMode={k === "name" ? "text" : "numeric"} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div className="w-full p-5 rounded-t-3xl overflow-y-auto" style={{ maxWidth: 480, maxHeight: "88vh", background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Sparkles size={18} style={{ color: COL.amber }} /><div className="text-lg font-bold text-white">Snap a meal</div></div>
          <button aria-label="Close" onClick={onClose} style={{ color: "#8a8a93" }}><X size={20} /></button>
        </div>

        {preview && <img src={preview} alt="meal" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14, marginBottom: 10 }} />}

        {!est && (
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ background: COL.amber, color: "#000", opacity: busy ? 0.6 : 1 }}>
              <Camera size={16} /> {busy ? "…" : "Take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
            </label>
            <label className="rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}`, opacity: busy ? 0.6 : 1 }}>
              <Upload size={16} /> {busy ? "…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
            </label>
          </div>
        )}
        {msg && <div className="text-xs mt-2" style={{ color: "#ff8a8a" }}>{msg}</div>}

        {est && (
          <div className="mt-1">
            <div className="text-xs mb-2" style={{ color: "#8a8a93" }}>AI estimate — tweak if needed, then log it.</div>
            <div className="space-y-2">
              {field("name", "Meal", "100%")}
              <div className="flex gap-2">
                {field("kcal", "kcal", "25%")}{field("protein", "Protein (g)", "25%")}{field("carbs", "Carbs (g)", "25%")}{field("fat", "Fat (g)", "25%")}
              </div>
            </div>
            <button onClick={() => { onAdd(est); onClose(); }} className="mt-3 w-full rounded-xl py-3 font-bold flex items-center justify-center gap-2" style={{ background: COL.amber, color: "#000" }}><Plus size={16} /> Log this meal</button>
            <div className="text-xs mt-2" style={{ color: "#6b6b73" }}>Estimates are approximate — adjust portions to match what you ate.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ BARCODE SCANNER (OpenFoodFacts) ============================ */
function BarcodeModal({ onAdd, onClose }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const stop = () => {
    try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch (e) {}
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
    setScanning(false);
  };
  useEffect(() => () => stop(), []);

  const lookup = async (barcode) => {
    const bc = (barcode || code).trim();
    if (!bc) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(bc)}.json?fields=product_name,brands,nutriments`);
      const j = await r.json();
      if (j.status !== 1 || !j.product) { setMsg("Product not found. Add it as a custom food instead."); setBusy(false); return; }
      const n = j.product.nutriments || {};
      const kcal = Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0);
      if (!kcal) { setMsg("No calorie data for this product."); setBusy(false); return; }
      const brand = j.product.brands ? ` (${j.product.brands.split(",")[0]})` : "";
      const food = { name: `${j.product.product_name || "Food"}${brand} · 100g`, kcal, protein: Math.round(n["proteins_100g"] || 0), carbs: Math.round(n["carbohydrates_100g"] || 0), fat: Math.round(n["fat_100g"] || 0) };
      stop(); onAdd(food); onClose();
    } catch (e) { setMsg("Lookup failed — check your connection."); }
    setBusy(false);
  };

  const startScan = async () => {
    if (!("BarcodeDetector" in window)) { setMsg("Camera scanning isn't supported in this browser — type the barcode number below."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      const tick = async () => {
        try { const codes = await det.detect(videoRef.current); if (codes && codes.length) { lookup(codes[0].rawValue); return; } } catch (e) {}
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) { setMsg("Couldn't access the camera — type the barcode number below."); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => { stop(); onClose(); }}>
      <div className="w-full p-5 rounded-t-3xl" style={{ maxWidth: 480, background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><ScanLine size={18} style={{ color: COL.amber }} /><div className="text-lg font-bold text-white">Scan a barcode</div></div>
          <button aria-label="Close" onClick={() => { stop(); onClose(); }} style={{ color: "#8a8a93" }}><X size={20} /></button>
        </div>
        {scanning && (
          <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 14, marginBottom: 10, background: "#000", maxHeight: 240, objectFit: "cover" }} />
        )}
        {!scanning && (
          <button onClick={startScan} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mb-3" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}>
            <ScanLine size={16} /> Scan with camera
          </button>
        )}
        <Label>Or enter the barcode number</Label>
        <div className="mt-2 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="e.g. 8901234567890" />
          <button onClick={() => lookup()} disabled={busy} className="rounded-xl px-4 font-bold" style={{ background: COL.amber, color: "#000", opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Look up"}</button>
        </div>
        {msg && <div className="text-xs mt-2" style={{ color: "#ff8a8a" }}>{msg}</div>}
        <div className="text-xs mt-3" style={{ color: "#6b6b73" }}>Powered by Open Food Facts — values are per 100 g; adjust quantity in your log.</div>
      </div>
    </div>
  );
}

/* ============================ QUICK ADD (custom food) ============================ */
function QuickAdd({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  return (
    <div className="rounded-2xl p-4" style={{ background: COL.card, border: `1px solid ${COL.line}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2"><Plus size={16} style={{ color: COL.amber }} /><span className="font-bold text-white">Add a custom food</span></div>
        <ChevronRight size={16} style={{ color: "#6b6b73", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2 bananas" />
          <div className="flex gap-2">
            <Input value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="numeric" placeholder="kcal" />
            <Input value={protein} onChange={(e) => setProtein(e.target.value)} inputMode="numeric" placeholder="protein (g)" />
          </div>
          <button
            onClick={() => {
              if (!name) return;
              onAdd({ name, kcal: parseFloat(kcal) || 0, protein: parseFloat(protein) || 0, carbs: 0, fat: 0 });
              setName(""); setKcal(""); setProtein(""); setOpen(false);
            }}
            className="w-full rounded-xl py-2.5 font-bold" style={{ background: COL.amber, color: "#000" }}>
            Add to log
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================ APP TOUR / WALKTHROUGH ============================ */
const TOUR_KEY = "prime-tour-v1";
const TOUR_STEPS = [
  { icon: Home, title: "Welcome to PRIME", body: "This quick tour shows the whole app in 30 seconds. Your day starts here: a completion score, your live calorie ring, and quick logs for steps, water, sleep and weight." },
  { icon: Dumbbell, title: "Workout", body: "Follow the day's plan. Log weight × reps for each set, tick them off, use the built-in rest timer, and tap “Watch demo” for a form video. The plan auto-adjusts to your goal across 28 weeks." },
  { icon: UtensilsCrossed, title: "Diet & recipes", body: "Get an auto-plan that hits your calorie target, tap any meal for the full recipe, search foods, and track calories & macros live. Indian North/South, veg or non-veg." },
  { icon: TrendingUp, title: "Progress", body: "Your weight trend, BMI, streaks and a completion calendar — plus private progress photos you can upload every couple of weeks." },
  { icon: Sparkles, title: "Your AI Coach", body: "Tap the spark ✨ up top anytime for a weekly check-in, dinner ideas within your macros, or plateau help — it already knows your goal and progress." },
  { icon: Bell, title: "Stay on track", body: "Turn on reminders so you never miss a day — they work even when the app is closed. Tap Enable notifications, then Enable background push, and pick a time:", notif: true },
  { icon: Smartphone, title: "Install it like an app", body: "Add PRIME to your home screen so it opens full-screen, works offline and feels native:", install: true },
];

function Tour({ profile, onUpdate, onClose }) {
  const [i, setI] = useState(0);
  const step = TOUR_STEPS[i];
  const last = i === TOUR_STEPS.length - 1;
  const Icon = step.icon;
  const finish = () => { try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) {} onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.78)" }}>
      <div className="w-full rounded-3xl p-6" style={{ maxWidth: 420, background: COL.card, border: `1px solid ${COL.line}` }}>
        <div className="flex gap-1.5 mb-5">
          {TOUR_STEPS.map((_, idx) => (
            <div key={idx} className="flex-1 rounded-full" style={{ height: 4, background: idx <= i ? COL.amber : COL.line }} />
          ))}
        </div>
        <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: 16, background: COL.inp, border: `1px solid ${COL.line}`, margin: "0 auto" }}>
          <Icon size={26} style={{ color: COL.amber }} />
        </div>
        <div className="text-center text-2xl font-extrabold text-white">{step.title}</div>
        <div className="text-center text-sm mt-2" style={{ color: "#9a9aa3", lineHeight: 1.6 }}>{step.body}</div>
        {step.notif && <div className="mt-4 text-left">{profile ? <NotifSettings profile={profile} onUpdate={onUpdate} /> : null}</div>}
        {step.install && <div className="mt-4"><InstallGuide /></div>}
        <div className="mt-6 flex items-center gap-3">
          {i > 0 ? (
            <button onClick={() => setI(i - 1)} className="rounded-xl py-3 px-4 font-bold" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>Back</button>
          ) : (
            <button onClick={finish} className="rounded-xl py-3 px-4 font-semibold" style={{ background: "transparent", color: "#8a8a93" }}>Skip</button>
          )}
          <button onClick={() => (last ? finish() : setI(i + 1))} className="flex-1 rounded-xl py-3 font-bold uppercase" style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em" }}>
            {last ? "Start tracking" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ AI COACH (Groq) ============================ */
const COACH_SUGGESTIONS = [
  "Give me a quick weekly check-in.",
  "What should I eat for dinner tonight?",
  "Am I losing weight too fast or too slow?",
  "How do I break my plateau?",
];
function CoachSheet({ context, starter, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/coach", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ context, messages: next }),
      });
      const j = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: j.reply || j.error || "Something went wrong." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the coach — check your connection." }]);
    }
    setBusy(false);
  };

  useEffect(() => { if (starter) send(starter); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages, busy]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ maxWidth: 480, height: "82vh", background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2"><Sparkles size={18} style={{ color: COL.amber }} /><div className="text-lg font-bold text-white">PRIME Coach</div></div>
          <button aria-label="Close" onClick={onClose} style={{ color: "#8a8a93" }}><X size={20} /></button>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !busy && (
            <div className="text-sm" style={{ color: "#8a8a93" }}>Ask me anything about your plan, food or training — I can see your goal, targets and progress.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div className="rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap" style={{
                maxWidth: "85%", lineHeight: 1.5,
                background: m.role === "user" ? COL.amber : COL.inp,
                color: m.role === "user" ? "#000" : "#e7e7ea",
                border: m.role === "user" ? "none" : `1px solid ${COL.line}`,
              }}>{m.content}</div>
            </div>
          ))}
          {busy && <div className="text-sm" style={{ color: COL.amber }}>Coach is thinking…</div>}
        </div>

        {messages.length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {COACH_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full px-3 py-1.5 text-xs" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>{s}</button>
            ))}
          </div>
        )}

        <div className="p-3 flex items-center gap-2" style={{ borderTop: `1px solid ${COL.line}` }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Ask your coach…"
            className="flex-1 rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
          <button aria-label="Send message" onClick={() => send()} disabled={busy} className="rounded-xl px-4 py-3 font-bold" style={{ background: COL.amber, color: "#000", opacity: busy ? 0.6 : 1 }}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ============================ NOTIFICATIONS / REMINDERS ============================ */
function NotifSettings({ profile, onUpdate }) {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [perm, setPerm] = useState(supported ? Notification.permission : "unsupported");
  const [pushOn, setPushOn] = useState(false);
  const reminders = profile.reminders || { enabled: false, time: "19:00" };
  const tz = () => -new Date().getTimezoneOffset();

  useEffect(() => { (async () => { try { const reg = await navigator.serviceWorker?.ready; const sub = await reg?.pushManager?.getSubscription(); setPushOn(!!sub); } catch (e) {} })(); }, []);

  const enable = async () => { try { setPerm(await Notification.requestPermission()); } catch (e) {} };
  const enablePush = async () => {
    try {
      if (Notification.permission !== "granted") { const p = await Notification.requestPermission(); setPerm(p); if (p !== "granted") return; }
      if (!VAPID) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) });
      const json = sub.toJSON();
      const existing = (await sGet("prime-push")) || [];
      await sSet("prime-push", [...existing.filter((s) => s.endpoint !== json.endpoint), json]);
      onUpdate({ reminders: { ...reminders, enabled: true, time: reminders.time || "19:00", tz: tz() } });
      setPushOn(true);
    } catch (e) {}
  };

  return (
    <div>
      <Label>Notifications &amp; reminders</Label>
      {!supported ? (
        <div className="text-xs mt-2" style={{ color: "#6b6b73" }}>This browser doesn&apos;t support notifications.</div>
      ) : (
        <div className="mt-2 space-y-2">
          {perm !== "granted" ? (
            <button onClick={enable} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}><Bell size={16} /> Enable notifications</button>
          ) : (
            <div className="text-xs flex items-center gap-1" style={{ color: "#8be0a4" }}><Check size={13} /> Notifications enabled</div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm" style={{ color: "#cfcfd6" }}>Daily reminder</span>
            <div style={{ width: 130 }}><Pills cols={2} options={[["on", "On"], ["off", "Off"]]} value={reminders.enabled ? "on" : "off"} onChange={(v) => onUpdate({ reminders: { ...reminders, enabled: v === "on", time: reminders.time || "19:00", tz: tz() } })} /></div>
          </div>
          {reminders.enabled && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: "#cfcfd6" }}>Reminder time</span>
              <input type="time" defaultValue={reminders.time || "19:00"} onBlur={(e) => onUpdate({ reminders: { ...reminders, time: e.target.value || "19:00", tz: tz() } })}
                className="rounded-lg px-2 py-1.5 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}`, colorScheme: "dark" }} />
            </div>
          )}
          {VAPID ? (
            pushOn ? (
              <div className="text-xs flex items-center gap-1" style={{ color: "#8be0a4" }}><Check size={13} /> Background reminders on (works when the app is closed)</div>
            ) : (
              <button onClick={enablePush} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: COL.inp, color: COL.amber, border: `1px solid ${COL.line}` }}><Bell size={16} /> Enable background push reminders</button>
            )
          ) : (
            <div className="text-xs" style={{ color: "#6b6b73" }}>Achievement alerts &amp; reminders fire while the app is open. Background push (when fully closed) activates once the server VAPID keys are set.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================ SETTINGS / PROFILE ============================ */
function SettingsSheet({ profile, session, startDate, dayNum, targets: T, onClose, onUpdate, onSignOut, onReset, onReplayTour, onExport, onSaveApply }) {
  const num = (v) => (v === "" || v === null || isNaN(parseFloat(v)) ? "" : parseFloat(v));
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full p-5 rounded-t-3xl overflow-y-auto" style={{ maxWidth: 480, maxHeight: "90vh", background: COL.card, border: `1px solid ${COL.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><User size={18} style={{ color: COL.amber }} /><div className="text-lg font-bold text-white">Profile & Settings</div></div>
          <button aria-label="Close" onClick={onClose} style={{ color: "#8a8a93" }}><X size={20} /></button>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
          <div className="flex items-center gap-2 text-white font-semibold mb-1"><Activity size={15} style={{ color: COL.amber }} />Your daily targets</div>
          <div className="text-sm" style={{ color: "#cfcfd6" }}>{T.calories} kcal · {T.protein}g protein · {T.carbs}g carbs · {T.fat}g fat</div>
          <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>BMR {T.bmr} · maintenance ≈ {T.tdee} kcal</div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <div className="mt-2"><Input value={profile.name || ""} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="You" /></div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1"><Label>Sex</Label><div className="mt-2"><Pills cols={2} options={[["male", "Male"], ["female", "Female"]]} value={profile.sex || "male"} onChange={(v) => onUpdate({ sex: v })} /></div></div>
            <div style={{ width: 90 }}><Label>Age</Label><div className="mt-2"><Input defaultValue={profile.age ?? ""} onBlur={(e) => onUpdate({ age: clampNum(e.target.value, 13, 100, profile.age) })} inputMode="numeric" /></div></div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1"><Label>Height (cm)</Label><div className="mt-2"><Input defaultValue={profile.heightCm ?? ""} onBlur={(e) => onUpdate({ heightCm: clampNum(e.target.value, 120, 230, profile.heightCm) })} inputMode="decimal" /></div></div>
            <div className="flex-1"><Label>Goal weight</Label><div className="mt-2"><Input defaultValue={profile.goalWeight ?? ""} onBlur={(e) => onUpdate({ goalWeight: clampNum(e.target.value, 30, 300, profile.goalWeight) })} inputMode="decimal" /></div></div>
          </div>
          <div>
            <Label>Starting weight</Label>
            <div className="mt-2"><Input defaultValue={profile.startWeight ?? ""} onBlur={(e) => onUpdate({ startWeight: clampNum(e.target.value, 30, 300, profile.startWeight) })} inputMode="decimal" /></div>
            <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>Daily weigh-ins are logged on the Today tab.</div>
          </div>
          <div>
            <Label>Goal</Label>
            <div className="mt-2 space-y-2">
              {Object.entries(GOALS).map(([k, g]) => (
                <button key={k} onClick={() => onUpdate({ goal: k })} className="w-full text-left rounded-xl px-4 py-2.5"
                  style={profile.goal === k ? { background: COL.amber, color: "#000" } : { background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
                  <span className="font-bold">{g.label}</span> <span className="text-xs">· {g.tag}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Reach goal weight in (months)</Label>
            <input defaultValue={profile.goalMonths ?? 4} onBlur={(e) => onUpdate({ goalMonths: clampNum(e.target.value, 1, 60, profile.goalMonths) })} inputMode="decimal"
              className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }} />
            {(() => {
              const pace = goalPace(profile, profile.startWeight);
              if (!pace) return null;
              return <div className="text-xs mt-1" style={{ color: pace.clamped ? "#f5b301" : "#6b6b73" }}>≈ {Math.abs(pace.cappedPerWeek).toFixed(2)} kg/week{pace.clamped ? ` · capped for safety (~${pace.realisticMonths} months)` : ""}. Diet auto-adjusts to this.</div>;
            })()}
          </div>
          <div>
            <Label>Experience</Label>
            <div className="mt-2"><Pills options={Object.entries(EXPERIENCE).map(([k, x]) => [k, x.label])} value={profile.experience || "active"} onChange={(v) => onUpdate({ experience: v })} /></div>
          </div>
          <div>
            <Label>Where you train</Label>
            <div className="mt-2"><Pills options={Object.entries(EQUIPMENT).map(([k, x]) => [k, x.label])} value={profile.equipment || "gym"} onChange={(v) => onUpdate({ equipment: v })} /></div>
          </div>
          <div>
            <Label>Training days</Label>
            <div className="mt-2"><WeekdayPicker value={profile.workoutDays || [1, 3, 5]} onChange={(v) => onUpdate({ workoutDays: v.length ? v : [1, 3, 5] })} /></div>
            <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>Workouts land on these days; rest days fill the rest.</div>
          </div>
          <div>
            <Label>Program start date</Label>
            <input type="date" defaultValue={profile.startDate} onBlur={(e) => e.target.value && onUpdate({ startDate: e.target.value })}
              className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}`, colorScheme: "dark" }} />
          </div>
          <div>
            <Label>Activity level</Label>
            <select value={profile.activity || "moderate"} onChange={(e) => onUpdate({ activity: e.target.value })}
              className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
              {Object.entries(ACTIVITY).map(([k, a]) => <option key={k} value={k} style={{ background: COL.inp }}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Country</Label>
            <select value={profile.country || "india"} onChange={(e) => { const v = e.target.value; onUpdate({ country: v, region: countryHasRegions(v) ? (profile.region && profile.region !== "any" ? profile.region : "north") : "any" }); }}
              className="mt-2 w-full rounded-xl px-3 py-3 text-white outline-none" style={{ background: COL.inp, border: `1px solid ${COL.line}` }}>
              {COUNTRY_ORDER.map((c) => <option key={c} value={c} style={{ background: COL.inp }}>{COUNTRIES[c].label}</option>)}
            </select>
          </div>
          {countryHasRegions(profile.country) && (
            <div><Label>Regional cuisine</Label><div className="mt-2"><Pills cols={2} options={[["north", "North Indian"], ["south", "South Indian"]]} value={profile.region || "north"} onChange={(v) => onUpdate({ region: v })} /></div></div>
          )}
          <div><Label>Diet preference</Label><div className="mt-2"><Pills options={[["veg", "Veg"], ["nonveg", "Non-veg"], ["both", "Both"]]} value={profile.diet || "both"} onChange={(v) => onUpdate({ diet: v })} /></div></div>
          <div>
            <Label>Adaptive targets</Label>
            <div className="mt-2"><Pills cols={2} options={[["on", "On"], ["off", "Off"]]} value={profile.adaptive === false ? "off" : "on"} onChange={(v) => onUpdate({ adaptive: v === "on" })} /></div>
            <div className="text-xs mt-1" style={{ color: "#6b6b73" }}>When on, your calorie goal is recalculated from your real intake &amp; weight trend once you have ~2 weeks of data.</div>
          </div>

          <NotifSettings profile={profile} onUpdate={onUpdate} />

          <div className="text-xs" style={{ color: "#6b6b73" }}>Started {prettyDate(startDate)} · Day {Math.max(0, dayNum)} · {session?.user?.email}</div>

          <button onClick={onSaveApply}
            className="w-full rounded-xl py-3 text-sm font-bold uppercase" style={{ background: COL.amber, color: "#000", letterSpacing: "0.05em" }}>
            Save &amp; apply changes
          </button>
          <button onClick={onReplayTour} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
            <Smartphone size={16} /> Replay tutorial &amp; install guide
          </button>
          <button onClick={onExport} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
            <Upload size={16} /> Export my data (JSON)
          </button>
          <button onClick={onSignOut} className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: COL.inp, color: "#cfcfd6", border: `1px solid ${COL.line}` }}>
            <LogOut size={16} /> Sign out
          </button>
          <button onClick={onReset} className="w-full rounded-xl py-2.5 text-sm font-semibold" style={{ background: "#2a1414", color: "#ff8a8a", border: "1px solid #3a1a1a" }}>
            Reset all data
          </button>
        </div>
      </div>
    </div>
  );
}
