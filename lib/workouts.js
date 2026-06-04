// Workout library. Each exercise has a target muscle, a coaching cue, and a
// reliable "watch demo" video link (YouTube search — no API key, always works).
// Optional `gif` field renders an inline animation when present.

export function demoUrl(name) {
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " proper form technique");
}

// ExerciseDB-friendly search terms per exercise id, so the media proxy can make
// a confident (non-fuzzy) match instead of guessing from the display name.
export const EX_SEARCH = {
  fb_legpress: "leg press", fb_latpull: "lat pulldown", fb_chestpress: "chest press",
  fb_row: "seated cable row", fb_shoulder: "dumbbell shoulder press", fb_plank: "plank",
  ua_incline: "dumbbell incline press", ua_latpull: "lat pulldown", ua_row: "seated cable row",
  ua_shoulder: "dumbbell shoulder press", ua_tri: "triceps pushdown", ua_curl: "dumbbell curl",
  ub_chest: "chest press", ub_pullup: "pull up", ub_csrow: "chest supported row",
  ub_lateral: "dumbbell lateral raise", ub_face: "face pull", ub_hammer: "hammer curl",
  la_legpress: "leg press", la_rdl: "romanian deadlift", la_curl: "leg curl",
  la_ext: "leg extension", la_calf: "calf raise", la_knee: "hanging knee raise",
  lb_goblet: "goblet squat", lb_hip: "hip thrust", lb_back: "back extension",
  lb_curl: "leg curl", lb_calf: "calf raise", lb_crunch: "cable crunch",
};
export function exSearch(id, fallback) { return EX_SEARCH[id] || fallback; }

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
  // Anatomical-adaptation / reintroduction day: light, full-body, high-rep,
  // technique + range-of-motion focus. Equipment-agnostic on purpose.
  prep: {
    label: "Foundation", tag: "Prime your body",
    ex: [
      { id: "prep_squat", name: "Bodyweight Squat", sets: "2 × 12–15", muscle: "Legs", cue: "Slow tempo, sit back, knees track over toes, full controlled depth." },
      { id: "prep_hinge", name: "Glute Bridge / Hip Hinge", sets: "2 × 12–15", muscle: "Hips / Hamstrings", cue: "Learn the hinge: hips back, flat back, squeeze glutes at the top." },
      { id: "prep_push", name: "Incline or Knee Push-up", sets: "2 × 10–12", muscle: "Chest / Triceps", cue: "Hands on a bench/wall to start. Body in a straight line, controlled." },
      { id: "prep_pull", name: "Inverted Row / Band Row", sets: "2 × 10–12", muscle: "Back", cue: "Use a table edge or band. Squeeze shoulder blades, no shrugging." },
      { id: "prep_core", name: "Plank", sets: "3 × 20–30 sec", muscle: "Core", cue: "Glutes tight, straight line, breathe." },
      { id: "prep_mobility", name: "Mobility Flow", sets: "5–8 min", muscle: "Full body", cue: "Cat-cow, hip openers, shoulder circles, ankle rocks. Easy and smooth." },
    ],
  },
};

// Goal-specific training tweaks layered on top of the base program.
export const GOAL_TRAINING = {
  fatloss: {
    focus: "Fat loss", restSec: 60, extraSets: 0, stepGoal: 11000,
    conditioning: [
      "Finish lifts with 10–15 min incline walk or easy cycle.",
      "On rest days, do 20–30 min Zone-2 cardio (can hold a conversation).",
      "Keep rests short (~60s) to keep the heart rate up.",
    ],
  },
  prime: {
    focus: "Recomposition", restSec: 90, extraSets: 0, stepGoal: 9000,
    conditioning: [
      "8–10 min easy cardio warm-up before lifting.",
      "Add 2–3 short conditioning finishers per week.",
      "Rest ~90s between your hard working sets.",
    ],
  },
  muscle: {
    focus: "Muscle gain", restSec: 120, extraSets: 1, stepGoal: 8000,
    conditioning: [
      "Prioritise heavy sets with full rest (~2 min).",
      "Keep cardio light — it's for recovery, not calorie burn.",
      "An extra set is added to each lift to push volume.",
    ],
  },
};
export function goalPlan(goal) { return GOAL_TRAINING[goal] || GOAL_TRAINING.prime; }

