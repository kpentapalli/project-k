// Generates SQL INSERT statements for sport supplemental programs.
// Run: node scripts/generate-sport-supplemental-sql.js > supabase/seed-sport-supplemental-programs.sql
import { SPORT_SUPPLEMENTAL_PROGRAMS } from './seed-sport-supplemental-programs.js'

function sqlStr(s) {
  if (s === null || s === undefined) return 'null'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlJson(obj) {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
}

console.log('-- Seed sport supplemental programs')
console.log('-- Run in Supabase SQL Editor. Safe to re-run (uses NOT EXISTS guard).\n')

for (const p of SPORT_SUPPLEMENTAL_PROGRAMS) {
  console.log('insert into public.programs (name, description, duration_weeks, days_per_week, goal_tag, difficulty, is_active, structure)')
  console.log(`select ${sqlStr(p.name)}, ${sqlStr(p.description)}, ${p.duration_weeks}, ${p.days_per_week}, ${sqlStr(p.goal_tag)}, ${sqlStr(p.difficulty)}, true, ${sqlJson(p.structure)}`)
  console.log(`where not exists (select 1 from public.programs where name = ${sqlStr(p.name)});\n`)
}
