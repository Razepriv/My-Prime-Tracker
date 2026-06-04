// Indian food + recipe database. Each item carries nutrition per serving and a
// real recipe (ingredients + steps). Filterable by region (north/south) and
// diet (veg/nonveg). `meal` buckets it into the daily plan.
//
// kcal/protein/carbs/fat are per the stated `serving`.

export const FOODS = [
  // ---------------- SOUTH · VEG ----------------
  {
    id: "idli_sambar", name: "Idli + Sambar", region: "south", diet: "veg", meal: "breakfast",
    serving: "3 idli + 1 bowl sambar", kcal: 320, protein: 12, carbs: 58, fat: 4,
    ingredients: ["3 steamed idli", "1 cup sambar (toor dal + veg)", "1 tsp ghee", "Coconut chutney (small)"],
    recipe: [
      "Steam fermented idli batter in moulds 10–12 min until springy.",
      "Pressure-cook toor dal; temper with mustard, curry leaves, sambar powder and mixed veg.",
      "Simmer 5 min, finish with tamarind. Serve idli with sambar + chutney.",
    ],
  },
  {
    id: "masala_dosa", name: "Masala Dosa", region: "south", diet: "veg", meal: "breakfast",
    serving: "1 dosa + potato masala", kcal: 387, protein: 8, carbs: 62, fat: 12,
    ingredients: ["1 ladle dosa batter", "Boiled potato", "Onion, green chilli, mustard, turmeric", "1 tbsp oil"],
    recipe: [
      "Sauté mustard, curry leaves, onion, chilli; add turmeric + mashed potato, salt.",
      "Spread batter thin on a hot tawa, drizzle oil, crisp the edges.",
      "Place masala inside, fold and serve with chutney + sambar.",
    ],
  },
  {
    id: "curd_rice", name: "Curd Rice", region: "south", diet: "veg", meal: "lunch",
    serving: "1 large bowl", kcal: 330, protein: 11, carbs: 52, fat: 8,
    ingredients: ["1 cup cooked rice", "1 cup curd", "Mustard, urad dal, curry leaves", "Ginger, green chilli"],
    recipe: [
      "Mash warm rice lightly, cool, then fold in curd + a splash of milk and salt.",
      "Temper mustard, urad dal, curry leaves, ginger, chilli in 1 tsp oil.",
      "Stir tempering through. Garnish with pomegranate or grated carrot.",
    ],
  },
  {
    id: "sambar_rice", name: "Sambar Rice + Veg", region: "south", diet: "veg", meal: "lunch",
    serving: "1 plate", kcal: 480, protein: 16, carbs: 78, fat: 10,
    ingredients: ["1 cup rice", "1.5 cups sambar (extra dal)", "Mixed vegetables", "1 tsp ghee", "Salad + curd"],
    recipe: [
      "Cook rice. Make a thick, dal-heavy sambar with drumstick, pumpkin, carrot.",
      "Mix sambar into rice with a tsp of ghee.",
      "Serve with a side salad and a small bowl of curd for extra protein.",
    ],
  },

  // ---------------- SOUTH · NONVEG ----------------
  {
    id: "egg_dosa", name: "Egg Dosa", region: "south", diet: "nonveg", meal: "breakfast",
    serving: "1 dosa + 2 eggs", kcal: 360, protein: 20, carbs: 34, fat: 16,
    ingredients: ["1 ladle dosa batter", "2 eggs", "Onion, chilli, coriander", "1 tsp oil"],
    recipe: [
      "Spread dosa batter on hot tawa.",
      "Crack 2 eggs on top, spread, sprinkle onion–chilli–coriander.",
      "Drizzle oil, cook till set, fold and serve with chutney.",
    ],
  },
  {
    id: "chettinad_chicken_rice", name: "Chettinad Chicken + Rice", region: "south", diet: "nonveg", meal: "lunch",
    serving: "150g chicken + 1 cup rice", kcal: 520, protein: 42, carbs: 60, fat: 14,
    ingredients: ["150g chicken", "Chettinad masala (pepper, fennel, coconut)", "Onion–tomato base", "1 cup rice"],
    recipe: [
      "Roast and grind pepper, fennel, coriander, dry coconut for masala.",
      "Cook onion–tomato base, add chicken + masala, simmer till tender.",
      "Serve 150g portion with 1 cup rice and salad.",
    ],
  },
  {
    id: "fish_curry_rice", name: "Fish Curry + Rice", region: "south", diet: "nonveg", meal: "dinner",
    serving: "150g fish + millet/rice", kcal: 430, protein: 38, carbs: 40, fat: 14,
    ingredients: ["150g fish (seer/king)", "Tamarind, coconut, chilli", "Curry leaves", "Small rice or 2 millet rotis"],
    recipe: [
      "Make a tangy coconut–tamarind gravy with curry leaves.",
      "Slide in fish pieces, simmer gently 8–10 min (don't break them).",
      "Serve with a small portion of rice or 2 millet rotis + sautéed greens.",
    ],
  },

  // ---------------- NORTH · VEG ----------------
  {
    id: "paneer_paratha", name: "Paneer Paratha + Curd", region: "north", diet: "veg", meal: "breakfast",
    serving: "1 paratha + curd", kcal: 380, protein: 18, carbs: 42, fat: 16,
    ingredients: ["1 whole-wheat paratha", "60g paneer", "Onion, chilli, coriander", "1 bowl curd", "½ tsp oil"],
    recipe: [
      "Crumble paneer with onion, chilli, coriander, salt.",
      "Stuff into wheat dough, roll, and cook on tawa with minimal oil.",
      "Serve hot with a big bowl of curd.",
    ],
  },
  {
    id: "rajma_chawal", name: "Rajma Chawal", region: "north", diet: "veg", meal: "lunch",
    serving: "1.5 cup rajma + 1 cup rice", kcal: 490, protein: 19, carbs: 84, fat: 8,
    ingredients: ["1 cup soaked rajma", "Onion–tomato–ginger–garlic", "Rajma masala", "1 cup rice"],
    recipe: [
      "Pressure-cook soaked rajma till soft.",
      "Make onion–tomato gravy with ginger–garlic + masala; add rajma, simmer 10 min.",
      "Serve over rice with onion–lemon salad.",
    ],
  },
  {
    id: "dal_roti_sabzi", name: "Dal + Roti + Sabzi", region: "north", diet: "veg", meal: "dinner",
    serving: "1.5 cup dal + 2 phulka", kcal: 420, protein: 20, carbs: 58, fat: 10,
    ingredients: ["1.5 cups dal (moong/toor)", "2 phulka (no oil)", "Low-oil sabzi", "Salad + small curd"],
    recipe: [
      "Cook dal, temper with cumin, garlic, hing, chilli.",
      "Make a dry low-oil sabzi (bhindi/lauki/mixed veg).",
      "Serve with 2 phulka, salad and a small curd.",
    ],
  },
  {
    id: "chole", name: "Chole (Chickpea Curry)", region: "north", diet: "veg", meal: "lunch",
    serving: "1.5 cup chole + 2 roti", kcal: 510, protein: 21, carbs: 80, fat: 12,
    ingredients: ["1 cup soaked chana", "Onion–tomato gravy", "Chole masala, tea-bag for colour", "2 roti"],
    recipe: [
      "Pressure-cook chana with a tea bag for deep colour.",
      "Cook spicy onion–tomato gravy with chole masala; add chana + water, simmer.",
      "Serve with 2 roti and sliced onions.",
    ],
  },

  // ---------------- NORTH · NONVEG ----------------
  {
    id: "egg_bhurji_paratha", name: "Egg Bhurji + Paratha", region: "north", diet: "nonveg", meal: "breakfast",
    serving: "3 eggs + 1 paratha", kcal: 420, protein: 24, carbs: 34, fat: 22,
    ingredients: ["3 eggs", "Onion, tomato, chilli", "1 wheat paratha", "1 tsp oil"],
    recipe: [
      "Sauté onion, tomato, green chilli; pour beaten eggs.",
      "Scramble on medium heat, season with turmeric, salt, coriander.",
      "Serve with one wheat paratha.",
    ],
  },
  {
    id: "chicken_curry_roti", name: "Chicken Curry + Roti", region: "north", diet: "nonveg", meal: "lunch",
    serving: "150g chicken + 2–3 roti", kcal: 540, protein: 45, carbs: 52, fat: 16,
    ingredients: ["150g chicken", "Onion–tomato–ginger–garlic", "Garam masala", "2–3 ragi/jowar roti", "Salad"],
    recipe: [
      "Brown onions, add ginger–garlic, tomato and masala into a thick gravy.",
      "Add chicken, cook covered till tender; finish with garam masala.",
      "Serve 150g portion with 2–3 millet rotis and salad.",
    ],
  },
  {
    id: "tandoori_chicken", name: "Tandoori Chicken + Salad", region: "north", diet: "nonveg", meal: "dinner",
    serving: "200g chicken + salad", kcal: 380, protein: 50, carbs: 10, fat: 16,
    ingredients: ["200g chicken (skinless)", "Curd, lemon, ginger–garlic", "Tandoori masala", "Big salad"],
    recipe: [
      "Marinate chicken in curd, lemon, ginger–garlic and tandoori masala 2+ hrs.",
      "Grill / air-fry / bake till charred and cooked through.",
      "Serve with a large salad and mint–curd chutney.",
    ],
  },
  {
    id: "keema_matar", name: "Keema Matar + Phulka", region: "north", diet: "nonveg", meal: "dinner",
    serving: "150g keema + 2 phulka", kcal: 460, protein: 38, carbs: 38, fat: 18,
    ingredients: ["150g lean mutton/chicken keema", "Peas", "Onion–tomato masala", "2 phulka"],
    recipe: [
      "Sauté onion–tomato–ginger–garlic with masala.",
      "Add keema and peas, cook till browned and dry.",
      "Serve with 2 phulka and salad.",
    ],
  },

  // ---------------- ANY · SNACKS (both diets) ----------------
  {
    id: "sprouts_chaat", name: "Sprouts Chaat", region: "any", diet: "veg", meal: "snack",
    serving: "1 bowl", kcal: 180, protein: 12, carbs: 26, fat: 3,
    ingredients: ["1 cup boiled moong sprouts", "Onion, tomato, cucumber", "Lemon, chaat masala"],
    recipe: ["Steam sprouts 5 min.", "Toss with chopped veg, lemon, chaat masala, coriander."],
  },
  {
    id: "roasted_chana", name: "Roasted Chana Bowl", region: "any", diet: "veg", meal: "snack",
    serving: "50g", kcal: 190, protein: 13, carbs: 30, fat: 3,
    ingredients: ["50g roasted chana", "Onion, chilli, lemon"],
    recipe: ["Toss roasted chana with chopped onion, chilli, lemon and salt."],
  },
  {
    id: "whey_milk", name: "Whey + Milk", region: "any", diet: "veg", meal: "snack",
    serving: "1 scoop + 250ml", kcal: 250, protein: 32, carbs: 16, fat: 6,
    ingredients: ["1 scoop whey", "250ml toned milk"],
    recipe: ["Blend/shake whey with milk. Have post-workout or as an evening snack."],
  },
  {
    id: "boiled_eggs", name: "Boiled Eggs + Sprouts", region: "any", diet: "nonveg", meal: "snack",
    serving: "3 eggs + sprouts", kcal: 260, protein: 22, carbs: 12, fat: 14,
    ingredients: ["3 boiled eggs", "½ cup sprouts", "Black pepper, salt, lemon"],
    recipe: ["Boil eggs 8 min.", "Serve with seasoned sprouts, pepper and lemon."],
  },
  {
    id: "soya_stirfry", name: "Soya Chunks Stir-fry", region: "any", diet: "veg", meal: "snack",
    serving: "50g dry soya", kcal: 230, protein: 26, carbs: 18, fat: 6,
    ingredients: ["50g soya chunks", "Onion, capsicum, chilli", "1 tsp oil, soy sauce"],
    recipe: ["Boil soya 5 min, squeeze dry.", "Stir-fry with veg, chilli and a splash of soy sauce."],
  },

  // ---------------- MORE BREAKFASTS ----------------
  {
    id: "oats_milk", name: "Masala Oats + Milk", region: "any", diet: "veg", meal: "breakfast",
    serving: "50g oats + 200ml milk", kcal: 330, protein: 16, carbs: 48, fat: 8,
    ingredients: ["50g rolled oats", "200ml toned milk", "Veg + light masala (optional)"],
    recipe: ["Cook oats in milk/water 4–5 min.", "Stir in sautéed veg and a pinch of masala, or keep it sweet with fruit."],
  },
  {
    id: "poha", name: "Veg Poha", region: "north", diet: "veg", meal: "breakfast",
    serving: "1 plate + peanuts", kcal: 300, protein: 8, carbs: 50, fat: 8,
    ingredients: ["1.5 cups flattened rice", "Onion, peas, peanuts", "Mustard, curry leaves, turmeric", "Lemon"],
    recipe: ["Rinse poha, drain.", "Temper mustard, curry leaves, onion, peas, peanuts, turmeric.", "Fold in poha, finish with lemon."],
  },
  {
    id: "upma", name: "Vegetable Upma", region: "south", diet: "veg", meal: "breakfast",
    serving: "1 bowl", kcal: 290, protein: 8, carbs: 46, fat: 8,
    ingredients: ["1 cup roasted rava", "Mixed veg", "Mustard, urad dal, curry leaves", "1 tsp ghee"],
    recipe: ["Temper mustard, urad dal, curry leaves, veg.", "Add 2 cups water, salt; rain in rava stirring.", "Cook covered 3–4 min, finish with ghee."],
  },
  {
    id: "ragi_dosa", name: "Ragi Dosa + Chutney", region: "south", diet: "veg", meal: "breakfast",
    serving: "2 dosa + chutney", kcal: 310, protein: 10, carbs: 52, fat: 7,
    ingredients: ["Ragi + rice batter", "Coconut chutney", "1 tsp oil"],
    recipe: ["Spread thin batter on hot tawa, crisp edges.", "Serve with coconut chutney."],
  },
  {
    id: "aloo_paratha", name: "Aloo Paratha + Curd", region: "north", diet: "veg", meal: "breakfast",
    serving: "1 paratha + curd", kcal: 360, protein: 10, carbs: 54, fat: 12,
    ingredients: ["1 wheat paratha", "Spiced mashed potato", "1 bowl curd", "½ tsp oil"],
    recipe: ["Stuff spiced potato into dough, roll.", "Cook on tawa with minimal oil.", "Serve with curd."],
  },

  // ---------------- MORE LUNCH / DINNER ----------------
  {
    id: "dal_khichdi", name: "Moong Dal Khichdi", region: "north", diet: "veg", meal: "dinner",
    serving: "1 bowl + curd", kcal: 380, protein: 16, carbs: 60, fat: 8,
    ingredients: ["½ cup rice", "½ cup moong dal", "Cumin, ghee, veg", "Curd"],
    recipe: ["Pressure-cook rice + dal + veg with turmeric.", "Temper cumin in ghee, mix in.", "Serve with curd."],
  },
  {
    id: "veg_pulao", name: "Veg Pulao + Raita", region: "north", diet: "veg", meal: "lunch",
    serving: "1 plate + raita", kcal: 430, protein: 12, carbs: 70, fat: 12,
    ingredients: ["1 cup rice", "Mixed veg", "Whole spices", "Curd raita"],
    recipe: ["Sauté whole spices + veg.", "Add rice + water, cook fluffy.", "Serve with curd raita."],
  },
  {
    id: "palak_paneer", name: "Palak Paneer + Roti", region: "north", diet: "veg", meal: "dinner",
    serving: "1 bowl + 2 roti", kcal: 460, protein: 22, carbs: 40, fat: 22,
    ingredients: ["100g paneer", "Spinach purée", "Onion, garlic, spices", "2 roti"],
    recipe: ["Blanch and purée spinach.", "Cook onion–garlic base, add purée + paneer cubes.", "Serve with 2 roti."],
  },
  {
    id: "veg_biryani", name: "Veg Biryani + Raita", region: "south", diet: "veg", meal: "lunch",
    serving: "1 plate + raita", kcal: 520, protein: 13, carbs: 82, fat: 15,
    ingredients: ["1 cup basmati", "Mixed veg", "Biryani masala, mint", "Raita"],
    recipe: ["Par-boil rice with whole spices.", "Layer with masala veg + mint, dum-cook 15 min.", "Serve with raita."],
  },
  {
    id: "egg_curry_rice", name: "Egg Curry + Rice", region: "south", diet: "nonveg", meal: "lunch",
    serving: "3 eggs + 1 cup rice", kcal: 520, protein: 28, carbs: 60, fat: 20,
    ingredients: ["3 boiled eggs", "Onion–tomato–coconut gravy", "1 cup rice"],
    recipe: ["Make a spiced onion–tomato (coconut) gravy.", "Add halved boiled eggs, simmer 5 min.", "Serve with rice."],
  },
  {
    id: "chicken_biryani", name: "Chicken Biryani", region: "north", diet: "nonveg", meal: "lunch",
    serving: "1 plate (150g chicken)", kcal: 600, protein: 38, carbs: 72, fat: 18,
    ingredients: ["150g chicken", "1 cup basmati", "Curd, biryani masala, mint", "Fried onions"],
    recipe: ["Marinate chicken in curd + masala.", "Par-boil rice; layer with chicken, mint, onions.", "Dum-cook 20 min."],
  },
  {
    id: "prawn_masala", name: "Prawn Masala + Rice", region: "south", diet: "nonveg", meal: "dinner",
    serving: "150g prawns + small rice", kcal: 410, protein: 36, carbs: 38, fat: 12,
    ingredients: ["150g prawns", "Coconut–chilli masala", "Curry leaves", "Small rice portion"],
    recipe: ["Sauté prawns with curry leaves + masala 5–6 min.", "Serve with a small portion of rice + greens."],
  },
  {
    id: "grilled_chicken_salad", name: "Grilled Chicken Salad", region: "any", diet: "nonveg", meal: "lunch",
    serving: "180g chicken + big salad", kcal: 360, protein: 48, carbs: 14, fat: 12,
    ingredients: ["180g chicken breast", "Greens, cucumber, tomato", "Olive oil + lemon, herbs"],
    recipe: ["Season and grill chicken, slice.", "Toss greens with oil–lemon, top with chicken."],
  },

  // ---------------- MORE SNACKS / STAPLES ----------------
  { id: "banana", name: "Banana (2)", region: "any", diet: "veg", meal: "snack", serving: "2 medium", kcal: 210, protein: 3, carbs: 54, fat: 1, ingredients: ["2 bananas"], recipe: ["Peel and eat — great pre/post-workout carbs."] },
  { id: "curd_bowl", name: "Curd / Greek Yogurt Bowl", region: "any", diet: "veg", meal: "snack", serving: "200g", kcal: 180, protein: 18, carbs: 14, fat: 6, ingredients: ["200g thick curd / Greek yogurt", "Fruit / seeds (optional)"], recipe: ["Top curd with fruit or seeds."] },
  { id: "peanut_toast", name: "Peanut Butter Toast", region: "any", diet: "veg", meal: "snack", serving: "2 slices", kcal: 280, protein: 12, carbs: 30, fat: 13, ingredients: ["2 whole-wheat slices", "1.5 tbsp peanut butter"], recipe: ["Toast bread, spread peanut butter."] },
  { id: "almonds", name: "Almonds (handful)", region: "any", diet: "veg", meal: "snack", serving: "30g", kcal: 175, protein: 6, carbs: 6, fat: 15, ingredients: ["30g almonds"], recipe: ["Eat a small handful — soak overnight if you prefer."] },
  { id: "buttermilk", name: "Spiced Buttermilk", region: "south", diet: "veg", meal: "snack", serving: "1 glass", kcal: 90, protein: 5, carbs: 8, fat: 3, ingredients: ["Curd + water", "Ginger, curry leaves, cumin, salt"], recipe: ["Blend curd with water + spices. Chill and serve."] },
  { id: "fruit_bowl", name: "Mixed Fruit Bowl", region: "any", diet: "veg", meal: "snack", serving: "1 bowl", kcal: 150, protein: 2, carbs: 38, fat: 1, ingredients: ["Seasonal fruit", "Lemon, chaat masala (optional)"], recipe: ["Chop fruit, sprinkle lemon + chaat masala."] },
];

