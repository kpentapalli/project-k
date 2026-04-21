-- ─────────────────────────────────────────
-- PROJECT K — Full Schema + RLS
-- Safe to re-run (idempotent)
-- ─────────────────────────────────────────

-- ── Tables ──────────────────────────────

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  role             text not null default 'user' check (role in ('admin', 'user')),
  goal             text check (goal in ('cut', 'bulk', 'maintain', 'athletic_performance')),
  experience       text check (experience in ('beginner', 'intermediate', 'advanced')),
  days_per_week    int  check (days_per_week between 3 and 6),
  equipment        text,
  limitations      text,
  weight_current   numeric,
  weight_target    numeric,
  intake_completed boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.programs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  duration_weeks int  not null,
  days_per_week  int  not null,
  goal_tag       text,
  difficulty     text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_active      boolean not null default true,
  structure      jsonb not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.program_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  program_id  uuid not null references public.programs(id),
  start_date  date not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  constraint program_assignments_user_id_unique unique (user_id)
);

create table if not exists public.workout_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  program_id    uuid not null references public.programs(id),
  week_index    int  not null,
  day_index     int  not null,
  day_title     text,
  muscle_groups text[],
  completed_at  timestamptz not null default now()
);

create table if not exists public.set_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  program_id     uuid not null references public.programs(id),
  week_index     int  not null,
  day_index      int  not null,
  group_index    int  not null,
  exercise_index int  not null,
  set_states     boolean[] not null default '{}',
  updated_at     timestamptz not null default now(),
  constraint set_logs_unique unique (user_id, program_id, week_index, day_index, group_index, exercise_index)
);

create table if not exists public.exercise_swaps (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  program_id     uuid not null references public.programs(id),
  week_index     int  not null,
  day_index      int  not null,
  group_index    int  not null,
  exercise_index int  not null,
  swap_name      text not null,
  constraint exercise_swaps_unique unique (user_id, program_id, week_index, day_index, group_index, exercise_index)
);


-- ── Auto-create profile on signup ───────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, intake_completed)
  values (new.id, 'user', false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── RLS ─────────────────────────────────

alter table public.profiles            enable row level security;
alter table public.programs            enable row level security;
alter table public.program_assignments enable row level security;
alter table public.workout_logs        enable row level security;
alter table public.set_logs            enable row level security;
alter table public.exercise_swaps      enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- profiles
drop policy if exists "users read own or admin reads all" on public.profiles;
create policy "users read own or admin reads all"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- programs
drop policy if exists "authenticated users read active programs" on public.programs;
create policy "authenticated users read active programs"
  on public.programs for select
  using (auth.uid() is not null and is_active = true);

drop policy if exists "admin manages programs" on public.programs;
create policy "admin manages programs"
  on public.programs for all
  using (public.is_admin());

-- program_assignments
drop policy if exists "users read own assignment" on public.program_assignments;
create policy "users read own assignment"
  on public.program_assignments for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin manages assignments" on public.program_assignments;
create policy "admin manages assignments"
  on public.program_assignments for insert
  with check (public.is_admin());

drop policy if exists "admin updates assignments" on public.program_assignments;
create policy "admin updates assignments"
  on public.program_assignments for update
  using (public.is_admin());

drop policy if exists "admin deletes assignments" on public.program_assignments;
create policy "admin deletes assignments"
  on public.program_assignments for delete
  using (public.is_admin());

-- workout_logs
drop policy if exists "users manage own workout logs" on public.workout_logs;
create policy "users manage own workout logs"
  on public.workout_logs for all
  using (user_id = auth.uid());

drop policy if exists "admin reads all workout logs" on public.workout_logs;
create policy "admin reads all workout logs"
  on public.workout_logs for select
  using (public.is_admin());

-- set_logs
drop policy if exists "users manage own set logs" on public.set_logs;
create policy "users manage own set logs"
  on public.set_logs for all
  using (user_id = auth.uid());

-- exercise_swaps
drop policy if exists "users manage own swaps" on public.exercise_swaps;
create policy "users manage own swaps"
  on public.exercise_swaps for all
  using (user_id = auth.uid());


-- ── After running this: ──────────────────
-- 1. Sign up via the app
-- 2. Promote yourself to admin:
--    update public.profiles set role = 'admin' where id = '<your-user-id>';
-- 3. Programs are already seeded (seed.js already ran successfully)
