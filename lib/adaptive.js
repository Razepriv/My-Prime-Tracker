// Adaptive target engine.
// Instead of trusting the BMR/TDEE formula forever, we measure the user's
// TRUE maintenance from their own data: average logged intake vs. the slope of
// their weight trend. ~7700 kcal ≈ 1 kg of body mass.

const KCAL_PER_KG = 7700;

// Least-squares slope of weight over time, returned in kg/week.
export function weightTrend(weights) {
  const pts = (weights || [])
    .map((w) => ({ t: Date.parse(w.date + "T00:00:00"), y: Number(w.weight) }))
    .filter((p) => !isNaN(p.t) && !isNaN(p.y))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 2) return { slopePerWeek: 0, n: pts.length, days: 0, first: pts[0]?.y, last: pts[0]?.y };
  const t0 = pts[0].t;
  const xs = pts.map((p) => (p.t - t0) / 86400000);
  const ys = pts.map((p) => p.y);
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0);
  const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const denom = n * sxx - sx * sx;
  const slopePerDay = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  return { slopePerWeek: slopePerDay * 7, n, days: xs[xs.length - 1] - xs[0], first: ys[0], last: ys[ys.length - 1] };
}

// Average daily calories from a list of day records that actually logged food.
export function avgIntake(days, lastN = 21) {
  const withFood = (days || [])
    .filter((d) => d && Array.isArray(d.food) && d.food.length)
    .map((d) => ({ date: d.date, kcal: d.food.reduce((a, it) => a + (it.kcal || 0) * (it.qty || 1), 0) }))
    .filter((d) => d.kcal > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, lastN);
  if (!withFood.length) return { avg: 0, days: 0 };
  return { avg: Math.round(withFood.reduce((a, d) => a + d.kcal, 0) / withFood.length), days: withFood.length };
}

// trueMaintenance = avgIntake − dailyEnergyImbalance.
// (gaining → positive imbalance → maintenance below intake, and vice-versa)
export function estimateMaintenance(avg, slopePerWeek) {
  if (!avg) return 0;
  const dailyImbalance = (slopePerWeek * KCAL_PER_KG) / 7;
  return Math.round(avg - dailyImbalance);
}

// Is there enough data to trust the measured maintenance?
export function adaptiveReady(intake, trend) {
  return intake.days >= 10 && trend.days >= 12 && trend.n >= 4;
}

// One-shot: compute everything from raw weights + day history.
export function computeAdaptive(weights, days) {
  const trend = weightTrend(weights);
  const intake = avgIntake(days);
  const maintenance = estimateMaintenance(intake.avg, trend.slopePerWeek);
  return {
    trend,
    intake,
    maintenance,
    ready: adaptiveReady(intake, trend) && maintenance > 0,
  };
}