// All foods whose name matches a query (used by the Diet search box).
export function searchFoods(q) {
  const s = (q || "").trim().toLowerCase();
  if (!s) return [];
  return FOODS.filter((f) => f.name.toLowerCase().includes(s)).slice(0, 20);
}

export const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];
export const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" };

// Foods that fit a user's region + diet preference.
export function filterFoods(region, diet) {
  return FOODS.filter((f) => {
    const regOk = region === "any" || f.region === "any" || f.region === region;
    const dietOk = diet === "both" || f.diet === diet || (diet === "nonveg" && f.diet === "veg");
    return regOk && dietOk;
  });
}

// Build a suggested plan: one (or for snack, one) item per meal slot.
export function buildPlan(region, diet) {
  const pool = filterFoods(region, diet);
  const plan = {};
  for (const slot of MEAL_ORDER) {
    const opts = pool.filter((f) => f.meal === slot);
    if (opts.length) plan[slot] = opts;
  }
  return plan;
}

export function foodById(id) { return FOODS.find((f) => f.id === id) || null; }

// Suggest foods to fill the calories you have LEFT today, biased to protein.
export function fillRemaining(region, diet, kcalLeft, proteinLeft) {
  if (!kcalLeft || kcalLeft < 150) return { items: [], totals: sumLog([]) };
  const pool = filterFoods(region, diet).slice().sort((a, b) => (b.protein / Math.max(1, b.kcal)) - (a.protein / Math.max(1, a.kcal)));
  const items = [];
  let acc = 0;
  for (const f of pool) {
    if (items.length >= 4) break;
    if (acc + f.kcal <= kcalLeft + 120) { items.push({ ...f, qty: 1, slot: f.meal }); acc += f.kcal; }
    if (acc >= kcalLeft - 80) break;
  }
  return { items, totals: sumLog(items) };
}

