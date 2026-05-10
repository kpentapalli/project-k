// Run: node scripts/seed-sport-programs.js
// Seeds sport-specific programs for swimming, cycling, running, golf, and tennis.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env

function ex(name, sets, reps, note, swap_category) {
  return { name, sets, reps, note, swap_category }
}

const SPORT_SWAP_OPTIONS = {
  chest_multi: [
    { name: 'Push-Up', note: 'Body straight. Stop 1-2 reps before form breaks.' },
    { name: 'DB Bench Press', note: 'Neutral grip if shoulders need room.' },
    { name: 'Landmine Press', note: 'Shoulder-friendly press with trunk control.' },
    { name: 'Machine Chest Press', note: 'Stable option when fatigue is high.' },
  ],
  chest_single: [
    { name: 'Cable Fly', note: 'Light load. Keep rib cage down.' },
    { name: 'DB Fly', note: 'Small bend in elbows. No deep painful stretch.' },
    { name: 'Pec Deck Fly', note: 'Smooth tempo and controlled range.' },
  ],
  triceps: [
    { name: 'Cable Pushdown', note: 'Elbows pinned. Smooth lockout.' },
    { name: 'Close-Grip Push-Up', note: 'Keep shoulders away from ears.' },
    { name: 'Overhead Cable Extension', note: 'Use light load and full control.' },
  ],
  abs: [
    { name: 'Dead Bug', note: 'Low back stays quiet. Exhale on reach.' },
    { name: 'Pallof Press', note: 'Resist rotation. Ribs down.' },
    { name: 'Side Plank', note: 'Straight line from head to heel.' },
    { name: 'Farmer Carry', note: 'Tall posture. Quiet ribs and hips.' },
  ],
  shoulders: [
    { name: 'Cable Face Pull', note: 'Rope to forehead. Rotate thumbs back.' },
    { name: 'Band External Rotation', note: 'Elbow by side. Light, clean reps.' },
    { name: 'Scapular Wall Slide', note: 'Slow reach without shrugging.' },
    { name: 'DB Lateral Raise', note: 'Light load. Stop below shoulder height if needed.' },
  ],
  legs_multi: [
    { name: 'Trap Bar Deadlift', note: 'Brace first. Push the floor away.' },
    { name: 'Front Squat', note: 'Tall torso. Smooth depth.' },
    { name: 'Goblet Squat', note: 'Great low-soreness substitute.' },
    { name: 'Romanian Deadlift', note: 'Hinge from hips. Hamstrings loaded.' },
  ],
  legs_single: [
    { name: 'Step-Up', note: 'Drive through full foot. Control down.' },
    { name: 'Split Squat', note: 'Vertical shin if knees are sensitive.' },
    { name: 'Single-Leg RDL', note: 'Square hips. Reach long through back leg.' },
    { name: 'Lateral Lunge', note: 'Sit into hip. Trail leg stays long.' },
  ],
  calves: [
    { name: 'Standing Calf Raise', note: 'Full stretch, full rise, controlled tempo.' },
    { name: 'Soleus Raise', note: 'Knee bent. Pause at top.' },
    { name: 'Tibialis Raise', note: 'Lean against wall. Lift toes toward shins.' },
  ],
  back_multi: [
    { name: 'Chest-Supported Row', note: 'No low-back cost. Pull elbows back.' },
    { name: 'Seated Cable Row', note: 'Tall chest. Pause at the body.' },
    { name: 'Pull-Up / Lat Pulldown', note: 'Lead elbows down, not chin up.' },
    { name: '1-Arm DB Row', note: 'Support on bench. Pull elbow to hip.' },
  ],
  back_single: [
    { name: 'Straight-Arm Pulldown', note: 'Arms long. Feel lats, not triceps.' },
    { name: 'Band Pulldown', note: 'Easy recovery-day pulling option.' },
    { name: 'Cable Row ISO Hold', note: 'Hold squeeze without leaning back.' },
  ],
  traps: [
    { name: 'Farmer Carry', note: 'Heavy enough to challenge posture.' },
    { name: 'Suitcase Carry', note: 'One side loaded. Do not lean.' },
    { name: 'DB Shrug', note: 'Lift straight up. No rolling.' },
  ],
  biceps: [
    { name: 'DB Hammer Curl', note: 'Neutral grip. Elbow-friendly.' },
    { name: 'Cable Curl', note: 'Constant tension and clean tempo.' },
    { name: 'EZ-Bar Curl', note: 'Use if wrists prefer angled grip.' },
  ],
}

