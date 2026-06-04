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
export function targets(profile, weightKg) {
  const w = num(weightKg ?? profile?.startWeight, 75);
  const t = tdee(profile, w);
  const goal = GOALS[profile?.goal] || GOALS.prime;
  let calories = Math.round(t * (1 + goal.adjust));
  // never crash metabolism
  const floor = profile?.sex === "female" ? 1200 : 1500;
  calories = Math.max(floor, calories);
  const protein = Math.round(w * goal.protein);
  const fat = Math.round(w * 0.8);
  const calsFromPF = protein * 4 + fat * 9;
  const carbs = Math.max(0, Math.round((calories - calsFromPF) / 4));
  return { tdee: t, calories, protein, carbs, fat, bmr: bmr({ sex: profile?.sex, weightKg: w, heightCm: profile?.heightCm, age: profile?.age }) };
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
