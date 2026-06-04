# PRIME Tracker — your hosted fitness web app

A personal 28-week transformation tracker. Log workouts, meals, steps, water,
sleep, and weight. Each account's data is private and saved in a real database.

**Stack (all free tiers):** Next.js · Supabase (login + database) · Vercel (hosting)

You do **not** need to write any code. You only:
1. Create 3 free accounts (GitHub, Supabase, Vercel)
2. Run one SQL script
3. Paste in 2 keys
4. Click deploy

Takes about 20–30 minutes the first time.

---

## What's inside

- **Personalised onboarding** — sex, age, height, weight, goal (lose fat / reach
  your prime / build muscle), activity level, country & cuisine, diet preference.
  Everything is editable later in **Profile & Settings**.
- **Calorie + macro engine** — your daily calorie and protein/carb/fat targets are
  auto-calculated (Mifflin–St Jeor BMR → TDEE → goal adjustment) and tracked live.
- **Diet plans with recipes** — Indian North/South, veg & non-veg meal suggestions.
  Tap any meal for the full recipe, ingredients and calories; one tap logs it.
- **Workout plans with demo videos** — a 28-week progressive program; every
  exercise has a target muscle, coaching cue and a **Watch demo** form video.
- **Trackers** — calories, protein/carbs/fat, steps, water, sleep, weight, lifts.
- **Progress photos** — upload weekly photos (stored privately in Supabase Storage)
  plus a weight trend chart, BMI, streaks and a completion calendar.

> The SQL script (`supabase/schema.sql`) also creates a private **`progress`**
> storage bucket for photos. If you set the project up earlier, just **re-run the
> script** to add it.

### Optional integrations (server-side env vars)

Both are optional — the app works without them and degrades gracefully.

| Variable | Enables | Where to get it |
|----------|---------|-----------------|
| `RAPIDAPI_KEY` | Real exercise **GIFs + videos** on the Workout screen (else a YouTube demo link is used) | RapidAPI → *ExerciseDB / EDB with videos and images by AscendAPI* |
| `GROQ_API_KEY` | The **AI coach** (weekly check-ins, meal ideas, plateau help) | https://console.groq.com/keys |

Add them in **Vercel → Project → Settings → Environment Variables** (NOT prefixed
with `NEXT_PUBLIC` — they stay server-side) and redeploy. Optional model override:
`GROQ_MODEL` (default `llama-3.3-70b-versatile`).

---

## STEP 1 — Put this code on GitHub

1. Create a free account at https://github.com
2. Click **New repository** → name it `prime-tracker` → **Private** → **Create**.
3. Easiest upload method: on the new repo page click **uploading an existing file**,
   then drag in **all the files from this folder** (everything except the
   `node_modules` and `.next` folders — those are not included in the zip anyway).
   Make sure you keep the folder structure (`app/`, `components/`, `lib/`, `supabase/`).
4. Click **Commit changes**.

> Tip: if you know `git`, you can instead run `git init`, `git add .`,
> `git commit -m "init"`, and push to the repo.

---

## STEP 2 — Set up Supabase (login + database)

1. Create a free account at https://supabase.com → **New project**.
   - Pick any name, set a database password (save it somewhere), choose the
     region closest to you (e.g. **Mumbai / South Asia**). Wait ~2 min for it to spin up.
2. In the left sidebar open **SQL Editor** → **New query**.
3. Open the file `supabase/schema.sql` from this project, copy its entire contents,
   paste into the editor, and click **Run**. You should see "Success".
   (This creates the data table and the security rules so each user only sees
   their own data.)
4. **Make sign-up instant (recommended for personal use):**
   Go to **Authentication → Sign In / Up** (or **Providers → Email**) and turn
   **OFF** "Confirm email". Now signing up logs you straight in with no email step.
   (If you leave it ON, you'll get a confirmation email before you can sign in.)
5. Get your keys: **Project Settings (gear) → API**. Copy these two values:
   - **Project URL**  → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key  → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   The `anon` key is safe to expose in a browser app — your data is protected by
   the security rules from step 3, not by hiding this key.

---

## STEP 3 — Deploy on Vercel

1. Create a free account at https://vercel.com — choose **Continue with GitHub**.
2. Click **Add New… → Project**, find your `prime-tracker` repo, click **Import**.
3. Before clicking Deploy, open **Environment Variables** and add the two keys
   from Supabase step 5:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |

4. Click **Deploy**. Wait ~1–2 minutes.
5. Open the live URL Vercel gives you (something like
   `https://prime-tracker-xxxx.vercel.app`).
6. **Create your account**, fill in the welcome screen, and start tracking.

> If you ever see an "Almost there" screen asking for keys, it means the two
> environment variables aren't set on Vercel. Add them under
> **Project → Settings → Environment Variables**, then **Redeploy**.

---

## Add it to your phone home screen (feels like a real app)

- **iPhone (Safari):** open the Vercel URL → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the URL → ⋮ menu → **Add to Home screen**.

---

## Run it on your computer first (optional)

If you want to test locally before deploying:

```bash
# install Node.js 18+ first, then in this folder:
cp .env.local.example .env.local
# edit .env.local and paste your two Supabase keys
npm install
npm run dev
# open http://localhost:3000
```

---

## Your data & privacy

- Every account only ever sees its own data — enforced by Postgres Row Level
  Security (the policies in `schema.sql`).
- All progress is stored in your Supabase database, so it's the same on your
  phone, laptop, anywhere you log in.
- Free tiers are generous and fine for personal use. Supabase pauses a project
  after long inactivity — just open the dashboard to wake it.

## Want to add Google login later?

In Supabase: **Authentication → Providers → Google**, enable it and follow their
short setup. Then I can add a "Continue with Google" button to the login screen.

---

Discipline today. Strength tomorrow. PRIME forever.