// Training experience → length of the ramp-up (anatomical adaptation) phase.
export const EXPERIENCE = {
  beginner: { label: "New to training", note: "Brand new or <3 months. 2-week foundation phase to build technique & condition your joints/tendons before full training.", prepWeeks: 2, prepLabel: "Foundation (Anatomical Adaptation)" },
  returning: { label: "Coming back after a break", note: "Trained before but off for a while. 1-week reintroduction at lighter loads to reawaken movement patterns and avoid bad soreness.", prepWeeks: 1, prepLabel: "Reintroduction" },
  active: { label: "Currently training", note: "Training consistently right now. Start the main program straight away.", prepWeeks: 0, prepLabel: "" },
};
export function prepWeeksFor(experience) { return (EXPERIENCE[experience] || EXPERIENCE.active).prepWeeks; }

// Where the user trains → which exercise variants we show.
export const EQUIPMENT = {
  gym: { label: "Full gym", note: "Machines, cables & dumbbells" },
  home: { label: "Home", note: "Dumbbells / resistance bands" },
  bodyweight: { label: "Bodyweight", note: "Calisthenics: push-ups, pull-ups, squats" },
};

// Per-exercise alternatives. h = home (dumbbell/band), b = bodyweight.
// gym uses the base exercise. Keeps the same id so logging/history carry over.
const EX_VARIANTS = {
  fb_legpress: { h: { name: "Goblet Squat", search: "goblet squat" }, b: { name: "Bodyweight Squat", search: "bodyweight squat", sets: "3 × 15–20" } },
  fb_latpull: { h: { name: "One-arm Dumbbell Row", search: "dumbbell row" }, b: { name: "Inverted Row", search: "inverted row" } },
  fb_chestpress: { h: { name: "Dumbbell Floor Press", search: "dumbbell floor press" }, b: { name: "Push-up", search: "push up", sets: "3 × AMRAP" } },
  fb_row: { h: { name: "Bent-over Dumbbell Row", search: "bent over dumbbell row" }, b: { name: "Inverted Row", search: "inverted row" } },
  fb_shoulder: { h: { name: "Dumbbell Shoulder Press", search: "dumbbell shoulder press" }, b: { name: "Pike Push-up", search: "pike push up" } },

  ua_incline: { h: { name: "Incline Dumbbell Press", search: "dumbbell incline press" }, b: { name: "Decline Push-up", search: "decline push up" } },
  ua_latpull: { h: { name: "One-arm Dumbbell Row", search: "dumbbell row" }, b: { name: "Pull-up", search: "pull up" } },
  ua_row: { h: { name: "Bent-over Dumbbell Row", search: "bent over dumbbell row" }, b: { name: "Inverted Row", search: "inverted row" } },
  ua_shoulder: { h: { name: "Dumbbell Shoulder Press", search: "dumbbell shoulder press" }, b: { name: "Pike Push-up", search: "pike push up" } },
  ua_tri: { h: { name: "Overhead DB Triceps Extension", search: "dumbbell triceps extension" }, b: { name: "Bench Dips", search: "bench dips" } },
  ua_curl: { h: { name: "Dumbbell Curl", search: "dumbbell curl" }, b: { name: "Chin-up", search: "chin up" } },

  ub_chest: { h: { name: "Dumbbell Floor Press", search: "dumbbell floor press" }, b: { name: "Push-up", search: "push up", sets: "3 × AMRAP" } },
  ub_pullup: { h: { name: "One-arm Dumbbell Row", search: "dumbbell row" }, b: { name: "Pull-up (or negatives)", search: "pull up" } },
  ub_csrow: { h: { name: "Bent-over Dumbbell Row", search: "bent over dumbbell row" }, b: { name: "Inverted Row", search: "inverted row" } },
  ub_lateral: { h: { name: "Dumbbell Lateral Raise", search: "dumbbell lateral raise" }, b: { name: "Lateral Raise (bottles)", search: "lateral raise" } },
  ub_face: { h: { name: "Band Face Pull", search: "band face pull" }, b: { name: "Prone Y-T-W Raise", search: "prone y raise" } },
  ub_hammer: { h: { name: "Hammer Curl", search: "hammer curl" }, b: { name: "Chin-up", search: "chin up" } },

  la_legpress: { h: { name: "Goblet Squat", search: "goblet squat" }, b: { name: "Bodyweight Squat", search: "bodyweight squat", sets: "3 × 15–20" } },
  la_rdl: { h: { name: "Dumbbell Romanian Deadlift", search: "dumbbell romanian deadlift" }, b: { name: "Single-leg Glute Bridge", search: "single leg glute bridge" } },
  la_curl: { h: { name: "Nordic Hamstring Curl", search: "nordic hamstring curl" }, b: { name: "Nordic / Slider Leg Curl", search: "nordic hamstring curl" } },
  la_ext: { h: { name: "Bulgarian Split Squat", search: "bulgarian split squat" }, b: { name: "Reverse Lunge", search: "reverse lunge" } },
  la_calf: { h: { name: "Dumbbell Calf Raise", search: "calf raise" }, b: { name: "Bodyweight Calf Raise", search: "calf raise" } },
  la_knee: { h: { name: "Lying Leg Raise", search: "lying leg raise" }, b: { name: "Lying Leg Raise", search: "lying leg raise" } },

  lb_goblet: { h: { name: "Goblet Squat", search: "goblet squat" }, b: { name: "Bodyweight Squat", search: "bodyweight squat", sets: "3 × 15–20" } },
  lb_hip: { h: { name: "Dumbbell Hip Thrust", search: "dumbbell hip thrust" }, b: { name: "Glute Bridge", search: "glute bridge" } },
  lb_back: { h: { name: "Superman", search: "superman exercise" }, b: { name: "Superman", search: "superman exercise" } },
  lb_curl: { h: { name: "Nordic Hamstring Curl", search: "nordic hamstring curl" }, b: { name: "Nordic / Slider Leg Curl", search: "nordic hamstring curl" } },
  lb_calf: { h: { name: "Dumbbell Calf Raise", search: "calf raise" }, b: { name: "Bodyweight Calf Raise", search: "calf raise" } },
  lb_crunch: { h: { name: "Weighted Crunch", search: "weighted crunch" }, b: { name: "Crunch", search: "crunch" } },
};

