-- Mobile MVP: hero archetype columns + hero_unlocks table
-- Run once in Supabase SQL editor. Safe to re-run (idempotent).

-- Add hero columns to profiles
alter table public.profiles
  add column if not exists hero_archetype text check (hero_archetype in ('knight', 'queen')),
  add column if not exists hero_name      text,
  add column if not exists hero_xp        integer not null default 0;

-- Cosmetic unlocks triggered by PRs, program completions, streaks
create table if not exists public.hero_unlocks (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  unlock_type       text        not null,   -- 'palette' | 'accessory' | 'frame'
  unlock_key        text        not null,   -- 'crimson' | 'jade' | 'frost' | 'obsidian' | 'gold'
  unlocked_at       timestamptz not null default now(),
  triggered_by_log  uuid        references public.workout_logs(id) on delete set null,
  unique (user_id, unlock_key)
);

-- RLS
alter table public.hero_unlocks enable row level security;

drop policy if exists "users manage own unlocks" on public.hero_unlocks;
create policy "users manage own unlocks"
  on public.hero_unlocks for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- XP rules (reference comment — applied in app logic, not triggers)
-- completed workout  : +100 XP
-- PR hit             : +250 XP
-- completed program  : +1000 XP
-- 7-day streak       : +500 XP

-- Palette unlock order (by PR count)
-- PR #1 → crimson
-- PR #2 → jade
-- PR #3 → frost
-- PR #4 → obsidian
-- PR #5 → gold
