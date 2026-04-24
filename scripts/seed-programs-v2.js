// Run: node scripts/seed-programs-v2.js
// Seeds 3 new programs: PPL, Upper/Lower, Rotating Split
// Requires SUPABASE_SERVICE_ROLE_KEY in .env

function ex(name, sets, reps, note, swap_category) {
  return { name, sets, reps, note, swap_category }
}

const SWAP_OPTIONS = {
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
    { name: "Captain's Chair Leg Raise", note: 'Posterior pelvic tilt at top.' },
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
}

// ── Program 5: Push / Pull / Legs ─────────────────────────────────────────────

const PPL_REPS_ACC  = ['8–12', '8–12', '10–12', '8–10', '8–10', '10–12'] // weeks 1-3 → 4-6 ish
const PPL_REPS_INT  = ['5–8',  '5–8',  '6–8',   '5–7',  '5–7',  '6–8']

function makePPLWeek(wk) {
  const phase = wk < 3 ? 'Accumulation' : 'Intensification'
  const r = wk < 3 ? '8–12' : '5–8'
  const rAcc = wk < 3 ? '10–12' : '6–10'

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${phase} Phase.</b> Main lifts: <b>${r} reps</b>. Accessories: <b>${rAcc} reps</b>. Add weight when you hit the top of every set.${wk >= 3 ? ' Intensity is high — prioritize form over ego.' : ''}`,
    days: [
      // Day 1 — Push A (Chest-led)
      {
        title: 'Push A — Chest · Shoulders · Triceps',
        sub: 'Day 1 — Push A',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Barbell Bench Press', 4, r, 'Feet flat. Bar to lower chest. Elbows at 45°.', 'chest_multi'),
            ex('Incline DB Press', 3, rAcc, '30° incline. Full press. Squeeze at top.', 'chest_multi'),
            ex('Cable Crossover', 3, rAcc, 'Low pulleys. Cross hands at bottom. Slow negative.', 'chest_single'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('DB Lateral Raise', 3, rAcc, 'Slight lean forward. Thumbs slightly down.', 'shoulders'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Cable Pushdown (Rope)', 3, rAcc, 'Spread rope at bottom. Elbows pinned.', 'triceps'),
            ex('Overhead Tricep Extension (DB)', 3, rAcc, 'Both hands on one DB. Full stretch overhead.', 'triceps'),
          ]},
        ],
      },
      // Day 2 — Pull A (Back-led)
      {
        title: 'Pull A — Back · Biceps · Rear Delt',
        sub: 'Day 2 — Pull A',
        groups: [
          { name: 'BACK', exercises: [
            ex('Barbell Row (Overhand)', 4, r, 'Hinge 45°. Pull to lower chest. Elbows back.', 'back_multi'),
            ex('Pull-Up / Lat Pulldown', 3, rAcc, 'Full hang. Lead elbows down and back.', 'back_multi'),
            ex('Seated Cable Row', 3, rAcc, 'Chest up. Full contraction, slow release.', 'back_single'),
          ]},
          { name: 'REAR DELT', exercises: [
            ex('Cable Face Pull', 3, rAcc, 'Rope to forehead. Elbows high and wide.', 'shoulders'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('Barbell Curl', 3, r, 'No swinging. Full extension at bottom.', 'biceps'),
            ex('Incline DB Curl', 3, rAcc, 'Elbows behind body for maximum stretch.', 'biceps'),
          ]},
        ],
      },
      // Day 3 — Legs A (Quad-led)
      {
        title: 'Legs A — Quads · Hamstrings · Calves',
        sub: 'Day 3 — Legs A',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Barbell Back Squat', 4, r, 'Depth below parallel. Drive knees out.', 'legs_multi'),
            ex('Leg Press', 3, rAcc, 'Feet shoulder-width. Full ROM. No lockout.', 'legs_multi'),
            ex('Leg Extension', 3, rAcc, 'Pause at top. 3-sec negative.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Romanian Deadlift', 3, r, 'Hip hinge. Feel the hamstring stretch.', 'legs_multi'),
            ex('Lying Leg Curl', 3, rAcc, 'Full ROM. Controlled negative.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Standing Calf Raise', 4, '12–20', 'Full stretch at bottom. Pause at top.', 'calves'),
          ]},
        ],
      },
      // Day 4 — Push B (Shoulder-led)
      {
        title: 'Push B — Shoulders · Chest · Triceps',
        sub: 'Day 4 — Push B',
        groups: [
          { name: 'SHOULDERS', exercises: [
            ex('Barbell Overhead Press', 4, r, 'Standing. Brace core. Full lockout overhead.', 'shoulders'),
            ex('DB Lateral Raise', 3, rAcc, 'Controlled. No momentum. Thumbs down.', 'shoulders'),
            ex('Cable Face Pull', 3, rAcc, 'Rope to forehead. External rotation focus.', 'shoulders'),
          ]},
          { name: 'CHEST', exercises: [
            ex('Incline Barbell Press', 3, rAcc, '30° incline. Control down, explode up.', 'chest_multi'),
            ex('Pec Deck Fly', 3, rAcc, 'Lead with elbows. Slow 3-sec negative.', 'chest_single'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Close-Grip Bench Press', 3, r, 'Hands shoulder-width. Elbows tucked.', 'triceps'),
            ex('Cable Pushdown (Bar)', 3, rAcc, 'Elbows pinned at sides. Full extension.', 'triceps'),
          ]},
        ],
      },
      // Day 5 — Pull B (Lat-led)
      {
        title: 'Pull B — Lats · Traps · Biceps',
        sub: 'Day 5 — Pull B',
        groups: [
          { name: 'BACK', exercises: [
            ex('Weighted Pull-Up', 4, r, 'Full hang to chin over bar. Slow descent.', 'back_multi'),
            ex('Pendlay Row', 3, rAcc, 'Dead stop each rep. Explode up. Control down.', 'back_multi'),
            ex('Wide-Grip Lat Pulldown', 3, rAcc, 'Pull to upper chest. Elbows down and back.', 'back_single'),
          ]},
          { name: 'TRAPS', exercises: [
            ex('Barbell Shrug', 3, rAcc, 'Straight up. Hold 1 sec. No rolling.', 'traps'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('EZ-Bar Curl', 3, r, 'Full extension at bottom. No swinging.', 'biceps'),
            ex('DB Hammer Curl', 3, rAcc, 'Neutral grip. Alternate arms.', 'biceps'),
          ]},
        ],
      },
      // Day 6 — Legs B (Posterior-led)
      {
        title: 'Legs B — Hamstrings · Glutes · Quads',
        sub: 'Day 6 — Legs B',
        groups: [
          { name: 'HAMSTRINGS', exercises: [
            ex('Conventional Deadlift', 4, r, 'Brace hard. Drive the floor away. Lock hips out.', 'back_multi'),
            ex('Bulgarian Split Squat', 3, rAcc, 'Torso upright. Front heel drive. Full depth.', 'legs_single'),
            ex('Nordic Curl', 3, '4–6', 'Slow eccentric. Use band for assistance if needed.', 'legs_single'),
          ]},
          { name: 'GLUTES', exercises: [
            ex('Hip Thrust (Barbell)', 3, rAcc, 'Shoulders on bench. Full hip extension at top.', 'legs_single'),
          ]},
          { name: 'QUADS', exercises: [
            ex('Leg Extension', 3, rAcc, 'Pause at top. Control the negative.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Seated Calf Raise', 4, '12–20', 'Knees at 90°. Full stretch at bottom.', 'calves'),
          ]},
        ],
      },
    ],
  }
}

const PUSH_PULL_LEGS = {
  name: 'Push / Pull / Legs',
  description: 'A 6-day PPL program that trains every muscle twice per week. Two distinct Push, Pull, and Leg sessions hit different angles and rep ranges across 6 weeks — Accumulation (weeks 1–3) builds volume, Intensification (weeks 4–6) drives strength. Ideal for intermediate lifters ready to go beyond 4 days.',
  duration_weeks: 6,
  days_per_week: 6,
  goal_tag: 'bulk',
  difficulty: 'intermediate',
  structure: {
    weeks: Array.from({ length: 6 }, (_, i) => makePPLWeek(i)),
    swap_options: SWAP_OPTIONS,
  },
}

// ── Program 6: Upper / Lower Classic ─────────────────────────────────────────

const UL_WAVES = [
  { main: '10–12', acc: '12–15' }, // wk 1
  { main: '10–12', acc: '12–15' }, // wk 2
  { main: '8–10',  acc: '10–12' }, // wk 3
  { main: '8–10',  acc: '10–12' }, // wk 4
  { main: '6–8',   acc: '8–10'  }, // wk 5
  { main: '6–8',   acc: '8–10'  }, // wk 6
  { main: '4–6',   acc: '6–8'   }, // wk 7
  { main: '4–6',   acc: '6–8'   }, // wk 8
]

function makeULWeek(wk) {
  const { main, acc } = UL_WAVES[wk]
  const phase = wk < 4 ? 'Hypertrophy' : 'Strength'

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${phase} Block.</b> Main lifts: <b>${main} reps</b>. Accessories: <b>${acc} reps</b>. ${wk >= 4 ? 'Weights are heavy — full recovery between sets.' : 'Focus on the squeeze, not the weight.'}`,
    days: [
      // Day 1 — Upper Heavy
      {
        title: 'Upper Body — Heavy',
        sub: 'Day 1 — Upper Heavy',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Barbell Bench Press', 4, main, 'Arch slightly. Bar to lower chest. Full ROM.', 'chest_multi'),
            ex('Incline DB Press', 3, acc, '30° incline. Squeeze at top. Slow negative.', 'chest_multi'),
          ]},
          { name: 'BACK', exercises: [
            ex('Barbell Row (Overhand)', 4, main, 'Hinge 45°. Pull to lower chest. Control down.', 'back_multi'),
            ex('Weighted Pull-Up', 3, main, 'Full hang. Chin over bar. Slow descent.', 'back_multi'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('Barbell Overhead Press', 3, main, 'Standing. Core tight. Full lockout.', 'shoulders'),
          ]},
          { name: 'ARMS', exercises: [
            ex('EZ-Bar Curl', 3, acc, 'No swinging. Full extension at bottom.', 'biceps'),
            ex('Close-Grip Bench Press', 3, acc, 'Elbows tucked. Tricep focus.', 'triceps'),
          ]},
        ],
      },
      // Day 2 — Lower Heavy
      {
        title: 'Lower Body — Heavy',
        sub: 'Day 2 — Lower Heavy',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Barbell Back Squat', 4, main, 'Depth below parallel. Drive knees out.', 'legs_multi'),
            ex('Bulgarian Split Squat', 3, acc, 'Torso upright. Front heel drive.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Romanian Deadlift', 4, main, 'Hip hinge. Hamstring stretch. Neutral spine.', 'legs_multi'),
            ex('Lying Leg Curl', 3, acc, 'Full ROM. Slow negative.', 'legs_single'),
          ]},
          { name: 'GLUTES', exercises: [
            ex('Hip Thrust (Barbell)', 3, acc, 'Full extension at top. Squeeze hard.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Standing Calf Raise', 4, '12–20', 'Full stretch at bottom. Pause at top.', 'calves'),
          ]},
        ],
      },
      // Day 3 — Upper Volume
      {
        title: 'Upper Body — Volume',
        sub: 'Day 3 — Upper Volume',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Incline Barbell Press', 4, main, '30° incline. Control down, explode up.', 'chest_multi'),
            ex('Pec Deck Fly', 3, acc, 'Lead with elbows. Slow 3-sec negative.', 'chest_single'),
            ex('Cable Crossover', 3, acc, 'Low cables. Cross hands at bottom.', 'chest_single'),
          ]},
          { name: 'BACK', exercises: [
            ex('Seated Cable Row', 4, main, 'Chest up. Drive elbows back. Full contraction.', 'back_single'),
            ex('Wide-Grip Lat Pulldown', 3, acc, 'Pull to upper chest. Elbows down and back.', 'back_single'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('DB Lateral Raise', 4, acc, 'Controlled. Slight lean forward.', 'shoulders'),
            ex('Cable Face Pull', 3, acc, 'Rope to forehead. Elbows high.', 'shoulders'),
          ]},
          { name: 'ARMS', exercises: [
            ex('Incline DB Curl', 3, acc, 'Elbows behind body for stretch.', 'biceps'),
            ex('Overhead Tricep Extension (Cable)', 3, acc, 'Full stretch. Elbows close to head.', 'triceps'),
          ]},
        ],
      },
      // Day 4 — Lower Volume
      {
        title: 'Lower Body — Volume',
        sub: 'Day 4 — Lower Volume',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Leg Press', 4, main, 'Feet mid-platform. Full ROM. No lockout.', 'legs_multi'),
            ex('Leg Extension', 3, acc, 'Pause at top. 3-sec negative.', 'legs_single'),
            ex('Walking Lunge', 3, acc, 'Step long. Torso upright. Alternate legs.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Conventional Deadlift', 4, main, 'Brace hard. Drive floor away.', 'back_multi'),
            ex('Seated Leg Curl', 3, acc, 'Full ROM. Control the negative.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Seated Calf Raise', 4, '15–20', 'Knees at 90°. Full stretch.', 'calves'),
          ]},
          { name: 'ABS', exercises: [
            ex('Cable Crunch', 3, acc, 'Kneel. Crunch elbows to knees.', 'abs'),
            ex('Hanging Leg Raise', 3, '10–15', 'No swinging. Posterior pelvic tilt at top.', 'abs'),
          ]},
        ],
      },
    ],
  }
}