// Return the exercise to show for the user's equipment (keeps id + adds .search).
export function resolveExercise(e, equipment) {
  const baseSearch = EX_SEARCH[e.id] || e.name;
  if (!equipment || equipment === "gym" || e.id.startsWith("prep_")) return { ...e, search: baseSearch };
  const v = EX_VARIANTS[e.id] && EX_VARIANTS[e.id][equipment === "bodyweight" ? "b" : "h"];
  if (!v) return { ...e, search: baseSearch };
  return { ...e, name: v.name, sets: v.sets || e.sets, cue: v.cue || e.cue, search: v.search || v.name };
}

// Schedule with an optional ramp-up (prep) phase before the main 28-week plan.
export function getSchedule(startDate, date, daysBetween, opts = {}) {
  const prepWeeks = opts.prepWeeks || 0;
  const dss = daysBetween(startDate, date);
  if (dss < 0) return { dss, week: 0, phase: 0, workoutKey: null, rest: true, beforeStart: true, prep: false, weekLabel: "Starts soon" };
  const overallWeek = Math.floor(dss / 7) + 1;
  const dow = date.getDay();

  if (overallWeek <= prepWeeks) {
    const isTrain = dow === 1 || dow === 3 || dow === 5; // MWF
    return {
      dss, beforeStart: false, prep: true, phase: 0, week: 0,
      prepWeek: overallWeek, prepTotal: prepWeeks,
      workoutKey: isTrain ? "prep" : null, rest: !isTrain,
      weekLabel: `Foundation · Prep ${overallWeek}/${prepWeeks}`,
    };
  }

  const mainWeek = overallWeek - prepWeeks;
  const phase = mainWeek <= 4 ? 1 : 2;
  let workoutKey = null;
  if (phase === 1) { if (dow === 1 || dow === 3 || dow === 5) workoutKey = "fullbody"; }
  else if (dow === 1) workoutKey = "upperA";
  else if (dow === 4) workoutKey = "upperB";
  else if (dow === 2) workoutKey = "lowerA";
  else if (dow === 5) workoutKey = "lowerB";
  return { dss, beforeStart: false, prep: false, phase, week: mainWeek, workoutKey, rest: !workoutKey, weekLabel: `Week ${mainWeek}/28` };
}
