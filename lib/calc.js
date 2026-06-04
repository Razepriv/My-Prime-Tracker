// Fitness math: BMR / TDEE / calorie + macro targets / BMI.
// All inputs metric (kg, cm). Pure functions, safe with partial profiles.

export const ACTIVITY = {
  sedentary: { label: "Sedentary (desk job, little exercise)", factor: 1.2 },
  light: { label: "Lightly active (1–3 workouts/wk)", factor: 1.375 },
  moderate: { label: "Moderately active (3–5 workouts/wk)", factor: 1.55 },
  active: { label: "Very active (6–7 workouts/wk)", factor: 1.725 },
  veryactive: { label: "Athlete (2x/day, hard labour)", factor: 1.9 },
};

export const GOALS = {
  fatloss: { label: "Lose fat", tag: "Calorie deficit", adjust: -0.20, protein: 2.0 },
  prime: { label: "Reach my prime (recomp)", tag: "Lean & strong", adjust: -0.08, protein: 1.9 },
  muscle: { label: "Build muscle", tag: "Lean surplus", adjust: +0.12, protein: 1.8 },
};

function num(v, d = 0) { const n = parseFloat(v); return isNaN(n) ? d : n; }

// Mifflin–St Jeor
export function bmr({ sex, weightKg, heightCm, age }) {
  const w = num(weightKg), h = num(heightCm), a = num(age);
  if (!w || !h || !a) return 0;
  const base = 10 * w + 6.25 * h - 5 * a;
  return Math.round(base + (sex === "female" ? -161 : 5));
}

export function tdee(profile, weightKg) {
  const w = num(weightKg ?? profile?.startWeight);
  const b = bmr({ sex: profile?.sex, weightKg: w, heightCm: profile?.heightCm, age: profile?.age });
  const f = (ACTIVITY[profile?.activity] || ACTIVITY.moderate).factor;
  return Math.round(b * f);
}

// Full target package for the day.
// opts.maintenance (optional) overrides the formula TDEE with a measured one
// from the adaptive engine.
export function targets(profile, weightKg, opts = {}) {
  const w = num(weightKg ?? profile?.startWeight, 75);
  const goalW = num(profile?.goalWeight, w);
  const maintenance = opts.maintenance && opts.maintenance > 0 ? Math.round(opts.maintenance) : tdee(profile, w);
  const goal = GOALS[profile?.goal] || GOALS.prime;
  const months = num(profile?.goalMonths, 0);
  // If the user set a target timeframe, derive the calorie delta from the rate
  // their goal actually requires; otherwise fall back to the goal's default %.
  let delta;
  if (months > 0 && Math.abs(goalW - w) > 0.1) {
    const weeks = months * 4.345;
    delta = ((goalW - w) / weeks) * 7700 / 7; // kcal/day (negative = deficit)
  } else {
    delta = maintenance * goal.adjust;
  }
  // safety: never exceed ~1%/wk loss or ~0.5%/wk gain, and hard kcal caps
  const maxLossDaily = -(0.01 * w * 7700) / 7;
  const maxGainDaily = (0.005 * w * 7700) / 7;
  delta = Math.max(maxLossDaily, Math.min(maxGainDaily, delta));
  delta = Math.max(-750, Math.min(500, delta));
  let calories = Math.round(maintenance + delta);
  const floor = profile?.sex === "female" ? 1200 : 1500;
  calories = Math.max(floor, calories);
  // protein on a lean-ish basis: the lower of current vs slightly-above-goal
  // weight, so very heavy users don't get absurd protein targets.
  const proteinBasis = Math.min(w, goalW * 1.1);
  const protein = Math.round(Math.min(goal.protein, 2.2) * proteinBasis);
  const fat = Math.round(proteinBasis * 0.8);
  const calsFromPF = protein * 4 + fat * 9;
  const carbs = Math.max(0, Math.round((calories - calsFromPF) / 4));
  return {
    tdee: maintenance, calories, protein, carbs, fat,
    bmr: bmr({ sex: profile?.sex, weightKg: w, heightCm: profile?.heightCm, age: profile?.age }),
    adaptive: !!(opts.maintenance && opts.maintenance > 0),
  };
}

// Pace toward the goal weight given a target timeframe (months).
// Returns weekly rate the user asked for, the safe-capped rate, realistic ETA,
// and whether we had to slow it down.
export function goalPace(profile, weightKg) {
  const w = num(weightKg ?? profile?.startWeight, 75);
  const goalW = num(profile?.goalWeight, w);
  const months = num(profile?.goalMonths, 0);
  if (!months || Math.abs(goalW - w) < 0.1) return null;
  const weeks = months * 4.345;
  const requested = (goalW - w) / weeks; // kg/week (negative = loss)
  const maxLoss = -(0.01 * w), maxGain = 0.005 * w;
  const capped = Math.max(maxLoss, Math.min(maxGain, requested));
  const clamped = Math.abs(capped - requested) > 0.02;
  const realisticWeeks = capped !== 0 ? Math.abs((goalW - w) / capped) : weeks;
  return { requestedPerWeek: requested, cappedPerWeek: capped, clamped, realisticMonths: Math.round((realisticWeeks / 4.345) * 10) / 10 };
}

// Clamp a numeric field to a sane range, keeping the previous value when blank.
export function clampNum(v, min, max, prev) {
  const n = parseFloat(v);
  if (isNaN(n)) return prev;
  return Math.min(max, Math.max(min, n));
}

export function bmi(weightKg, heightCm) {
  const w = num(weightKg), h = num(heightCm) / 100;
  if (!w || !h) return 0;
  return +(w / (h * h)).toFixed(1);
}

export function bmiBand(v) {
  if (!v) return { label: "—", color: "#6b6b73" };
  if (v < 18.5) return { label: "Underweight", color: "#5aa9e6" };
  if (v < 25) return { label: "Healthy", color: "#8be0a4" };
  if (v < 30) return { label: "Overweight", color: "#f5b301" };
  return { label: "Obese", color: "#ff8a8a" };
}
