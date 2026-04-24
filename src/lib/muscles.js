// Canonical muscle names used by the dashboard grid.
// Keep in sync with Dashboard.jsx MUSCLES array.
export const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs']

// Every exercise in every seeded program carries a swap_category. These map 1:1
// to a canonical muscle, so the exercise list itself is the source of truth for
// what a workout trained — group names (PUSH, STRENGTH, etc.) are just labels.
export const CATEGORY_TO_MUSCLE = {
  chest_multi:  'Chest',
  chest_single: 'Chest',
  shoulders:    'Shoulders',
  triceps:      'Triceps',
  back_multi:   'Back',
  back_single:  'Back',
  traps:        'Traps',
  biceps:       'Biceps',
  legs_multi:   'Legs',
  legs_single:  'Legs',
  calves:       'Calves',
  abs:          'Abs',
}

// Flatten a program day object into the unique set of muscles trained.
// Walks every exercise's swap_category — ignores group name entirely.
export function musclesFromDay(day) {
  const set = new Set()
  for (const group of day?.groups || []) {
    for (const ex of group.exercises || []) {
      const m = CATEGORY_TO_MUSCLE[ex.swap_category]
      if (m) set.add(m)
    }
  }
  return [...set]
}
