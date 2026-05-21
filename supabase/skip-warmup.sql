-- Skip day + warm-up/cool-down support
-- Run in Supabase SQL Editor.

-- workout_logs: add skipped flag
alter table public.workout_logs
  add column if not exists skipped boolean not null default false;