// Auto-assemble a day (breakfast/lunch/snack/dinner) aiming at the calorie
// target, biased toward protein. Picks one food per slot, scaling qty 1–2.
const SLOT_WEIGHTS = { breakfast: 0.27, lunch: 0.35, snack: 0.1, dinner: 0.28 };
export function composePlan(region, diet, targetKcal = 2000, targetProtein = 140) {
  const pool = filterFoods(region, diet);
  const items = [];
  for (const slot of MEAL_ORDER) {
    const opts = pool.filter((f) => f.meal === slot);
    if (!opts.length) continue;
    const slotKcal = targetKcal * (SLOT_WEIGHTS[slot] || 0.25);
    const maxQty = slot === "snack" ? 1 : 2;
    let best = null, bestScore = Infinity;
    for (const f of opts) {
      for (let qty = 1; qty <= maxQty; qty++) {
        // closeness to the slot's calorie share, rewarded for protein density
        const score = Math.abs(f.kcal * qty - slotKcal) - f.protein * qty * 1.5;
        if (score < bestScore) { bestScore = score; best = { ...f, qty, slot }; }
      }
    }
    if (best) items.push(best);
  }
  const totals = sumLog(items);
  return { items, totals };
}

export function sumLog(logItems) {
  return (logItems || []).reduce(
    (a, it) => ({
      kcal: a.kcal + (it.kcal || 0) * (it.qty || 1),
      protein: a.protein + (it.protein || 0) * (it.qty || 1),
      carbs: a.carbs + (it.carbs || 0) * (it.qty || 1),
      fat: a.fat + (it.fat || 0) * (it.qty || 1),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
