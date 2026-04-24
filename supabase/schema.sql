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


create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  weight     numeric not null,
  body_fat   numeric,
  logged_at  date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.weight_logs enable row level security;

drop policy if exists "users manage own weight logs" on public.weight_logs;
create policy "users manage own weight logs"
  on public.weight_logs for all
  using (user_id = auth.uid());

drop policy if exists "admin reads all weight logs" on public.weight_logs;
create policy "admin reads all weight logs"
  on public.weight_logs for select
  using (public.is_admin());


create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  user_name  text,
  message    text not null,
  rating     int check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "users can insert feedback" on public.feedback;
create policy "users can insert feedback"
  on public.feedback for insert
  with check (auth.uid() is not null);

drop policy if exists "admin reads all feedback" on public.feedback;
create policy "admin reads all feedback"
  on public.feedback for select
  using (public.is_admin());

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


-- access_requests (public sign-up flow)
create table if not exists public.access_requests (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.access_requests enable row level security;

drop policy if exists "anyone can submit access request" on public.access_requests;
create policy "anyone can submit access request"
  on public.access_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin reads all requests" on public.access_requests;
create policy "admin reads all requests"
  on public.access_requests for select
  using (public.is_admin());

drop policy if exists "admin updates request status" on public.access_requests;
create policy "admin updates request status"
  on public.access_requests for update
  using (public.is_admin());


-- ── Auto-assign program on intake completion ──────────────────────────────
-- Maps experience + goal + days_per_week → best-fit program when intake_completed
-- flips true. Runs SECURITY DEFINER so it can insert into program_assignments
-- without requiring admin role. assigned_by = NULL marks it as a system assignment.

create or replace function public.auto_assign_program_on_intake()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id   uuid;
  v_program_name text;
begin
  -- Only fire when intake_completed transitions false → true
  if not (new.intake_completed = true and (old.intake_completed is distinct from true)) then
    return new;
  end if;

  -- Skip if already assigned (admin may have pre-assigned)
  if exists (select 1 from public.program_assignments where user_id = new.id) then
    return new;
  end if;

  -- Map experience + goal + days_per_week to program name
  if new.experience = 'beginner' then
    v_program_name := 'Beginner Foundation';
  elsif new.goal = 'athletic_performance' then
    v_program_name := case when new.days_per_week >= 5 then 'Athletic Performance' else 'Beginner Foundation' end;
  elsif new.goal = 'cut' then
    v_program_name := case when new.days_per_week >= 6 then 'The 6-Week Cut' else 'Beginner Foundation' end;
  elsif new.goal = 'bulk' then
    v_program_name := case when new.days_per_week >= 5 then 'The 8-Week Bulk' else 'Beginner Foundation' end;
  else
    v_program_name := 'Beginner Foundation';
  end if;

  select id into v_program_id
  from public.programs
  where name = v_program_name and is_active = true
  limit 1;

  -- Hard fallback: any active program
  if v_program_id is null then
    select id into v_program_id from public.programs where is_active = true limit 1;
  end if;

  if v_program_id is not null then
    insert into public.program_assignments (user_id, program_id, start_date, assigned_by)
    values (new.id, v_program_id, current_date, null);
  end if;

  return new;
end;
$$;

drop trigger if exists after_intake_completed on public.profiles;
create trigger after_intake_completed
  after update on public.profiles
  for each row
  execute function public.auto_assign_program_on_intake();


-- ── Program switching: status column + partial unique index ───────────────────
-- Run this block in Supabase SQL Editor to enable multi-program history.
-- Safe to re-run.

-- Add status column (active / completed) if not already present
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'program_assignments'
      and column_name  = 'status'
  ) then
    alter table public.program_assignments
      add column status text not null default 'active'
        check (status in ('active', 'completed'));
  end if;
end $$;

-- Drop the old unique(user_id) constraint and replace with a partial index
-- so users can have many historical (completed) assignments but only one active.
alter table public.program_assignments
  drop constraint if exists program_assignments_user_id_unique;

