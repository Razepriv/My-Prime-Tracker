// Workout library. Each exercise has a target muscle, a coaching cue, and a
// reliable "watch demo" video link (YouTube search — no API key, always works).
// Optional `gif` field renders an inline animation when present.

export function demoUrl(name) {
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " proper form technique");
}

export const WORKOUTS = {
  fullbody: {
    label: "Full Body", tag: "Foundation",
    ex: [
      { id: "fb_legpress", name: "Leg Press", sets: "3 × 10–12", muscle: "Quads / Glutes", cue: "Feet shoulder-width, don't lock knees at top." },
      { id: "fb_latpull", name: "Lat Pulldown", sets: "3 × 10–12", muscle: "Back / Lats", cue: "Pull to upper chest, squeeze shoulder blades." },
      { id: "fb_chestpress", name: "Chest Press", sets: "3 × 10–12", muscle: "Chest", cue: "Elbows ~45°, control the negative." },
      { id: "fb_row", name: "Seated Cable Row", sets: "3 × 10–12", muscle: "Back", cue: "Chest tall, drive elbows back, no torso swing." },
      { id: "fb_shoulder", name: "Dumbbell Shoulder Press", sets: "2 × 10–12", muscle: "Shoulders", cue: "Press up and slightly in, ribs down." },
      { id: "fb_plank", name: "Plank", sets: "3 × 30–45 sec", muscle: "Core", cue: "Squeeze glutes, straight line head to heels." },
    ],
  },
  upperA: {
    label: "Upper A", tag: "Push / Pull",
    ex: [
      { id: "ua_incline", name: "Incline Dumbbell Press", sets: "3 × 8–12", muscle: "Upper Chest", cue: "Bench 30°, lower to collarbone line." },
      { id: "ua_latpull", name: "Lat Pulldown", sets: "3 × 8–12", muscle: "Lats", cue: "Lead with elbows, full stretch at top." },
      { id: "ua_row", name: "Seated Row", sets: "3 × 8–12", muscle: "Mid Back", cue: "Pause 1s at the squeeze." },
      { id: "ua_shoulder", name: "DB Shoulder Press", sets: "3 × 10–12", muscle: "Shoulders", cue: "Don't flare elbows fully out." },
      { id: "ua_tri", name: "Triceps Pushdown", sets: "3 × 12–15", muscle: "Triceps", cue: "Elbows pinned to sides." },
      { id: "ua_curl", name: "Dumbbell Curl", sets: "3 × 12–15", muscle: "Biceps", cue: "No swinging, control down slowly." },
    ],
  },
  upperB: {
    label: "Upper B", tag: "Push / Pull",
    ex: [
      { id: "ub_chest", name: "Chest Press", sets: "3 × 8–12", muscle: "Chest", cue: "Full range, steady tempo." },
      { id: "ub_pullup", name: "Assisted Pull-up", sets: "3 × 8–12", muscle: "Lats / Back", cue: "Chin over bar, no kipping." },
      { id: "ub_csrow", name: "Chest-Supported Row", sets: "3 × 8–12", muscle: "Mid Back", cue: "Let chest pad do the stabilising." },
      { id: "ub_lateral", name: "Lateral Raises", sets: "3 × 12–15", muscle: "Side Delts", cue: "Lead with elbows, pour-the-jug." },
      { id: "ub_face", name: "Face Pulls", sets: "3 × 12–15", muscle: "Rear Delts", cue: "Pull to forehead, thumbs back." },
      { id: "ub_hammer", name: "Hammer Curls", sets: "3 × 12–15", muscle: "Biceps / Forearm", cue: "Neutral grip, no swing." },
    ],
  },
  lowerA: {
    label: "Lower A", tag: "Legs",
    ex: [
      { id: "la_legpress", name: "Leg Press", sets: "3 × 10–12", muscle: "Quads", cue: "Knees track over toes." },
      { id: "la_rdl", name: "Romanian Deadlift", sets: "3 × 10–12", muscle: "Hamstrings", cue: "Hips back, soft knees, flat back." },
      { id: "la_curl", name: "Leg Curl", sets: "3 × 10–12", muscle: "Hamstrings", cue: "Control, don't bounce the weight." },
      { id: "la_ext", name: "Leg Extension", sets: "3 × 10–12", muscle: "Quads", cue: "Pause and squeeze at the top." },
      { id: "la_calf", name: "Calf Raise", sets: "3 × 15–20", muscle: "Calves", cue: "Full stretch, full contraction." },
      { id: "la_knee", name: "Hanging Knee Raise", sets: "3 × 10–12", muscle: "Core", cue: "Curl pelvis up, no swinging." },
    ],
  },
  lowerB: {
    label: "Lower B", tag: "Legs",
    ex: [
      { id: "lb_goblet", name: "Goblet Squat", sets: "3 × 10–12", muscle: "Quads / Glutes", cue: "Elbows inside knees, chest up." },
      { id: "lb_hip", name: "Hip Thrust", sets: "3 × 10–12", muscle: "Glutes", cue: "Chin tucked, squeeze at top." },
      { id: "lb_back", name: "Back Extension", sets: "3 × 10–12", muscle: "Lower Back / Glutes", cue: "Round-then-extend, don't hyperextend." },
      { id: "lb_curl", name: "Leg Curl", sets: "3 × 10–12", muscle: "Hamstrings", cue: "Slow eccentric." },
      { id: "lb_calf", name: "Calf Raise", sets: "3 × 15–20", muscle: "Calves", cue: "Pause at the bottom stretch." },
      { id: "lb_crunch", name: "Cable Crunch", sets: "3 × 12–15", muscle: "Abs", cue: "Crunch ribs to pelvis, hips fixed." },
    ],
  },
};

// Schedule: phase 1 (wk 1–4) full body MWF; phase 2 upper/lower split.
export function getSchedule(startDate, date, daysBetween) {
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
