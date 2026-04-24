// Generates SQL INSERT statements for the 3 new programs.
// Run: node scripts/generate-seed-sql.js > supabase/seed-programs-v2.sql
import { NEW_PROGRAMS } from './seed-programs-v2.js'

function sqlStr(s) {
  if (s === null || s === undefined) return 'null'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlJson(obj) {
  // Postgres JSONB literal — escape single quotes
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
}

console.log('-- Seed 3 new programs (PPL, Upper/Lower Classic, Rotating Split)')
console.log('-- Run in Supabase SQL Editor. Safe to re-run (uses NOT EXISTS guard).\n')

for (const p of NEW_PROGRAMS) {
  console.log(`insert into public.programs (name, description, duration_weeks, days_per_week, goal_tag, difficulty, is_active, structure)`)
  console.log(`select ${sqlStr(p.name)}, ${sqlStr(p.description)}, ${p.duration_weeks}, ${p.days_per_week}, ${sqlStr(p.goal_tag)}, ${sqlStr(p.difficulty)}, true, ${sqlJson(p.structure)}`)
  console.log(`where not exists (select 1 from public.programs where name = ${sqlStr(p.name)});\n`)
}
