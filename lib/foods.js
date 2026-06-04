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
];

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