const UPPER_LOWER_CLASSIC = {
  name: 'Upper / Lower Classic',
  description: 'An 8-week bodybuilder-style upper/lower split. Four days a week: two upper sessions and two lower sessions, each pairing a heavy strength day with a volume day. Rep ranges wave downward across 8 weeks — from hypertrophy work (10–12) all the way to near-max strength (4–6).',
  duration_weeks: 8,
  days_per_week: 4,
  goal_tag: 'bulk',
  difficulty: 'intermediate',
  structure: {
    weeks: Array.from({ length: 8 }, (_, i) => makeULWeek(i)),
    swap_options: SWAP_OPTIONS,
  },
}

// ── Program 7: Rotating Split (Endless) ──────────────────────────────────────
// 5-day rotation (Push / Pull / Legs / Upper / Full Body) over a 6-day week.
// Day 6 is built-in active rest. Designed to repeat — complete it and start again.

const ROT_REPS_EARLY  = '10–12'
const ROT_REPS_MID    = '8–10'
const ROT_REPS_HEAVY  = '6–8'

function makeRotatingWeek(wk) {
  const r = wk < 2 ? ROT_REPS_EARLY : wk < 4 ? ROT_REPS_MID : ROT_REPS_HEAVY
  const sets = 3

  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${r} reps</b> on all exercises. ${wk === 0 ? 'First week — get familiar with the rotation. Move well, not heavy.' : wk === 2 ? 'Week 3 bump — add weight if last week felt comfortable across all sets.' : wk === 4 ? 'Week 5 bump — push heavier. Same reps, more weight.' : 'Keep executing.'}`,
    days: [
      // Day 1 — Push
      {
        title: 'Push — Chest · Shoulders · Triceps',
        sub: 'Day 1 — Push',
        groups: [
          { name: 'CHEST', exercises: [
            ex('Barbell Bench Press', sets, r, 'Controlled descent. Drive through bar.', 'chest_multi'),
            ex('Incline DB Press', sets, r, 'Full press. Squeeze at top.', 'chest_multi'),
            ex('Pec Deck Fly', sets, r, 'Slow negative. Lead with elbows.', 'chest_single'),
          ]},
          { name: 'SHOULDERS', exercises: [
            ex('DB Shoulder Press', sets, r, 'Seated or standing. Full lockout.', 'shoulders'),
            ex('DB Lateral Raise', sets, r, 'Controlled. Slight forward lean.', 'shoulders'),
          ]},
          { name: 'TRICEPS', exercises: [
            ex('Cable Pushdown (Rope)', sets, r, 'Spread rope. Elbows pinned.', 'triceps'),
          ]},
        ],
      },
      // Day 2 — Pull
      {
        title: 'Pull — Back · Biceps · Rear Delt',
        sub: 'Day 2 — Pull',
        groups: [
          { name: 'BACK', exercises: [
            ex('Pull-Up / Lat Pulldown', sets, r, 'Full hang. Lead elbows down and back.', 'back_multi'),
            ex('Barbell Row', sets, r, 'Hinge 45°. Bar to lower chest.', 'back_multi'),
            ex('Seated Cable Row', sets, r, 'Chest up. Full contraction.', 'back_single'),
          ]},
          { name: 'REAR DELT', exercises: [
            ex('Cable Face Pull', sets, r, 'Rope to forehead. Elbows wide and high.', 'shoulders'),
          ]},
          { name: 'BICEPS', exercises: [
            ex('Barbell Curl', sets, r, 'No swinging. Full extension.', 'biceps'),
            ex('DB Hammer Curl', sets, r, 'Neutral grip. Alternate arms.', 'biceps'),
          ]},
        ],
      },
      // Day 3 — Legs
      {
        title: 'Legs — Quads · Hamstrings · Calves',
        sub: 'Day 3 — Legs',
        groups: [
          { name: 'QUADS', exercises: [
            ex('Barbell Back Squat', sets, r, 'Depth below parallel. Drive knees out.', 'legs_multi'),
            ex('Leg Press', sets, r, 'Full ROM. Don\'t lock out.', 'legs_multi'),
            ex('Leg Extension', sets, r, 'Pause at top. 3-sec negative.', 'legs_single'),
          ]},
          { name: 'HAMSTRINGS', exercises: [
            ex('Romanian Deadlift', sets, r, 'Hip hinge. Feel the stretch.', 'legs_multi'),
            ex('Lying Leg Curl', sets, r, 'Full ROM. Controlled negative.', 'legs_single'),
          ]},
          { name: 'CALVES', exercises: [
            ex('Standing Calf Raise', sets, '15–20', 'Full stretch at bottom.', 'calves'),
          ]},
        ],
      },
      // Day 4 — Upper
      {
        title: 'Upper Body — Balanced',
        sub: 'Day 4 — Upper',
        groups: [
          { name: 'PUSH', exercises: [
            ex('Barbell Overhead Press', sets, r, 'Standing. Core tight. Full lockout.', 'shoulders'),
            ex('Incline Barbell Press', sets, r, '30° incline. Control down.', 'chest_multi'),
          ]},
          { name: 'PULL', exercises: [
            ex('Weighted Pull-Up', sets, r, 'Full hang. Chin over bar.', 'back_multi'),
            ex('T-Bar Row', sets, r, 'Chest supported. Mid-back focus.', 'back_multi'),
          ]},
          { name: 'ISOLATION', exercises: [
            ex('Cable Lateral Raise', sets, r, 'Constant tension. Controlled.', 'shoulders'),
            ex('EZ-Bar Curl', sets, r, 'Full extension at bottom.', 'biceps'),
            ex('Overhead Tricep Extension', sets, r, 'Elbows close. Full stretch.', 'triceps'),
          ]},
        ],
      },
      // Day 5 — Full Body
      {
        title: 'Full Body — Compound Focus',
        sub: 'Day 5 — Full Body',
        groups: [
          { name: 'LOWER', exercises: [
            ex('Conventional Deadlift', sets, r, 'Brace hard. Drive floor away.', 'back_multi'),
            ex('Bulgarian Split Squat', sets, r, 'Torso upright. Full depth.', 'legs_single'),
          ]},
          { name: 'UPPER PUSH', exercises: [
            ex('DB Bench Press', sets, r, 'Full ROM. Controlled.', 'chest_multi'),
            ex('DB Shoulder Press', sets, r, 'Full lockout overhead.', 'shoulders'),
          ]},
          { name: 'UPPER PULL', exercises: [
            ex('Barbell Row', sets, r, 'Hinge 45°. Pull to lower chest.', 'back_multi'),
            ex('Face Pull', sets, r, 'Rope to forehead. Elbows high.', 'shoulders'),
          ]},
          { name: 'CORE', exercises: [
            ex('Plank', sets, '45–60s', 'Neutral spine. Squeeze abs and glutes.', 'abs'),
            ex('Hanging Leg Raise', sets, '10–15', 'No swinging. Pelvic tilt at top.', 'abs'),
          ]},
        ],
      },
      // Day 6 — Active Rest / Mobility
      {
        title: 'Active Rest — Mobility & Recovery',
        sub: 'Day 6 — Rest / Mobility',
        groups: [
          { name: 'MOBILITY', exercises: [
            ex('Hip Flexor Stretch', 2, '60s each', 'Lunge position. Push hips forward. Hold.', 'abs'),
            ex('Thoracic Rotation', 2, '10 each side', 'Seated or kneeling. Open chest fully.', 'abs'),
            ex('Band Pull-Apart', 2, '15–20', 'Arms straight. Squeeze shoulder blades.', 'shoulders'),
            ex('Cat-Cow', 2, '10', 'Slow breath. Full spine flexion and extension.', 'abs'),
          ]},
        ],
      },
    ],
  }
}

const ROTATING_SPLIT = {
  name: 'Rotating Split',
  description: 'A continuous 5-day rotation (Push · Pull · Legs · Upper · Full Body) designed to run indefinitely. Train 6 days, rest 1 — but the rotation doesn\'t reset on a calendar week, so rest happens naturally. Complete the 6-week block and repeat. Small weight bumps at weeks 3 and 5.',
  duration_weeks: 6,
  days_per_week: 6,
  goal_tag: 'maintain',
  difficulty: 'beginner',
  structure: {
    weeks: Array.from({ length: 6 }, (_, i) => makeRotatingWeek(i)),
    swap_options: SWAP_OPTIONS,
  },
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const NEW_PROGRAMS = [PUSH_PULL_LEGS, UPPER_LOWER_CLASSIC, ROTATING_SPLIT]

// ── Seed (only runs when executed directly, not when imported) ───────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: dotenv } = await import('dotenv/config')
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log(`Seeding ${NEW_PROGRAMS.length} new programs...`)
  const { data, error } = await supabase
    .from('programs')
    .insert(NEW_PROGRAMS)
    .select('id, name')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log('Seeded programs:')
  data.forEach(p => console.log(` ✓ ${p.name} (${p.id})`))
}
