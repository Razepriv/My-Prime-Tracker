// Achievement definitions. Each `test(stats)` returns true when unlocked.
// stats is computed in the app from the user's live data.
export const ACHIEVEMENTS = [
  { id: "first_day", title: "Day One", desc: "Completed your first day.", test: (s) => s.daysDone >= 1 },
  { id: "streak_3", title: "On a Roll", desc: "3-day streak.", test: (s) => s.streak >= 3 },
  { id: "streak_7", title: "One Week Strong", desc: "7-day streak.", test: (s) => s.streak >= 7 },
  { id: "streak_30", title: "Unstoppable", desc: "30-day streak.", test: (s) => s.streak >= 30 },
  { id: "days_10", title: "Committed", desc: "10 days completed.", test: (s) => s.daysDone >= 10 },
  { id: "days_50", title: "Half Century", desc: "50 days completed.", test: (s) => s.daysDone >= 50 },
  { id: "prep_done", title: "Foundation Built", desc: "Finished your ramp-up phase.", test: (s) => s.prepDone },
  { id: "protein_hit", title: "Protein Pro", desc: "Hit your protein target.", test: (s) => s.proteinHit },
  { id: "steps_hit", title: "Step Master", desc: "Hit your step goal.", test: (s) => s.stepsHit },
  { id: "move_2", title: "First 2 kg", desc: "Moved 2 kg toward your goal.", test: (s) => s.towardKg >= 2 },
  { id: "move_5", title: "Five Down", desc: "5 kg toward your goal.", test: (s) => s.towardKg >= 5 },
  { id: "goal_hit", title: "PRIME Achieved", desc: "Reached your goal weight!", test: (s) => s.goalHit },
];

export function evaluate(stats) {
  return ACHIEVEMENTS.filter((a) => { try { return !!a.test(stats); } catch (e) { return false; } }).map((a) => a.id);
}
export function meta(id) { return ACHIEVEMENTS.find((a) => a.id === id); }
