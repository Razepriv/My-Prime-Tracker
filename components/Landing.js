"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Home, Dumbbell, UtensilsCrossed, TrendingUp, Flame, Footprints, Droplets,
  Moon, Scale, Play, Check, Camera, Settings, ChevronLeft, ChevronRight,
  Plus, Leaf, ArrowRight, Flame as FlameIcon, Apple, Video, BarChart3,
  UserCog, ShieldCheck,
} from "lucide-react";

const COL = {
  bg: "#0a0a0c", card: "#141417", line: "#26262b", amber: "#f5b301",
  amberDim: "#7a5c08", inp: "#1d1d22", text: "#e7e7ea", dim: "#8a8a93",
};
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/* ============================ scroll reveal ============================ */
function Reveal({ children, delay = 0, className = "", style }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setInView(true); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ============================ phone frame ============================ */
function Phone({ children, className = "", style }) {
  return (
    <div className={className} style={{ width: 268, ...style }}>
      <div style={{ borderRadius: 42, background: "#050506", padding: 9, border: "1px solid #2a2a31", boxShadow: "0 40px 90px rgba(0,0,0,.65), 0 0 0 1px rgba(245,179,1,.04)" }}>
        <div style={{ position: "relative", borderRadius: 34, overflow: "hidden", background: COL.bg, aspectRatio: "9 / 19", border: "1px solid #1b1b20" }}>
          <div style={{ position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)", width: 86, height: 17, background: "#000", borderRadius: 12, zIndex: 6 }} />
          <div style={{ height: "100%", overflow: "hidden" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* small building blocks for the mockups */
const L = ({ children }) => <div style={{ fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase", color: "#6b6b73", fontWeight: 700 }}>{children}</div>;
function Card({ children, style }) {
  return <div style={{ background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 14, padding: 10, ...style }}>{children}</div>;
}
function MiniRing({ pct, size = 52, stroke = 6, big, small }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - (Math.min(100, pct) / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#26262b" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COL.amber} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{big}</div>
        <div style={{ color: "#6b6b73", fontSize: 7 }}>{small}</div>
      </div>
    </div>
  );
}
function MBar({ name, pct, color, val }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7.5, color: "#9a9aa3", marginBottom: 2 }}><span>{name}</span><span>{val}</span></div>
      <div style={{ height: 5, borderRadius: 99, background: "#26262b", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} /></div>
    </div>
  );
}
function StatBox({ icon: Icon, label, value, sub }) {
  return (
    <Card style={{ padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#cfcfd6", marginBottom: 3 }}>
        <Icon size={11} style={{ color: COL.amber }} /><span style={{ fontSize: 8.5, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{value}</div>
      <div style={{ color: "#6b6b73", fontSize: 7 }}>{sub}</div>
    </Card>
  );
}

/* screen chrome: header + content + bottom nav */
function Screen({ active, children }) {
  const tabs = [["today", Home], ["workout", Dumbbell], ["diet", UtensilsCrossed], ["progress", TrendingUp]];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ padding: "26px 11px 9px", borderBottom: `1px solid ${COL.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>Aman&apos;s <span style={{ color: COL.amber }}>Prime</span></div>
          <Settings size={13} color="#8a8a93" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <ChevronLeft size={13} color="#cfcfd6" />
          <div style={{ textAlign: "center" }}><div style={{ color: "#fff", fontWeight: 700, fontSize: 9 }}>Today</div><div style={{ color: "#6b6b73", fontSize: 7 }}>Mon, 8 Jun</div></div>
          <ChevronRight size={13} color="#cfcfd6" />
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      <div style={{ display: "flex", borderTop: `1px solid ${COL.line}` }}>
        {tabs.map(([id, Icon]) => (
          <div key={id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "7px 0" }}>
            <Icon size={14} color={active === id ? COL.amber : "#6b6b73"} />
            <span style={{ fontSize: 7, color: active === id ? COL.amber : "#6b6b73", fontWeight: active === id ? 700 : 500, textTransform: "capitalize" }}>{id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- four faithful screen replicas ---- */
function TodayShot() {
  return (
    <Screen active="today">
      <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MiniRing pct={86} big="86%" small="day" />
        <div>
          <L>Day 24 · Week 4/28</L>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, marginTop: 2 }}>Strong work.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: COL.amber, fontSize: 8.5, marginTop: 3, fontWeight: 700 }}><FlameIcon size={10} /> 12-day streak</div>
        </div>
      </Card>
      <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MiniRing pct={71} big="1450" small="/2050" />
        <div style={{ flex: 1 }}>
          <L>Calories today</L>
          <div style={{ marginTop: 4 }}>
            <MBar name="Protein" pct={78} color="#8be0a4" val="120 / 154g" />
            <MBar name="Carbs" pct={62} color="#5aa9e6" val="118 / 190g" />
            <MBar name="Fat" pct={55} color="#f5b301" val="35 / 64g" />
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatBox icon={Footprints} label="Steps" value="7,200" sub="goal 9,000" />
        <StatBox icon={Droplets} label="Water" value="5/8" sub="glasses" />
        <StatBox icon={Moon} label="Sleep" value="7.5" sub="hrs" />
        <StatBox icon={Scale} label="Weight" value="78" sub="kg" />
      </div>
    </Screen>
  );
}
function WorkoutShot() {
  const ex = [
    ["Incline Dumbbell Press", "Upper Chest · 3 × 8–12", true],
    ["Lat Pulldown", "Lats · 3 × 8–12", true],
    ["Seated Row", "Mid Back · 3 × 8–12", false],
    ["DB Shoulder Press", "Shoulders · 3 × 10–12", false],
  ];
  return (
    <Screen active="workout">
      <Card>
        <L>Phase 2 · Week 6/28</L>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, marginTop: 2 }}>Upper A</div>
        <div style={{ color: COL.amber, fontSize: 8.5 }}>Push / Pull</div>
      </Card>
      {ex.map(([name, meta, done], i) => (
        <Card key={i} style={{ borderColor: done ? COL.amberDim : COL.line, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ width: 18, height: 18, borderRadius: 6, background: done ? COL.amber : COL.inp, border: `1px solid ${done ? COL.amber : COL.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {done && <Check size={11} color="#000" strokeWidth={3} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 9.5 }}>{name}</div>
            <div style={{ color: COL.amber, fontSize: 7.5 }}>{meta}</div>
            <div style={{ marginTop: 5, display: "inline-flex", alignItems: "center", gap: 3, background: COL.inp, border: `1px solid ${COL.line}`, color: COL.amber, borderRadius: 7, padding: "2px 6px", fontSize: 7.5, fontWeight: 700 }}>
              <Play size={8} /> Watch demo
            </div>
          </div>
        </Card>
      ))}
    </Screen>
  );
}
function DietShot() {
  return (
    <Screen active="diet">
      <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MiniRing pct={71} big="1450" small="/2050" />
        <div style={{ flex: 1 }}>
          <L>Calories today</L>
          <div style={{ marginTop: 4 }}>
            <MBar name="Protein" pct={78} color="#8be0a4" val="120 / 154g" />
            <MBar name="Carbs" pct={62} color="#5aa9e6" val="118 / 190g" />
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 6 }}>
        {["North Indian", "Non-veg"].map((t) => (
          <div key={t} style={{ flex: 1, textAlign: "center", background: COL.amber, color: "#000", borderRadius: 9, padding: "6px 0", fontSize: 8.5, fontWeight: 700 }}>{t}</div>
        ))}
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontWeight: 700, fontSize: 10, marginBottom: 6 }}><UtensilsCrossed size={11} color={COL.amber} /> Lunch</div>
        <div style={{ background: COL.inp, border: `1px solid ${COL.line}`, borderRadius: 10, padding: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 9.5 }}>Chicken Curry + Roti</div>
              <div style={{ color: "#8a8a93", fontSize: 7.5, marginTop: 2 }}>540 kcal · 45g P · 52g C · 16g F</div>
              <div style={{ color: COL.amber, fontSize: 7.5, marginTop: 2 }}>Tap for full recipe →</div>
            </div>
            <div style={{ background: COL.amber, color: "#000", borderRadius: 7, padding: "3px 7px", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", gap: 2 }}><Plus size={9} /> Log</div>
          </div>
        </div>
      </Card>
    </Screen>
  );
}
function ProgressShot() {
  const pts = "0,38 18,33 36,35 54,27 72,24 90,18 108,14";
  return (
    <Screen active="progress">
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div><L>Current</L><div style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>78<span style={{ fontSize: 11, color: "#6b6b73" }}> kg</span></div></div>
          <div style={{ textAlign: "right" }}><L>Lost</L><div style={{ color: COL.amber, fontWeight: 800, fontSize: 15 }}>−6.0 kg</div></div>
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: "#26262b", overflow: "hidden" }}><div style={{ height: "100%", width: "60%", background: COL.amber }} /></div>
        <div style={{ color: "#6b6b73", fontSize: 7.5, marginTop: 4 }}>BMI 24.1 · <span style={{ color: "#8be0a4" }}>Healthy</span></div>
      </Card>
      <Card>
        <L>Weight trend</L>
        <svg viewBox="0 0 110 44" style={{ width: "100%", height: 46, marginTop: 4 }}>
          <polyline points={pts} fill="none" stroke={COL.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pts.split(" ").map((p, i) => { const [x, y] = p.split(","); return <circle key={i} cx={x} cy={y} r="1.6" fill={COL.amber} />; })}
        </svg>
      </Card>
      <Card style={{ padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontWeight: 700, fontSize: 9.5, marginBottom: 6 }}><Camera size={11} color={COL.amber} /> Progress photos</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
          {["#3a2f1a", "#28323a", "#332a33"].map((c, i) => (
            <div key={i} style={{ aspectRatio: "3/4", borderRadius: 7, background: c, position: "relative" }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 6.5, color: "#fff", background: "rgba(0,0,0,.5)", padding: "1px 3px" }}>Wk {i * 2 + 2}</div>
            </div>
          ))}
        </div>
      </Card>
    </Screen>
  );
}

/* ============================ sections ============================ */
function Nav() {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,10,12,.78)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COL.line}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 17 }}>
          <span style={{ color: COL.amber }}>Prime</span> Tracker
        </div>
        <div className="hidden sm:flex" style={{ gap: 26, alignItems: "center" }}>
          <a href="#features" style={{ color: COL.dim, fontSize: 14, textDecoration: "none" }}>Features</a>
          <a href="#screens" style={{ color: COL.dim, fontSize: 14, textDecoration: "none" }}>Screens</a>
          <a href="#how" style={{ color: COL.dim, fontSize: 14, textDecoration: "none" }}>How it works</a>
        </div>
        <a href="/app" style={{ background: COL.amber, color: "#000", fontWeight: 800, fontSize: 14, padding: "9px 18px", borderRadius: 11, textDecoration: "none" }}>Open app</a>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div className="float-b" style={{ position: "absolute", top: -120, right: -80, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,179,1,.20), transparent 60%)", filter: "blur(20px)", animation: "glowpulse 6s ease-in-out infinite" }} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 20px 40px", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 99, padding: "6px 13px", color: COL.amber, fontSize: 12.5, fontWeight: 700 }}>
              <FlameIcon size={13} /> 28-week transformation system
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 style={{ color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.05, margin: "18px 0 0", letterSpacing: "-.02em" }}>
              Build your <span style={{ color: COL.amber }}>prime</span> physique — one tracked day at a time.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p style={{ color: COL.dim, fontSize: 17, lineHeight: 1.6, margin: "18px 0 0", maxWidth: 520 }}>
              Personalised calorie &amp; macro targets, Indian diet plans with real recipes,
              guided workouts with demo videos, and progress photos — all in one private,
              free app that saves everywhere you log in.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
              <a href="/app" style={{ background: COL.amber, color: "#000", fontWeight: 800, fontSize: 15, padding: "13px 24px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Start free <ArrowRight size={17} />
              </a>
              <a href="#screens" style={{ background: COL.card, color: "#fff", fontWeight: 700, fontSize: 15, padding: "13px 24px", borderRadius: 12, textDecoration: "none", border: `1px solid ${COL.line}` }}>
                See the screens
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div style={{ display: "flex", gap: 22, marginTop: 30, flexWrap: "wrap" }}>
              {[["Free", "forever, personal use"], ["Private", "your data, RLS-secured"], ["Any device", "phone, laptop, anywhere"]].map(([a, b]) => (
                <div key={a}>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{a}</div>
                  <div style={{ color: "#6b6b73", fontSize: 12.5 }}>{b}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center", position: "relative" }}>
          <Reveal delay={120}>
            <Phone className="float-a"><TodayShot /></Phone>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: UserCog, title: "Personalised from day one", body: "Tell us your sex, age, height, weight, goal and activity. We tailor every target to you — and you can change it all anytime in your profile." },
  { icon: BarChart3, title: "Calorie & macro engine", body: "Your daily calories and protein/carb/fat are auto-calculated (BMR → TDEE → goal) and tracked live as you log food." },
  { icon: Apple, title: "Indian diet plans + recipes", body: "North & South Indian, veg or non-veg suggestions. Tap any meal for the full recipe, ingredients and calories — then log it in one tap." },
  { icon: Video, title: "Workouts with demo videos", body: "A 28-week progressive plan. Every exercise shows the target muscle, a coaching cue and a form video so you train safely." },
  { icon: Camera, title: "Progress photos & charts", body: "Upload weekly photos (kept private), watch your weight trend, BMI, streaks and a completion calendar fill in." },
  { icon: ShieldCheck, title: "Private & synced", body: "Email login, per-user row-level security, and your progress follows you on every device you sign in from." },
];

function Features() {
  return (
    <section id="features" style={{ maxWidth: 1120, margin: "0 auto", padding: "60px 20px" }}>
      <Reveal>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ color: COL.amber, fontWeight: 800, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}>Everything in one place</div>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(26px,4.5vw,40px)", margin: "12px 0 0", letterSpacing: "-.02em" }}>A complete coach in your pocket</h2>
        </div>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 40 }}>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 90}>
            <div style={{ background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 18, padding: 22, height: "100%" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: COL.inp, border: `1px solid ${COL.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <f.icon size={20} color={COL.amber} />
              </div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginTop: 14 }}>{f.title}</div>
              <div style={{ color: COL.dim, fontSize: 14.5, lineHeight: 1.6, marginTop: 8 }}>{f.body}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  const rows = [
    { shot: <WorkoutShot />, tag: "Workout", title: "Guided sessions, real form videos", body: "Follow the day's plan with checkboxes, log your weights to beat last time, and tap Watch demo on any move for a how-to video. The program auto-advances across 28 weeks.", points: ["Target muscle + coaching cue per exercise", "Progressive overload tracking", "Phase 1 full-body → Phase 2 upper/lower split"] },
    { shot: <DietShot />, tag: "Diet", title: "Eat for your goal — without guessing", body: "Pick your cuisine and diet, then get meal suggestions that fit your calories. Open any dish for the complete recipe and macros, and log it instantly.", points: ["North / South Indian · veg & non-veg", "Full recipes: ingredients + method + calories", "One-tap logging into your calorie tracker"] },
    { shot: <ProgressShot />, tag: "Progress", title: "See the change you're earning", body: "Your weight trend, BMI and goal progress update as you log. Add private progress photos every couple of weeks and watch the streak calendar fill in.", points: ["Weight chart with goal line", "Private weekly photo gallery", "Streaks, days-done and BMI bands"] },
  ];
  return (
    <section id="screens" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 20px 20px" }}>
      <Reveal>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 20px" }}>
          <div style={{ color: COL.amber, fontWeight: 800, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}>Take a look</div>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(26px,4.5vw,40px)", margin: "12px 0 0", letterSpacing: "-.02em" }}>Every screen, built for momentum</h2>
        </div>
      </Reveal>
      {rows.map((r, i) => (
        <div key={r.tag} style={{ display: "flex", flexWrap: "wrap", gap: 44, alignItems: "center", justifyContent: "center", padding: "44px 0", flexDirection: i % 2 ? "row-reverse" : "row" }}>
          <Reveal className="reveal" style={{ flex: "0 0 auto" }}>
            <Phone><>{r.shot}</></Phone>
          </Reveal>
          <Reveal delay={120} style={{ flex: "1 1 340px", minWidth: 300, maxWidth: 480 }}>
            <div>
              <div style={{ display: "inline-block", color: COL.amber, fontWeight: 800, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", border: `1px solid ${COL.line}`, borderRadius: 99, padding: "4px 11px" }}>{r.tag}</div>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(22px,3.5vw,30px)", margin: "14px 0 0", letterSpacing: "-.01em" }}>{r.title}</h3>
              <p style={{ color: COL.dim, fontSize: 15.5, lineHeight: 1.6, marginTop: 12 }}>{r.body}</p>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {r.points.map((p) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, color: "#cfcfd6", fontSize: 14.5 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: COL.inp, border: `1px solid ${COL.line}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={13} color={COL.amber} /></span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      ))}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Create your account", "Sign up with email in seconds. Your data is private and synced across devices."],
    ["Set your profile", "Goal, body stats, cuisine and diet — we calculate your calorie and macro targets instantly."],
    ["Track every day", "Log food, workouts, water, sleep, weight and photos. Watch your streak and progress grow."],
  ];
  return (
    <section id="how" style={{ maxWidth: 1120, margin: "0 auto", padding: "60px 20px" }}>
      <Reveal>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ color: COL.amber, fontWeight: 800, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}>Get going in minutes</div>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(26px,4.5vw,40px)", margin: "12px 0 0", letterSpacing: "-.02em" }}>How it works</h2>
        </div>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16, marginTop: 40 }}>
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 110}>
            <div style={{ background: COL.card, border: `1px solid ${COL.line}`, borderRadius: 18, padding: 24, height: "100%" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COL.amber, color: "#000", fontWeight: 900, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginTop: 14 }}>{s[0]}</div>
              <div style={{ color: COL.dim, fontSize: 14.5, lineHeight: 1.6, marginTop: 8 }}>{s[1]}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: "20px 20px 80px" }}>
      <Reveal>
        <div style={{ maxWidth: 880, margin: "0 auto", borderRadius: 26, padding: "48px 28px", textAlign: "center", background: "linear-gradient(135deg, rgba(245,179,1,.14), rgba(245,179,1,.03))", border: `1px solid ${COL.amberDim}` }}>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(26px,4.5vw,40px)", letterSpacing: "-.02em", margin: 0 }}>Your prime starts today.</h2>
          <p style={{ color: COL.dim, fontSize: 16.5, lineHeight: 1.6, margin: "14px auto 0", maxWidth: 540 }}>Discipline today. Strength tomorrow. Set your goal and take the first tracked step.</p>
          <a href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: COL.amber, color: "#000", fontWeight: 800, fontSize: 16, padding: "14px 30px", borderRadius: 13, textDecoration: "none", marginTop: 26 }}>
            Open PRIME Tracker <ArrowRight size={18} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${COL.line}`, padding: "26px 20px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 14 }}><span style={{ color: COL.amber }}>Prime</span> Tracker</div>
        <div style={{ color: "#3a3a40", fontSize: 11.5, letterSpacing: ".15em", textTransform: "uppercase" }}>Discipline today · Strength tomorrow · Prime forever</div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div style={{ background: COL.bg, minHeight: "100vh", fontFamily: FONT }}>
      <Nav />
      <Hero />
      <Features />
      <Showcase />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
