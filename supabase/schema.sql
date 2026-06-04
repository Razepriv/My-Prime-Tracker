-- ============================================================
--  PRIME Tracker — database schema
--  Run this once in Supabase: Dashboard -> SQL Editor -> New query
--  -> paste this whole file -> Run.
-- ============================================================

-- One simple table holds everything, keyed per user.
create table if not exists public.user_data (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  value      jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- Turn on Row Level Security so each user can ONLY touch their own rows.
alter table public.user_data enable row level security;

-- Drop old policies if re-running, then recreate.
drop policy if exists "select own rows" on public.user_data;
drop policy if exists "insert own rows" on public.user_data;
drop policy if exists "update own rows" on public.user_data;
drop policy if exists "delete own rows" on public.user_data;

create policy "select own rows" on public.user_data
  for select using (auth.uid() = user_id);

create policy "insert own rows" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "update own rows" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own rows" on public.user_data
  for delete using (auth.uid() = user_id);

-- ============================================================
--  STORAGE — progress photos
--  A private bucket "progress". Each user can only read/write files
--  inside a folder named after their own user id (e.g. <uid>/photo.jpg).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('progress', 'progress', false)
on conflict (id) do nothing;

drop policy if exists "progress read own"   on storage.objects;
drop policy if exists "progress insert own" on storage.objects;
drop policy if exists "progress delete own" on storage.objects;

create policy "progress read own" on storage.objects
  for select using (
    bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "progress insert own" on storage.objects
  for insert with check (
    bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "progress delete own" on storage.objects
  for delete using (
    bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
--  COMMUNITY — shared recipes (the creator layer)
--  Anyone signed in can read the catalog; you can only write your own rows.
-- ============================================================

create table if not exists public.shared_foods (
  id         uuid        primary key default gen_random_uuid(),
  author     uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  kcal       int,
  protein    int,
  carbs      int,
  fat        int,
  region     text,
  diet       text,
  recipe     jsonb,
  created_at timestamptz default now()
);

alter table public.shared_foods enable row level security;

drop policy if exists "shared read"       on public.shared_foods;
drop policy if exists "shared insert own" on public.shared_foods;
drop policy if exists "shared update own" on public.shared_foods;
drop policy if exists "shared delete own" on public.shared_foods;

create policy "shared read"       on public.shared_foods for select using (true);
create policy "shared insert own" on public.shared_foods for insert with check (auth.uid() = author);
create policy "shared update own" on public.shared_foods for update using (auth.uid() = author) with check (auth.uid() = author);
create policy "shared delete own" on public.shared_foods for delete using (auth.uid() = author);