drop index if exists program_assignments_one_active_per_user;
create unique index program_assignments_one_active_per_user
  on public.program_assignments (user_id)
  where status = 'active';

-- Allow users to update their own assignment status (complete / switch)
drop policy if exists "users update own assignment status" on public.program_assignments;
create policy "users update own assignment status"
  on public.program_assignments for update
  using (user_id = auth.uid());

-- Allow users to insert their own assignments (needed for self-service switching)
drop policy if exists "users insert own assignment" on public.program_assignments;
create policy "users insert own assignment"
  on public.program_assignments for insert
  with check (user_id = auth.uid() or public.is_admin());


-- ── Updated auto-assign trigger (handles status + new programs) ───────────────

create or replace function public.auto_assign_program_on_intake()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id   uuid;
  v_program_name text;
begin
  if not (new.intake_completed = true and (old.intake_completed is distinct from true)) then
    return new;
  end if;

  -- Skip if already has an active assignment
  if exists (
    select 1 from public.program_assignments
    where user_id = new.id and status = 'active'
  ) then
    return new;
  end if;

  -- Map experience + goal + days_per_week to program name
  if new.experience = 'beginner' then
    v_program_name := 'Beginner Foundation';
  elsif new.goal = 'athletic_performance' then
    v_program_name := case when new.days_per_week >= 5 then 'Athletic Performance' else 'Beginner Foundation' end;
  elsif new.goal = 'cut' then
    v_program_name := case when new.days_per_week >= 6 then 'The 6-Week Cut' else 'Beginner Foundation' end;
  elsif new.goal = 'bulk' then
    if new.days_per_week >= 6 then
      v_program_name := 'Push / Pull / Legs';
    elsif new.days_per_week >= 5 then
      v_program_name := 'The 8-Week Bulk';
    elsif new.days_per_week >= 4 then
      v_program_name := 'Upper / Lower Classic';
    else
      v_program_name := 'Beginner Foundation';
    end if;
  elsif new.goal = 'maintain' then
    v_program_name := case when new.days_per_week >= 5 then 'Rotating Split' else 'Beginner Foundation' end;
  else
    v_program_name := 'Beginner Foundation';
  end if;

  select id into v_program_id
  from public.programs
  where name = v_program_name and is_active = true
  limit 1;

  if v_program_id is null then
    select id into v_program_id from public.programs where is_active = true limit 1;
  end if;

  if v_program_id is not null then
    insert into public.program_assignments (user_id, program_id, start_date, assigned_by, status)
    values (new.id, v_program_id, current_date, null, 'active');
  end if;

  return new;
end;
$$;

drop trigger if exists after_intake_completed on public.profiles;
create trigger after_intake_completed
  after update on public.profiles
  for each row
  execute function public.auto_assign_program_on_intake();


-- ── Signup codes (self-serve invite flow) ────────────────────────────────────
-- Codes are validated server-side via /api/signup (service role). No anon SELECT.

create table if not exists public.signup_codes (
  code       text primary key,
  label      text,
  max_uses   int  not null default 1,
  uses       int  not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.signup_codes enable row level security;

drop policy if exists "admins manage signup_codes" on public.signup_codes;
create policy "admins manage signup_codes"
  on public.signup_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Atomically claim a signup code slot; returns the row on success, empty on failure.
-- Called by /api/signup serverless (service role) — not exposed to the browser.
create or replace function public.claim_signup_code(p_code text)
returns setof public.signup_codes
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update public.signup_codes
    set uses = uses + 1
    where code = upper(p_code)
      and uses < max_uses
      and (expires_at is null or expires_at > now())
    returning *;
end;
$$;


-- ── After running this: ──────────────────
-- 1. Sign up via the app
-- 2. Promote yourself to admin:
--    update public.profiles set role = 'admin' where id = '<your-user-id>';
-- 3. Programs are already seeded (seed.js + seed-programs-v2.js)
-- 4. Existing program_assignments rows will have status = 'active' (the column default)
