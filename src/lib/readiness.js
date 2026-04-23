// Muscle readiness state definitions — unified recovery + neglect model
// Ramp up (days 0–3) → plateau (days 3–7) → decay (days 7+)
// Exported so this table can be surfaced in a future legend or tooltip.

export const READINESS_STATES = [
  { key: 'untrained',  label: 'Never trained',     color: '#ef4444', minDays: null, maxDays: null },
  { key: 'sore',       label: 'Sore — rest today', color: '#ef4444', minDays: 0,   maxDays: 1    },
  { key: 'partial',    label: 'Partial recovery',  color: '#f59e0b', minDays: 2,   maxDays: 2    },
  { key: 'ready',      label: 'Ready to train',    color: '#39ff8a', minDays: 3,   maxDays: 7    },
  { key: 'stale',      label: 'Slightly stale',    color: '#f59e0b', minDays: 8,   maxDays: 10   },
  { key: 'neglected',  label: 'Neglected',         color: '#93c5fd', minDays: 11,  maxDays: 14   },
  { key: 'detraining', label: 'Detraining',        color: '#3b82f6', minDays: 15,  maxDays: null },
]

// Priority for sorting (lower = show first — most actionable)
export const READINESS_PRIORITY = {
  ready:      1,
  partial:    2,
  stale:      3,
  neglected:  4,
  detraining: 5,
  sore:       6,
  untrained:  7,
}

export function getReadinessState(days) {
  if (days === null || days === undefined || days >= 999) return READINESS_STATES[0]
  for (const s of READINESS_STATES.slice(1)) {
    const inMin = s.minDays === null || days >= s.minDays
    const inMax = s.maxDays === null || days <= s.maxDays
    if (inMin && inMax) return s
  }
  return READINESS_STATES[READINESS_STATES.length - 1]
}
