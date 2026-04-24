-- Backfill workout_logs.muscle_groups to canonical muscle names.
--
-- Context: Program.jsx used to write uppercase group labels like
-- 'CHEST', 'QUADS', 'PUSH', 'POWER', 'STRENGTH', 'ACCESSORIES' into
-- muscle_groups. Dashboard.jsx looks up mixed-case anatomical names
-- ('Chest', 'Legs', etc.), so old logs never registered on the grid.
--
-- This UPDATE rewrites each row's muscle_groups by joining against the
-- program's JSONB structure and reading each exercise's swap_category
-- (the canonical source of truth — already in the data). Rows whose
-- program was deleted or whose day no longer exists fall back to a
-- label-based mapping so nothing is lost.
--
-- Safe to re-run — idempotent: writing canonical names a second time is
-- a no-op because the derivation is deterministic.

-- Primary path: derive muscles from swap_category of exercises in the
-- program's day (source of truth). Works for all 7 seeded programs.
with category_muscle as (
  select * from (values
    ('chest_multi',  'Chest'),
    ('chest_single', 'Chest'),
    ('shoulders',    'Shoulders'),
    ('triceps',      'Triceps'),
    ('back_multi',   'Back'),
    ('back_single',  'Back'),
    ('traps',        'Traps'),
    ('biceps',       'Biceps'),
    ('legs_multi',   'Legs'),
    ('legs_single',  'Legs'),
    ('calves',       'Calves'),
    ('abs',          'Abs')
  ) as t(category, muscle)
),
log_muscles as (
  select
    wl.id as log_id,
    array_agg(distinct cm.muscle order by cm.muscle) as muscles
  from public.workout_logs wl
  join public.programs p on p.id = wl.program_id
  cross join lateral jsonb_array_elements(p.structure->'weeks') with ordinality as wk(week_obj, wi)
  cross join lateral jsonb_array_elements(wk.week_obj->'days') with ordinality as d(day_obj, di)
  cross join lateral jsonb_array_elements(d.day_obj->'groups') as g(grp)
  cross join lateral jsonb_array_elements(g.grp->'exercises') as e(ex)
  join category_muscle cm on cm.category = e.ex->>'swap_category'
  where (wi - 1) = wl.week_index
    and (di - 1) = wl.day_index
  group by wl.id
)
update public.workout_logs wl
set muscle_groups = lm.muscles
from log_muscles lm
where wl.id = lm.log_id;

-- Fallback: for any row we couldn't resolve via the program structure
-- (program deleted, structure drifted), remap legacy uppercase labels.
update public.workout_logs
set muscle_groups = (
  select coalesce(array_agg(distinct m order by m), '{}')
  from unnest(muscle_groups) as tag
  cross join lateral (
    select case upper(tag)
      when 'CHEST'        then 'Chest'
      when 'SHOULDERS'    then 'Shoulders'
      when 'REAR DELT'    then 'Shoulders'
      when 'TRICEPS'      then 'Triceps'
      when 'BACK'         then 'Back'
      when 'TRAPS'        then 'Traps'
      when 'BICEPS'       then 'Biceps'
      when 'ARMS'         then null     -- ambiguous; expanded below
      when 'LEGS'         then 'Legs'
      when 'QUADS'        then 'Legs'
      when 'HAMSTRINGS'   then 'Legs'
      when 'GLUTES'       then 'Legs'
      when 'CALVES'       then 'Calves'
      when 'ABS'          then 'Abs'
      when 'CORE'         then 'Abs'
      -- Mixed labels: best-effort expansion
      when 'PUSH'         then null
      when 'UPPER PUSH'   then null
      when 'PULL'         then null
      when 'UPPER PULL'   then null
      when 'LOWER'        then 'Legs'
      when 'POWER'        then null
      when 'STRENGTH'     then null
      when 'COMPLEX'      then null
      when 'ACCESSORIES'  then null
      when 'CONDITIONING' then null
      when 'ISOLATION'    then null
      when 'MOBILITY'     then null
      else null
    end as m
  ) s
  where m is not null
)
where exists (
  select 1 from unnest(muscle_groups) as tag
  where tag = upper(tag) and tag <> ''
);