const PHASES = [
  { label: 'Base', main: '8-10', acc: '10-12', power: '4-5', mobility: '30-45s', setDelta: 0 },
  { label: 'Build', main: '6-8', acc: '8-10', power: '3-5', mobility: '45-60s', setDelta: 0 },
  { label: 'Deload', main: '8-10', acc: '10-12', power: '3-4', mobility: '30-45s', setDelta: -1 },
  { label: 'Peak Support', main: '4-6', acc: '6-8', power: '3-4', mobility: '45-60s', setDelta: 0 },
]

function phaseForWeek(wk) {
  if (wk < 2) return PHASES[0]
  if (wk === 2) return PHASES[1]
  if (wk === 3) return PHASES[2]
  return PHASES[3]
}

function sets(base, phase) {
  return Math.max(1, base + phase.setDelta)
}

function makeWeek(wk, dayFactory) {
  const p = phaseForWeek(wk)
  return {
    label: `Week ${wk + 1}`,
    rep_note: `<b>${p.label}.</b> Supplemental training only. Keep 1-3 reps in reserve and place these sessions after hard sport days or at least 24 hours before key practices.${wk === 3 ? ' Deload week: volume drops so the sport work can absorb.' : ''}`,
    days: dayFactory(p),
  }
}

function makeSwimmingDays(p) {
  return [
    {
      title: 'Swim Support A - Pull Strength',
      sub: 'Day 1 - Upper pull, shoulder durability, trunk',
      groups: [
        { name: 'PULL STRENGTH', exercises: [
          ex('Pull-Up / Lat Pulldown', sets(3, p), p.main, 'Full reach, ribs down. Stop short of shoulder irritation.', 'back_multi'),
          ex('Chest-Supported Row', sets(3, p), p.acc, 'Support the torso so the lats and mid-back do the work.', 'back_multi'),
          ex('Straight-Arm Pulldown', sets(2, p), p.acc, 'Mimic the catch. Long arms and controlled sweep.', 'back_single'),
        ]},
        { name: 'SHOULDER CARE', exercises: [
          ex('Cable Face Pull', sets(2, p), '12-15', 'Rope to forehead. Rotate thumbs back.', 'shoulders'),
          ex('Band External Rotation', sets(2, p), '15 each', 'Light burn only. Elbow stays close.', 'shoulders'),
        ]},
        { name: 'CORE', exercises: [
          ex('Dead Bug', sets(3, p), '8 each', 'Exhale hard. Keep low back quiet.', 'abs'),
          ex('Side Plank', sets(2, p), p.mobility, 'Long line. Do not sag through the hips.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Swim Support B - Hips & Trunk',
      sub: 'Day 2 - Lower body strength without shoulder load',
      groups: [
        { name: 'LOWER STRENGTH', exercises: [
          ex('Trap Bar Deadlift', sets(3, p), p.main, 'Brace hard. Moderate load, no grinding.', 'legs_multi'),
          ex('Rear-Foot Elevated Split Squat', sets(3, p), p.acc, 'Front heel heavy. Smooth depth.', 'legs_single'),
          ex('Hip Thrust', sets(3, p), p.acc, 'Full hip extension. Pause at top.', 'legs_single'),
        ]},
        { name: 'TRUNK CONTROL', exercises: [
          ex('Pallof Press', sets(3, p), '10 each', 'Resist rotation. Ribs down.', 'abs'),
          ex('Farmer Carry', sets(3, p), '30-40m', 'Tall posture. Quiet shoulders.', 'traps'),
        ]},
      ],
    },
    {
      title: 'Swim Recovery - Mobility & Prehab',
      sub: 'Day 3 - Low load recovery session',
      groups: [
        { name: 'MOBILITY', exercises: [
          ex('Thoracic Rotation', sets(2, p), '10 each', 'Open the chest without forcing the low back.', 'abs'),
          ex('Lat Stretch', sets(2, p), p.mobility, 'Breathe into the side body.', 'back_single'),
          ex('Pec Doorway Stretch', sets(2, p), p.mobility, 'Gentle stretch. No numbness or tingling.', 'chest_single'),
          ex('Scapular Wall Slide', sets(2, p), '10-12', 'Reach up without shrugging.', 'shoulders'),
          ex('Ankle Rocker Mobility', sets(2, p), '10 each', 'Knee tracks over toes for better kick mechanics.', 'calves'),
        ]},
      ],
    },
  ]
}

function makeCyclingDays(p) {
  return [
    {
      title: 'Cycling Support A - Max Strength',
      sub: 'Day 1 - Heavy lower body after a hard ride',
      groups: [
        { name: 'LOWER STRENGTH', exercises: [
          ex('Front Squat', sets(4, p), p.main, 'Tall torso. Stop with speed still in the rep.', 'legs_multi'),
          ex('Romanian Deadlift', sets(3, p), p.acc, 'Hamstrings loaded. Neutral spine.', 'legs_multi'),
          ex('Bulgarian Split Squat', sets(3, p), p.acc, 'Single-leg force without chasing soreness.', 'legs_single'),
        ]},
        { name: 'CALVES', exercises: [
          ex('Standing Calf Raise', sets(3, p), '10-12', 'Full range. Pause at top.', 'calves'),
        ]},
        { name: 'CORE', exercises: [
          ex('Plank With Reach', sets(3, p), '8 each', 'Reach without shifting hips.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Cycling Support B - Single-Leg Balance',
      sub: 'Day 2 - Hip stability and posterior chain',
      groups: [
        { name: 'SINGLE-LEG', exercises: [
          ex('Step-Up', sets(3, p), p.acc, 'Drive through full foot. Control the descent.', 'legs_single'),
          ex('Single-Leg Romanian Deadlift', sets(3, p), p.acc, 'Square hips. Reach long.', 'legs_single'),
          ex('Hamstring Curl', sets(3, p), '10-12', 'Controlled negative. No hip lift.', 'legs_single'),
        ]},
        { name: 'ADDUCTORS & CORE', exercises: [
          ex('Copenhagen Plank', sets(2, p), '20-30s each', 'Short lever if needed. Keep hips high.', 'legs_single'),
          ex('Pallof Press', sets(3, p), '10 each', 'Anti-rotation for stable pedaling.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Cycling Recovery - Mobility',
      sub: 'Day 3 - Undo cycling posture',
      groups: [
        { name: 'MOBILITY', exercises: [
          ex('Couch Stretch', sets(2, p), p.mobility, 'Glute squeezed. Ribs down.', 'legs_single'),
          ex('Hip Flexor Stretch', sets(2, p), p.mobility, 'Long exhale in the stretch.', 'legs_single'),
          ex('Thoracic Extension', sets(2, p), '8-10', 'Open upper back over roller or bench.', 'abs'),
          ex('Glute Bridge', sets(2, p), '12-15', 'Wake up glutes without fatigue.', 'legs_single'),
          ex('Neck Isometric Hold', sets(2, p), '10s each', 'Gentle pressure in four directions.', 'traps'),
        ]},
      ],
    },
  ]
}

function makeRunningDays(p) {
  return [
    {
      title: 'Run Support A - Strength & Tendons',
      sub: 'Day 1 - Durable legs after workout day',
      groups: [
        { name: 'LOWER STRENGTH', exercises: [
          ex('Trap Bar Deadlift', sets(3, p), p.main, 'Strong but not maximal. Leave reps in reserve.', 'legs_multi'),
          ex('Rear-Foot Elevated Split Squat', sets(3, p), p.acc, 'Control knee track and hip position.', 'legs_single'),
        ]},
        { name: 'LOWER LEG', exercises: [
          ex('Standing Calf Raise', sets(3, p), '8-12', 'Heavy enough to matter. Full range.', 'calves'),
          ex('Soleus Raise', sets(3, p), '12-15', 'Bent knee. Pause at the top.', 'calves'),
          ex('Tibialis Raise', sets(2, p), '15-20', 'Lift toes toward shins.', 'calves'),
        ]},
        { name: 'CORE', exercises: [
          ex('Side Plank', sets(2, p), p.mobility, 'Pelvis stacked. Breathe calmly.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Run Support B - Elasticity & Control',
      sub: 'Day 2 - Low-volume plyometrics and hip stability',
      groups: [
        { name: 'STABILITY', exercises: [
          ex('Step-Down', sets(3, p), '8 each', 'Slow lower. Knee tracks over toes.', 'legs_single'),
          ex('Single-Leg Romanian Deadlift', sets(3, p), p.acc, 'Balance first, load second.', 'legs_single'),
          ex('Lateral Lunge', sets(2, p), '6 each', 'Load the hip. Keep trail leg long.', 'legs_single'),
        ]},
        { name: 'ELASTICITY', exercises: [
          ex('Pogo Hop', sets(3, p), '20s', 'Quick contacts. Stop if calves tighten.', 'calves'),
          ex('A-Skip', sets(3, p), '20m', 'Tall posture. Rhythm over height.', 'legs_single'),
        ]},
        { name: 'CORE', exercises: [
          ex('Dead Bug', sets(3, p), '8 each', 'Control pelvis as limbs move.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Run Recovery - Mobility & Feet',
      sub: 'Day 3 - Tissue care between runs',
      groups: [
        { name: 'MOBILITY', exercises: [
          ex('Soleus Mobility Rock', sets(2, p), '10 each', 'Knee forward with heel down.', 'calves'),
          ex('Hip Flexor Stretch', sets(2, p), p.mobility, 'Glute squeezed. Tall spine.', 'legs_single'),
          ex('Hamstring Floss', sets(2, p), '10 each', 'Move gently through range.', 'legs_single'),
          ex('Short-Foot Drill', sets(2, p), '8 each', 'Create arch without curling toes.', 'calves'),
          ex('Big Toe Extension', sets(2, p), p.mobility, 'Gentle pressure. No sharp pain.', 'calves'),
        ]},
      ],
    },
  ]
}

function makeGolfDays(p) {
  return [
    {
      title: 'Golf Support A - Lower Force & Rotation',
      sub: 'Day 1 - Build force transfer into the swing',
      groups: [
        { name: 'POWER', exercises: [
          ex('Medicine Ball Rotational Throw', sets(4, p), `${p.power} each`, 'Explosive reps. Rest fully between sets.', 'abs'),
          ex('Box Jump', sets(3, p), '3', 'Land quietly. Stop before fatigue.', 'legs_multi'),
        ]},
        { name: 'LOWER STRENGTH', exercises: [
          ex('Trap Bar Deadlift', sets(4, p), p.main, 'Brace and drive. No grinding.', 'legs_multi'),
          ex('Lateral Lunge', sets(3, p), p.acc, 'Load the trail hip like a backswing.', 'legs_single'),
          ex('Split Squat', sets(3, p), p.acc, 'Strong base. Smooth control.', 'legs_single'),
        ]},
        { name: 'CORE', exercises: [
          ex('Cable Chop', sets(3, p), '8 each', 'Rotate through upper back and hips together.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Golf Support B - Upper & Trunk',
      sub: 'Day 2 - Shoulder-safe strength and anti-rotation',
      groups: [
        { name: 'UPPER STRENGTH', exercises: [
          ex('Landmine Press', sets(3, p), p.acc, 'Press through a natural arc. Ribs down.', 'shoulders'),
          ex('1-Arm Cable Row', sets(3, p), p.acc, 'Reach and row without twisting open.', 'back_multi'),
          ex('Push-Up', sets(3, p), '8-12', 'Body straight. Smooth tempo.', 'chest_multi'),
        ]},
        { name: 'SHOULDER CARE', exercises: [
          ex('Cable Face Pull', sets(3, p), '12-15', 'Rear delt and external rotation focus.', 'shoulders'),
        ]},
        { name: 'CORE', exercises: [
          ex('Pallof Press', sets(3, p), '10 each', 'Own the trunk before rotating fast.', 'abs'),
          ex('Side Plank With Rotation', sets(2, p), '8 each', 'Rotate from upper back, not low back.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Golf Speed - Mobility & Power',
      sub: 'Day 3 - Fresh speed, hips, and T-spine',
      groups: [
        { name: 'SPEED', exercises: [
          ex('Medicine Ball Scoop Toss', sets(4, p), `${p.power} each`, 'Fast intent. Reset every rep.', 'abs'),
          ex('Broad Jump', sets(4, p), '3', 'Stick the landing. Full recovery.', 'legs_multi'),
        ]},
        { name: 'MOBILITY', exercises: [
          ex('Hip Internal Rotation Drill', sets(2, p), '8 each', 'Move slowly through clean range.', 'legs_single'),
          ex('Open Book Thoracic Rotation', sets(2, p), '8 each', 'Let the shoulder follow the rib cage.', 'abs'),
          ex('Lat Stretch', sets(2, p), p.mobility, 'Breathe into the rib cage.', 'back_single'),
          ex('Wrist Flexor Stretch', sets(2, p), p.mobility, 'Light stretch for hands and forearms.', 'biceps'),
        ]},
      ],
    },
  ]
}

function makeTennisDays(p) {
  return [
    {
      title: 'Tennis Support A - Lateral Strength',
      sub: 'Day 1 - Braking, hips, calves, trunk',
      groups: [
        { name: 'LOWER STRENGTH', exercises: [
          ex('Front Squat', sets(3, p), p.main, 'Strong posture. No grind before court work.', 'legs_multi'),
          ex('Lateral Lunge', sets(3, p), p.acc, 'Load hip and push back to start.', 'legs_single'),
          ex('Rear-Foot Elevated Split Squat', sets(3, p), p.acc, 'Control deceleration through front leg.', 'legs_single'),
        ]},
        { name: 'ADDUCTORS & CALVES', exercises: [
          ex('Copenhagen Plank', sets(2, p), '20-30s each', 'Adductor strength for lateral coverage.', 'legs_single'),
          ex('Standing Calf Raise', sets(3, p), '10-12', 'Strong ankles for repeated split steps.', 'calves'),
        ]},
        { name: 'CORE', exercises: [
          ex('Pallof Press', sets(3, p), '10 each', 'Resist rotation before changing direction.', 'abs'),
        ]},
      ],
    },
    {
      title: 'Tennis Support B - Upper & Rotation',
      sub: 'Day 2 - Shoulder, elbow, and trunk resilience',
      groups: [
        { name: 'UPPER STRENGTH', exercises: [
          ex('Landmine Press', sets(3, p), p.acc, 'Shoulder-friendly press. Smooth lockout.', 'shoulders'),
          ex('1-Arm Row', sets(3, p), p.acc, 'Pull elbow to hip. Do not shrug.', 'back_multi'),
          ex('Push-Up', sets(3, p), '8-12', 'Stable shoulder blade. Stop short of fatigue.', 'chest_multi'),
        ]},
        { name: 'ROTATION', exercises: [
          ex('Cable Rotation', sets(3, p), '8 each', 'Hips and ribs turn together.', 'abs'),
          ex('Medicine Ball Rotational Throw', sets(4, p), `${p.power} each`, 'Explosive, low fatigue reps.', 'abs'),
        ]},
        { name: 'ARM CARE', exercises: [
          ex('Band External Rotation', sets(2, p), '15 each', 'Light and precise.', 'shoulders'),
          ex('Wrist Extension', sets(2, p), '12-15', 'Forearm support for elbow tolerance.', 'biceps'),
        ]},
      ],
    },
    {
      title: 'Tennis Speed - Agility & Recovery',
      sub: 'Day 3 - Short, crisp court movement support',
      groups: [
        { name: 'AGILITY', exercises: [
          ex('Split-Step Reaction Drill', sets(4, p), '15-20s', 'Crisp feet. Stop while sharp.', 'calves'),
          ex('Lateral Shuffle to Sprint', sets(4, p), '10-15m', 'Push hard, brake under control.', 'legs_single'),
          ex('5-10-5 Shuttle', sets(3, p), '1 rep', 'Quality over conditioning.', 'legs_single'),
          ex('Deceleration Stick', sets(4, p), '1 each', 'Land and freeze with knee stacked.', 'legs_single'),
        ]},
        { name: 'MOBILITY', exercises: [
          ex('Adductor Rockback', sets(2, p), '10 each', 'Gentle range for groin recovery.', 'legs_single'),
          ex('Thoracic Rotation', sets(2, p), '8 each', 'Rotate through upper back.', 'abs'),
          ex('Forearm Mobility', sets(2, p), p.mobility, 'Light wrist and forearm care.', 'biceps'),
        ]},
      ],
    },
  ]
}

function program(name, description, dayFactory) {
  return {
    name,
    description,
    duration_weeks: 6,
    days_per_week: 3,
    goal_tag: 'athletic_performance',
    difficulty: 'intermediate',
    structure: {
      weeks: Array.from({ length: 6 }, (_, i) => makeWeek(i, dayFactory)),
      swap_options: SPORT_SWAP_OPTIONS,
    },
  }
}

export const SPORT_SUPPLEMENTAL_PROGRAMS = [
  program(
    'Swim Performance',
    'A 6-week, 3-day supplemental block for swimmers. It builds pulling strength, shoulder durability, hip drive, trunk control, and recovery mobility without adding unnecessary shoulder fatigue.',
    makeSwimmingDays
  ),
  program(
    'Cycle Performance',
    'A 6-week, 3-day supplemental block for cyclists. It emphasizes posterior chain strength, single-leg control, core stability, and mobility to support riding volume without blunting key bike sessions.',
    makeCyclingDays
  ),
  program(
    'Run Performance',
    'A 6-week, 3-day supplemental block for runners. It targets tissue durability, calves and soleus, hip control, low-volume elasticity, and mobility so strength work supports mileage instead of competing with it.',
    makeRunningDays
  ),
  program(
    'Golf Performance',
    'A 6-week, 3-day supplemental block for golfers. It develops rotational power, lower-body force, trunk control, hip and thoracic mobility, and shoulder durability for better swing transfer.',
    makeGolfDays
  ),
  program(
    'Tennis Performance',
    'A 6-week, 3-day supplemental block for tennis players. It builds lateral strength, deceleration, repeat-sprint readiness, rotational power, and shoulder, elbow, and forearm resilience.',
    makeTennisDays
  ),
]

if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: dotenv } = await import('dotenv/config')
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log(`Seeding ${SPORT_SUPPLEMENTAL_PROGRAMS.length} sport supplemental programs...`)

  for (const p of SPORT_SUPPLEMENTAL_PROGRAMS) {
    const { data: existing, error: readError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('name', p.name)
      .maybeSingle()

    if (readError) {
      console.error(`Read failed for ${p.name}:`, readError.message)
      process.exit(1)
    }

    if (existing) {
      console.log(` - Skipped ${p.name} (${existing.id})`)
      continue
    }

    const { data, error } = await supabase
      .from('programs')
      .insert(p)
      .select('id, name')
      .single()

    if (error) {
      console.error(`Seed failed for ${p.name}:`, error.message)
      process.exit(1)
    }

    console.log(` + Seeded ${data.name} (${data.id})`)
  }
}
