// Run: node scripts/seed.js
// Requires SUPABASE_SERVICE_ROLE_KEY in .env
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Helpers ─────────────────────────────

function ex(name, sets, reps, note, swap_category) {
  return { name, sets, reps, note, swap_category }
}

// ── Program 1: The 6-Week Cut ────────────

const CUT_HEAVY_REPS = ['9–11', '6–8', '2–5', '9–11', '6–8', '2–5']
const CUT_LIGHT_REPS = ['12–15', '16–20', '21–30', '12–15', '16–20', '16–20']

function makeCutWeek(wk) {
  const p2 = wk >= 3
  const h = CUT_HEAVY_REPS[wk]
  const l = CUT_LIGHT_REPS[wk]

  return {
    label: `Week ${wk + 1}`,
    rep_note: `Days 1–3: <b>${h} reps</b> — heavy compound. Days 4–6: <b>${l} reps</b> — isolation focus.${wk >= 3 ? ' <b>Phase 2:</b> add rest-pause on final set.' : ''}`,
    days: [
      // Day 1 — Chest · Triceps · Abs (Multijoint)
      {
        title: 'Chest · Triceps · Abs',
        sub: 'Day 1 — Multijoint (Heavy)',
        groups: [
          { name: 'CHEST', exercises: [
            ex(p2 ? 'Incline Barbell Press' : 'Barbell Bench Press', 4, h, 'Full ROM, elbows at 45°. Control the descent.', 'chest_multi'),
            ex('Incline DB Press', 3, h, 'Neutral grip, slight arch. Squeeze at top.', 'chest_multi'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Close-Grip Bench Press', 3, h, 'Hands shoulder-width. Elbows tucked.', 'triceps'),
            ex('Overhead EZ-Bar Extension', 3, h, 'Keep elbows close to head. Full stretch at bottom.', 'triceps'),
          ]},
          { name: 'ABS', exercises: [
            ex('Hanging Leg Raise', 3, '10–15', 'Posterior pelvic tilt at top. No swinging.', 'abs'),
            ex('Cable Crunch', 3, '12–15', 'Kneel facing cable. Crunch elbows to knees.', 'abs'),
          ]},
        ],
      },
      // Day 2 — Shoulders · Legs · Calves (Multijoint)
      {
        title: 'Shoulders · Legs · Calves',
        sub: 'Day 2 — Multijoint (Heavy)',
        groups: [
          { name: 'SHOULDERS', exercises: [
            ex('Barbell Overhead Press', 4, h, 'Standing or seated. Bar path straight up.', 'shoulders'),
            ex(p2 ? 'DB Arnold Press' : 'DB Shoulder Press', 3, h, 'Full range of motion overhead.', 'shoulders'),
          ]},
          { name: 'LEGS', exercises: [
            ex('Barbell Back Squat', 4, h, 'Knees tracking toes. Depth below parallel.', 'legs_multi'),
            ex('Romanian Deadlift', 3, h, 'Hinge at hips, soft knees. Feel hamstring stretch.', 'legs_multi'),
            ex('Leg Press', 3, h, 'Feet shoulder-width, mid-platform. Full ROM.', 'legs_multi'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Standing Calf Raise', 4, '12–20', 'Full stretch at bottom, pause at top.', 'calves'),
          ]},
        ],
      },
      // Day 3 — Back · Traps · Biceps (Multijoint)
      {
        title: 'Back · Traps · Biceps',
        sub: 'Day 3 — Multijoint (Heavy)',
        groups: [
          { name: 'BACK', exercises: [
            ex(p2 ? 'Trap Bar Deadlift' : 'Conventional Deadlift', 4, h, 'Brace hard, neutral spine. Drive through the floor.', 'back_multi'),
            ex('Weighted Pull-Up', 3, h, 'Full hang to chin over bar. Slow descent.', 'back_multi'),
            ex('Pendlay Row', 3, h, 'Bar to lower chest. Explode up, control down.', 'back_multi'),
          ]},
          { name: 'TRAPS', exercises: [
            ex('Barbell Shrug', 3, h, 'Straight up — no rolling. Hold 1 sec at top.', 'traps'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('Barbell Curl', 3, h, 'No swinging. Full extension at bottom.', 'biceps'),
            ex('Incline DB Curl', 3, h, 'Elbows behind body for full stretch.', 'biceps'),
          ]},
        ],
      },
      // Day 4 — Chest · Triceps · Abs (Isolation)
      {
        title: 'Chest · Triceps · Abs',
        sub: 'Day 4 — Isolation (Volume)',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Pec Deck Fly', 3, l, 'Lead with elbows, not wrists. Slow negative.', 'chest_single'),
            ex('Cable Crossover', 3, l, 'Low cables. Cross hands at bottom.', 'chest_single'),
            ex(p2 ? 'DB Pullover' : 'Decline DB Fly', 3, l, 'Full stretch across chest. Control throughout.', 'chest_single'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Cable Pushdown (Rope)', 3, l, 'Spread rope at bottom. Elbows pinned.', 'triceps'),
            ex('Single-Arm Overhead Cable Extension', 3, l, 'Full stretch overhead. Slow negative.', 'triceps'),
          ]},
          { name: 'ABS', exercises: [
            ex('Decline Sit-Up', 3, l, 'Hands across chest. Full ROM.', 'abs'),
            ex('Plank', 3, '45–60s', 'Neutral spine. Squeeze glutes and abs.', 'abs'),
          ]},
        ],
      },
      // Day 5 — Shoulders · Legs · Calves (Isolation)
      {
        title: 'Shoulders · Legs · Calves',
        sub: 'Day 5 — Isolation (Volume)',
        groups: [
          { name: 'SHOULDERS', exercises: [
            ex('DB Lateral Raise', 4, l, 'Slight forward lean. Thumbs slightly down.', 'shoulders'),
            ex('Cable Face Pull', 3, l, 'Rope to forehead, elbows high. Rear delt focus.', 'shoulders'),
            ex('DB Front Raise', 3, l, 'Alternate arms. No momentum.', 'shoulders'),
          ]},
          { name: 'LEGS', exercises: [
            ex('Leg Extension', 3, l, 'Pause at top. Slow 3-sec descent.', 'legs_single'),
            ex('Lying Leg Curl', 3, l, 'Curl all the way up. Control down.', 'legs_single'),
            ex(p2 ? 'Bulgarian Split Squat' : 'Walking Lunge', 3, l, 'Front foot forward, torso upright.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Seated Calf Raise', 4, l, 'Knees at 90°. Full stretch at bottom.', 'calves'),
          ]},
        ],
      },
      // Day 6 — Back · Traps · Biceps (Isolation)
      {
        title: 'Back · Traps · Biceps',
        sub: 'Day 6 — Isolation (Volume)',
        groups: [
          { name: 'BACK', exercises: [
            ex('Wide-Grip Lat Pulldown', 3, l, 'Pull to upper chest. Lead with elbows.', 'back_single'),
            ex('Seated Cable Row (Wide Grip)', 3, l, 'Chest up. Squeeze shoulder blades together.', 'back_single'),
            ex('DB Single-Arm Row', 3, l, 'Support on bench. Pull elbow to hip.', 'back_single'),
          ]},
          { name: 'TRAPS', exercises: [
            ex('DB Shrug', 3, l, 'Hold 1 sec at top. Full range.', 'traps'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('Preacher Curl (EZ-Bar)', 3, l, 'Full extension at bottom. No bouncing.', 'biceps'),
            ex('Cable Curl', 3, l, 'Constant tension. Slow negative.', 'biceps'),
            ex('DB Hammer Curl', 3, l, 'Neutral grip. Alternate arms.', 'biceps'),
          ]},
        ],
      },
    ],
  }
}

const SIX_WEEK_CUT = {
  name: 'The 6-Week Cut',
  description: 'A 6-week fat-loss program built on undulating periodization. 6 days/week: heavy compound days alternate with high-rep isolation days. Rep ranges shift every week to maximize muscle retention while cutting.',
  duration_weeks: 6,
  days_per_week: 6,
  goal_tag: 'cut',
  difficulty: 'intermediate',
  structure: {
    weeks: Array.from({ length: 6 }, (_, i) => makeCutWeek(i)),
    swap_options: {
      chest_multi: [
        { name: 'Neutral-Grip DB Press', note: 'Palms facing in — shoulder-friendly.' },
        { name: 'Push-Up (weighted)', note: 'Add plates on back for resistance.' },
        { name: 'Machine Chest Press', note: 'Good for mind-muscle connection.' },
        { name: 'Smith Machine Bench Press', note: 'Fixed path — great for isolation.' },
        { name: 'Landmine Press', note: 'Shoulder-friendly pressing angle.' },
      ],
      chest_single: [
        { name: 'DB Fly', note: 'Wide arc, slight bend in elbows.' },
        { name: 'Low Cable Fly', note: 'Upward arc to chest height.' },
        { name: 'High Cable Fly', note: 'Downward arc across body.' },
        { name: 'Machine Fly', note: 'Consistent tension throughout.' },
      ],
      triceps: [
        { name: 'Skull Crusher (EZ-Bar)', note: 'Lower to forehead. Slow negative.' },
        { name: 'Tricep Dip (weighted)', note: 'Upright torso for tricep focus.' },
        { name: 'DB Kickback', note: 'Elbow pinned. Full extension.' },
        { name: 'Cable Pushdown (Bar)', note: 'Elbows tucked to sides.' },
        { name: 'Machine Tricep Extension', note: 'Good for isolation.' },
      ],
      abs: [
        { name: 'Ab Wheel Rollout', note: 'Extend until hips about to drop.' },
        { name: 'Weighted Decline Crunch', note: 'Hold plate on chest.' },
        { name: 'Dragon Flag', note: 'Advanced. Control the descent.' },
        { name: 'Captain\'s Chair Leg Raise', note: 'Posterior pelvic tilt at top.' },
      ],
      shoulders: [
        { name: 'Cable Lateral Raise', note: 'Constant tension vs dumbbells.' },
        { name: 'Machine Shoulder Press', note: 'Less stabilizer demand.' },
        { name: 'DB Upright Row', note: 'Wide grip, elbows flared.' },
        { name: 'Landmine Lateral Raise', note: 'Natural arc, joint-friendly.' },
      ],
      legs_multi: [
        { name: 'Hack Squat', note: 'Feet forward on platform.' },
        { name: 'Front Squat', note: 'More quad dominant. Core intensive.' },
        { name: 'DB Split Squat', note: 'Easier than Bulgarian. Good starting point.' },
        { name: 'Sumo Deadlift', note: 'Wide stance, more hip focus.' },
      ],
      legs_single: [
        { name: 'Sissy Squat', note: 'Bodyweight or assisted.' },
        { name: 'Nordic Hamstring Curl', note: 'Advanced. Slow eccentric.' },
        { name: 'Cable Pull-Through', note: 'Hip hinge. Glute and hamstring focus.' },
        { name: 'Step-Up (weighted)', note: 'Unilateral quad and glute work.' },
      ],
      calves: [
        { name: 'Leg Press Calf Raise', note: 'Toes on edge of platform.' },
        { name: 'Single-Leg Calf Raise', note: 'Bodyweight or hold DB. Full ROM.' },
        { name: 'Donkey Calf Raise', note: 'Best stretch position.' },
      ],
      back_multi: [
        { name: 'T-Bar Row', note: 'Chest supported or free. Mid-back focus.' },
        { name: 'Chest-Supported DB Row', note: 'No lower back involvement.' },
        { name: 'Seated Cable Row (Close Grip)', note: 'Drive elbows back past torso.' },
        { name: 'Machine Row', note: 'Good for isolation and control.' },
      ],
      back_single: [
        { name: 'Close-Grip Lat Pulldown', note: 'Elbows to sides. Squeeze lats.' },
        { name: 'Straight-Arm Pulldown', note: 'Arms straight. Pure lat isolation.' },
        { name: 'DB Pullover', note: 'Stretches lats and serratus.' },
      ],
      traps: [
        { name: 'Cable Shrug', note: 'Behind back for different angle.' },
        { name: 'Rack Pull (High)', note: 'Heavy. Great trap builder.' },
        { name: 'DB Farmer Carry', note: '40m walk. Grip and traps.' },
      ],
      biceps: [
        { name: 'Spider Curl', note: 'Chest on incline bench. No cheat.' },
        { name: 'Concentration Curl', note: 'Seated, elbow on knee. Peak contraction.' },
        { name: 'Zottman Curl', note: 'Supinate up, pronate down.' },
        { name: 'Cable Curl (Low)', note: 'Constant tension throughout.' },
      ],
    },
  },
}

// ── Program 2: The 8-Week Bulk ───────────

const BULK_REPS_1 = ['10–12', '10–12', '8–10', '8–10', '6–8', '6–8', '4–6', '4–6']
const BULK_REPS_2 = ['12–15', '12–15', '10–12', '10–12', '8–10', '8–10', '6–8', '6–8']

function makeBulkWeek(wk) {
  const r1 = BULK_REPS_1[wk]
  const r2 = BULK_REPS_2[wk]
  const phase = wk < 4 ? 'Accumulation' : 'Intensification'

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${phase} Phase.</b> Main lifts: <b>${r1} reps</b>. Accessory work: <b>${r2} reps</b>. Add weight when you hit the top of the range for all sets.`,
    days: [
      // Day 1 — Push (Chest / Shoulders / Triceps)
      {
        title: 'Push — Chest · Shoulders · Triceps',
        sub: 'Day 1 — Push',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Barbell Bench Press', 4, r1, 'Arch slightly, feet flat. Bar to lower chest.', 'chest_multi'),
            ex('Incline DB Press', 3, r2, 'Slight incline (30°). Full press.', 'chest_multi'),
            ex('Pec Deck Fly', 3, r2, 'Slow negative for stretch. Lead with elbows.', 'chest_single'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('DB Overhead Press', 3, r1, 'Seated or standing. Full lockout.', 'shoulders'),
            ex('DB Lateral Raise', 3, r2, 'Lean slightly forward. Thumbs slightly down.', 'shoulders'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Cable Pushdown (Rope)', 3, r2, 'Spread rope at bottom. Elbows pinned.', 'triceps'),
          ]},
        ],
      },
      // Day 2 — Pull (Back / Biceps / Rear Delt)
      {
        title: 'Pull — Back · Biceps · Rear Delt',
        sub: 'Day 2 — Pull',
        groups: [
          { name: 'BACK', exercises: [
            ex('Barbell Row (Overhand)', 4, r1, 'Hinge 45°. Bar to lower chest. Elbows back.', 'back_multi'),
            ex('Pull-Up / Lat Pulldown', 3, r1, 'Full hang. Lead elbows down and back.', 'back_multi'),
            ex('Seated Cable Row', 3, r2, 'Chest up, squeeze at full contraction.', 'back_single'),
          ]},
          { name: 'REAR DELT', exercises: [
            ex('Cable Face Pull', 3, r2, 'Rope to forehead. Elbows high and wide.', 'shoulders'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('Barbell Curl', 3, r1, 'No swinging. Full extension.', 'biceps'),
            ex('Incline DB Curl', 3, r2, 'Elbows behind body for stretch.', 'biceps'),
          ]},
        ],
      },
      // Day 3 — Legs
      {
        title: 'Legs — Quads · Hamstrings · Calves',
        sub: 'Day 3 — Legs',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Barbell Back Squat', 4, r1, 'Bar on traps, chest up. Depth below parallel.', 'legs_multi'),
            ex('Leg Press', 3, r2, 'Feet shoulder-width. Full ROM. Don\'t lock out.', 'legs_multi'),
            ex('Leg Extension', 3, r2, 'Pause at top. 3-sec negative.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Romanian Deadlift', 3, r1, 'Hinge at hips. Feel the hamstring stretch.', 'legs_multi'),
            ex('Lying Leg Curl', 3, r2, 'Full ROM. Control negative.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Standing Calf Raise', 4, '12–20', 'Full stretch at bottom.', 'calves'),
          ]},
        ],
      },
      // Day 4 — Upper (Strength Focus)
      {
        title: 'Upper — Strength Focus',
        sub: 'Day 4 — Upper Heavy',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Incline Barbell Press', 4, r1, '30° incline. Control down, explode up.', 'chest_multi'),
            ex('DB Flat Press', 3, r2, 'Wide grip, full stretch at bottom.', 'chest_multi'),
          ]},
          { name: 'BACK', exercises: [
            ex('Conventional Deadlift', 4, r1, 'Brace hard. Drive floor away.', 'back_multi'),
            ex('T-Bar Row', 3, r2, 'Chest supported. Pull to lower chest.', 'back_multi'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('Barbell Overhead Press', 3, r1, 'Standing. Tight core. Full lockout.', 'shoulders'),
          ]},
          { name: 'ARMS', exercises: [
            ex('EZ-Bar Curl', 3, r2, 'Supinated grip. No swinging.', 'biceps'),
            ex('Overhead Tricep Extension', 3, r2, 'Keep elbows close to head.', 'triceps'),
          ]},
        ],
      },
      // Day 5 — Lower (Strength Focus)
      {
        title: 'Lower — Strength Focus',
        sub: 'Day 5 — Lower Heavy',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Front Squat', 4, r1, 'Elbows up. Deep. Core braced hard.', 'legs_multi'),
            ex('Bulgarian Split Squat', 3, r2, 'Torso upright. Front heel drive.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Sumo Deadlift', 4, r1, 'Wide stance, toes out. Hip hinge dominant.', 'legs_multi'),
            ex('Nordic Curl', 3, '4–6', 'Slow eccentric. Use band for assistance if needed.', 'legs_single'),
          ]},
          { name: 'GLUTES', exercises: [
            ex('Hip Thrust (Barbell)', 3, r2, 'Shoulders on bench, bar on hips. Full extension.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Seated Calf Raise', 4, '15–20', 'Knees at 90°. Full stretch at bottom.', 'calves'),
          ]},
        ],
      },
    ],
  }
}

const EIGHT_WEEK_BULK = {
  name: 'The 8-Week Bulk',
  description: 'An 8-week muscle-building program using a Push/Pull/Legs/Upper/Lower split. Progressive overload with gradually increasing intensity over two phases — accumulation (weeks 1–4) and intensification (weeks 5–8).',
  duration_weeks: 8,
  days_per_week: 5,
  goal_tag: 'bulk',
  difficulty: 'intermediate',
  structure: {
    weeks: Array.from({ length: 8 }, (_, i) => makeBulkWeek(i)),
    swap_options: SIX_WEEK_CUT.structure.swap_options,
  },
}

// ── Program 3: Beginner Foundation ───────

function makeBeginnerWeek(wk) {
  const reps = wk < 4 ? '10–12' : '8–10'
  const sets = wk < 2 ? 2 : 3

  const dayA = {
    title: 'Full Body A — Squat Focus',
    sub: `Week ${wk + 1} — Day A`,
    groups: [
      { name: 'LEGS', exercises: [
        ex('Goblet Squat', sets, reps, 'Hold DB at chest. Knees out. Sit deep.', 'legs_multi'),
        ex('Romanian Deadlift (DB)', sets, reps, 'Hinge at hips. Soft knees. Feel stretch.', 'legs_multi'),
      ]},
      { name: 'PUSH', exercises: [
        ex('DB Bench Press', sets, reps, 'Feet flat. Controlled press. Full ROM.', 'chest_multi'),
        ex('DB Shoulder Press', sets, reps, 'Seated. Full lockout overhead.', 'shoulders'),
      ]},
      { name: 'PULL', exercises: [
        ex('Seated Cable Row', sets, reps, 'Chest up. Drive elbows back.', 'back_single'),
        ex('DB Curl', sets, reps, 'No swinging. Alternate arms.', 'biceps'),
      ]},
      { name: 'CORE', exercises: [
        ex('Plank', sets, '30–45s', 'Neutral spine. Squeeze abs and glutes.', 'abs'),
      ]},
    ],
  }

  const dayB = {
    title: 'Full Body B — Hinge Focus',
    sub: `Week ${wk + 1} — Day B`,
    groups: [
      { name: 'LEGS', exercises: [
        ex('DB Deadlift', sets, reps, 'Hinge at hips. Neutral spine. Drive hips forward.', 'legs_multi'),
        ex('Leg Press', sets, reps, 'Feet shoulder-width. Full ROM.', 'legs_multi'),
      ]},
      { name: 'PUSH', exercises: [
        ex('Incline DB Press', sets, reps, '30° incline. Control the negative.', 'chest_multi'),
        ex('Push-Up', sets, reps, 'Body straight. Full ROM. Chest to floor.', 'chest_multi'),
      ]},
      { name: 'PULL', exercises: [
        ex('Lat Pulldown', sets, reps, 'Wide grip. Pull to upper chest.', 'back_multi'),
        ex('Face Pull', sets, reps, 'Rope to forehead. Elbows high.', 'shoulders'),
      ]},
      { name: 'CORE', exercises: [
        ex('Dead Bug', sets, '8–10', 'Lower back flat. Opposite arm/leg extend.', 'abs'),
      ]},
    ],
  }

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${sets} sets × ${reps} reps</b> on all exercises. Rest 90 seconds between sets. Focus on form — add weight only when all reps are clean.`,
    days: [dayA, dayB, dayA],
  }
}

const BEGINNER_FOUNDATION = {
  name: 'Beginner Foundation',
  description: 'An 8-week full-body program for beginners. 3 days/week, two alternating workouts (A/B/A one week, B/A/B the next). Compound movements only. Focus on learning movement patterns and building a base.',
  duration_weeks: 8,
  days_per_week: 3,
  goal_tag: 'maintain',
  difficulty: 'beginner',
  structure: {
    weeks: Array.from({ length: 8 }, (_, i) => makeBeginnerWeek(i)),
    swap_options: SIX_WEEK_CUT.structure.swap_options,
  },
}

// ── Program 4: Athletic Performance ──────

const ATHLETIC_REPS_STRENGTH = ['5–6', '4–5', '3–4', '5–6', '3–4', '2–3']
const ATHLETIC_REPS_HYPERTROPHY = ['10–12', '10–12', '8–10', '10–12', '8–10', '6–8']

function makeAthleticWeek(wk) {
  const str = ATHLETIC_REPS_STRENGTH[wk]
  const hyp = ATHLETIC_REPS_HYPERTROPHY[wk]
  const phase = wk < 3 ? 'Strength-Endurance' : 'Max Strength'

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${phase} Phase.</b> Power/strength lifts: <b>${str} reps</b> @80–90% effort. Accessory work: <b>${hyp} reps</b>. Rest 2–3 min on main lifts.`,
    days: [
      // Day 1 — Lower Power
      {
        title: 'Lower Body — Power & Strength',
        sub: 'Day 1 — Lower Power',
        groups: [
          { name: 'POWER', exercises: [
            ex('Power Clean (or Trap Bar Jump)', 4, str, 'Explode from floor. Full hip extension. Catch in quarter squat.', 'legs_multi'),
          ]},
          { name: 'STRENGTH', exercises: [
            ex('Barbell Back Squat', 4, str, 'Heavy. Controlled descent, explosive up.', 'legs_multi'),
            ex('Romanian Deadlift', 3, hyp, 'Hamstring stretch focus. Controlled.', 'legs_multi'),
          ]},
          { name: 'ACCESSORIES', exercises: [
            ex('Bulgarian Split Squat', 3, hyp, 'Unilateral. Torso upright.', 'legs_single'),
            ex('Leg Curl', 3, hyp, 'Full ROM. Slow negative.', 'legs_single'),
            ex('Calf Raise', 3, '15–20', 'Full stretch. Explosive up.', 'calves'),
          ]},
        ],
      },
      // Day 2 — Upper Push
      {
        title: 'Upper Body — Push & Press',
        sub: 'Day 2 — Upper Push',
        groups: [
          { name: 'STRENGTH', exercises: [
            ex('Barbell Bench Press', 4, str, 'Explosive press. Full arch. Controlled descent.', 'chest_multi'),
            ex('Barbell Overhead Press', 4, str, 'Standing. Brace core. Full lockout.', 'shoulders'),
          ]},
          { name: 'ACCESSORIES', exercises: [
            ex('DB Incline Press', 3, hyp, 'Squeeze at top. 3-sec negative.', 'chest_multi'),
            ex('DB Lateral Raise', 3, hyp, 'Controlled. No momentum.', 'shoulders'),
            ex('Tricep Pushdown', 3, hyp, 'Elbows pinned. Full extension.', 'triceps'),
          ]},
        ],
      },
      // Day 3 — Upper Pull
      {
        title: 'Upper Body — Pull & Row',
        sub: 'Day 3 — Upper Pull',
        groups: [
          { name: 'STRENGTH', exercises: [
            ex('Conventional Deadlift', 4, str, 'Brace. Drive floor away. Lock hips out.', 'back_multi'),
            ex('Weighted Pull-Up', 4, str, 'Full hang. Chin over bar. Slow descent.', 'back_multi'),
          ]},
          { name: 'ACCESSORIES', exercises: [
            ex('Barbell Row', 3, hyp, 'Hinge 45°. Pull to lower chest.', 'back_multi'),
            ex('Face Pull', 3, hyp, 'Rope to forehead. External rotation.', 'shoulders'),
            ex('Barbell Curl', 3, hyp, 'Strict. Full ROM.', 'biceps'),
          ]},
        ],
      },
      // Day 4 — Lower Strength + Conditioning
      {
        title: 'Lower Body — Strength + Conditioning',
        sub: 'Day 4 — Lower Strength',
        groups: [
          { name: 'STRENGTH', exercises: [
            ex('Front Squat', 4, str, 'Elbows high. Upright torso. Deep.', 'legs_multi'),
            ex('Trap Bar Deadlift', 4, str, 'Neutral grip. Hip hinge. Lock hips out.', 'legs_multi'),
          ]},
          { name: 'CONDITIONING', exercises: [
            ex('Box Jump', 3, '5', 'Land softly. Step down. Reset each rep.', 'legs_multi'),
            ex('Sled Push / Prowler', 3, '20m', 'Low stance. Drive through the ground.', 'legs_multi'),
          ]},
          { name: 'ACCESSORIES', exercises: [
            ex('Hip Thrust', 3, hyp, 'Full extension. Squeeze glutes at top.', 'legs_single'),
            ex('Single-Leg Calf Raise', 3, '15–20', 'Weighted. Full ROM.', 'calves'),
          ]},
        ],
      },
      // Day 5 — Full Body Metabolic
      {
        title: 'Full Body — Metabolic Finisher',
        sub: 'Day 5 — Full Body',
        groups: [
          { name: 'COMPLEX', exercises: [
            ex('DB Thruster', 3, '8–10', 'Front squat into overhead press. One fluid movement.', 'legs_multi'),
            ex('Renegade Row', 3, '8–10', 'Push-up position. Row DB to hip, alternate.', 'back_multi'),
          ]},
          { name: 'STRENGTH', exercises: [
            ex('Incline Bench Press', 3, str, 'Moderate weight. Full ROM.', 'chest_multi'),
            ex('Single-Arm DB Row', 3, hyp, 'Elbow to hip. Controlled.', 'back_single'),
          ]},
          { name: 'CORE', exercises: [
            ex('Ab Wheel Rollout', 3, '8–12', 'Hips low. Full extension.', 'abs'),
            ex('Pallof Press', 3, '10–12', 'Anti-rotation. Hold 2 sec at extension.', 'abs'),
          ]},
        ],
      },
    ],
  }
}

const ATHLETIC_PERFORMANCE = {
  name: 'Athletic Performance',
  description: 'A 6-week strength and power program for advanced athletes. 5 days/week combining Olympic lifting derivatives, heavy strength work, and conditioning. Designed to build explosive power alongside functional muscle.',
  duration_weeks: 6,
  days_per_week: 5,
  goal_tag: 'athletic_performance',
  difficulty: 'advanced',
  structure: {
    weeks: Array.from({ length: 6 }, (_, i) => makeAthleticWeek(i)),
    swap_options: SIX_WEEK_CUT.structure.swap_options,
  },
}

// ── Insert all programs ──────────────────

async function seed() {
  const programs = [
    SIX_WEEK_CUT,
    EIGHT_WEEK_BULK,
    BEGINNER_FOUNDATION,
    ATHLETIC_PERFORMANCE,
  ]

  console.log(`Seeding ${programs.length} programs...`)

  const { data, error } = await supabase
    .from('programs')
    .insert(programs)
    .select('id, name')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log('Seeded programs:')
  data.forEach(p => console.log(` ✓ ${p.name} (${p.id})`))
  console.log('\nDone. Go to Supabase → Table Editor → programs to verify.')
}

seed()
