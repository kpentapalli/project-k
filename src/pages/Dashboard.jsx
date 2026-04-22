import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'
import WeightSection from '../components/WeightSection'

const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs']

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function heatLabel(days) {
  if (days === 999) return 'Never'
  if (days === 0)   return 'Rest!'
  if (days === 1)   return 'Rest!'
  if (days === 2)   return 'Sore'
  if (days <= 4)    return 'Ready'
  return 'Fresh'
}

// Recovery % — assumes ~3 days to full recovery
function recoveryPct(days) {
  if (days === 999) return 100
  return Math.min(100, Math.round((days / 3) * 100))
}

function recoveryColor(pct) {
  if (pct >= 80) return 'var(--acc)'
  if (pct >= 45) return 'var(--warn)'
  return 'var(--danger)'
}

function calcStreak(logs) {
  if (!logs.length) return 0
  const dates = [...new Set(logs.map(l => l.completed_at.slice(0, 10)))].sort().reverse()
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (const d of dates) {
    const logDate = new Date(d)
    const diff = Math.round((cursor - logDate) / 86400000)
    if (diff > 1) break
    streak++
    cursor = logDate
  }
  return streak
}

// Build 8-week frequency buckets for the bar chart
function buildWeeks(logs) {
  const now = Date.now()
  return Array.from({ length: 8 }, (_, wi) => {
    const i = 7 - wi                               // i=7 = oldest, i=0 = this week
    const end = now - i * 7 * 86400000
    const start = end - 7 * 86400000
    const count = logs.filter(l => {
      const t = new Date(l.completed_at).getTime()
      return t >= start && t < end
    }).length
    const d = new Date(start)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [logsRes, assignRes, weightRes] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('program_assignments')
          .select('*, programs(name, duration_weeks)')
          .eq('user_id', session.user.id)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('logged_at', { ascending: true }),
      ])
      setLogs(logsRes.data || [])
      setAssignment(assignRes.data || null)
      setWeightLogs(weightRes.data || [])
      setLoading(false)
    }
    load()
  }, [session.user.id])

  const streak = calcStreak(logs)
  const currentWeek = assignment
    ? Math.min(
        Math.floor((Date.now() - new Date(assignment.start_date).getTime()) / (7 * 86400000)) + 1,
        assignment?.programs?.duration_weeks || 99
      )
    : null

  // Muscle last-trained lookup
  const muscleLastTrained = {}
  for (const log of logs) {
    for (const muscle of (log.muscle_groups || [])) {
      if (!muscleLastTrained[muscle] || log.completed_at > muscleLastTrained[muscle]) {
        muscleLastTrained[muscle] = log.completed_at
      }
    }
  }

  const weeks = buildWeeks(logs)
  const maxWeekCount = Math.max(...weeks.map(w => w.count), 1)

  if (loading) return <div className="loading-screen">Loading...</div>

  return (
    <div className="page">
      <TopBar active="dashboard" />
      <FeedbackButton />

      <div className="page-content">
        <div className="hero">
          <div className="hero-label">PROJECT K</div>
          <h1 className="hero-title">YOUR DASHBOARD</h1>
          {profile?.full_name && (
            <p className="hero-sub">Welcome back, {profile.full_name.split(' ')[0]}.</p>
          )}
        </div>

        {!assignment ? (
          <div className="holding-state">
            <div className="holding-icon">⏳</div>
            <h2>Your program is being set up</h2>
            <p>Check back soon — your program will appear here once it's assigned.</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{logs.length}</div>
                <div className="stat-label">Workouts Done</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">W{currentWeek}</div>
                <div className="stat-label">Current Week</div>
              </div>
            </div>

            {/* ── Weight progress ── */}
            <WeightSection
              logs={weightLogs}
              profile={profile}
              userId={session.user.id}
              onLogAdded={entry => setWeightLogs(prev => [...prev, entry])}
            />

            {/* ── Muscle Recovery ── */}
            <section className="section">
              <div className="section-title">Muscle Recovery</div>
              <div className="muscle-grid">
                {MUSCLES.map(muscle => {
                  const days = daysSince(muscleLastTrained[muscle])
                  const pct  = recoveryPct(days)
                  const col  = recoveryColor(pct)
                  return (
                    <div className="muscle-card" key={muscle}>
                      <div className="muscle-name">{muscle}</div>
                      <div className="muscle-status" style={{ color: col }}>
                        {heatLabel(days)}
                      </div>
                      <div className="muscle-bar-wrap">
                        <div
                          className="muscle-bar-fill"
                          style={{ width: `${pct}%`, background: col }}
                        />
                      </div>
                      <div className="muscle-days">
                        {days === 999 ? '—' : days === 0 ? 'today' : `${days}d ago`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Workout Frequency ── */}
            <section className="section">
              <div className="section-title">Workout Frequency</div>
              <div className="freq-chart">
                {weeks.map((w, i) => (
                  <div key={i} className="freq-col">
                    <div className="freq-count-label">
                      {w.count > 0 ? w.count : ''}
                    </div>
                    <div className="freq-bar-wrap">
                      <div
                        className={`freq-bar ${w.count === 0 ? 'freq-bar-zero' : ''}`}
                        style={{ height: `${w.count === 0 ? 4 : Math.max((w.count / maxWeekCount) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="freq-label">{w.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Recent Workouts ── */}
            <section className="section">
              <div className="section-title">Recent Workouts</div>
              {logs.length === 0 ? (
                <p className="empty-state">No workouts logged yet. Head to your program to get started.</p>
              ) : (
                <div className="log-list">
                  {logs.slice(0, 8).map(log => (
                    <div className="log-item" key={log.id}>
                      <div className="log-date">
                        {new Date(log.completed_at).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </div>
                      <div className="log-title">
                        {log.day_title || `Week ${log.week_index + 1} · Day ${log.day_index + 1}`}
                      </div>
                      <div className="log-muscles">{(log.muscle_groups || []).join(' · ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
