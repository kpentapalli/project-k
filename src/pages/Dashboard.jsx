import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'
import WeightSection from '../components/WeightSection'
import { getReadinessState, READINESS_PRIORITY } from '../lib/readiness'

const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs']

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllWorkouts, setShowAllWorkouts] = useState(false)

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

  // Combined muscle status: readiness state + all-time session count, sorted by priority
  const muscleStatus = MUSCLES.map(muscle => {
    const days  = daysSince(muscleLastTrained[muscle])
    const state = getReadinessState(days)
    const total = logs.filter(l => (l.muscle_groups || []).includes(muscle)).length
    return { muscle, days, total, state }
  }).sort((a, b) => (READINESS_PRIORITY[a.state.key] || 9) - (READINESS_PRIORITY[b.state.key] || 9))

  const maxMuscleCount = Math.max(...muscleStatus.map(m => m.total), 1)

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
            <div className="holding-icon">🏋️</div>
            <h2>No program assigned yet</h2>
            <p>Your trainer will assign a program shortly. Check back soon.</p>
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

            {/* ── Weight & Body Composition ── */}
            <WeightSection
              logs={weightLogs}
              profile={profile}
              userId={session.user.id}
              onLogAdded={entry => setWeightLogs(prev => [...prev, entry])}
            />

            {/* ── Muscle Status ── */}
            <section className="section">
              <div className="section-title">Muscle Status</div>
              <div className="muscle-grid">
                {muscleStatus.map(({ muscle, days, total, state }) => (
                  <div className="muscle-card" key={muscle}>
                    <div className="muscle-name">{muscle}</div>
                    <div className="muscle-status" style={{ color: state.color }}>{state.label}</div>
                    <div className="muscle-bar-wrap">
                      <div
                        className="muscle-bar-fill"
                        style={{
                          width: `${total === 0 ? 0 : Math.max((total / maxMuscleCount) * 100, 6)}%`,
                          background: state.color,
                        }}
                      />
                    </div>
                    <div className="muscle-days">
                      {days >= 999 ? '—' : days === 0 ? 'today' : `${days}d ago`}
                    </div>
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
                <>
                  <div className="log-list">
                    {(showAllWorkouts ? logs.slice(0, 8) : logs.slice(0, 1)).map(log => (
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
                  {logs.length > 1 && (
                    <button className="show-more-btn" onClick={() => setShowAllWorkouts(v => !v)}>
                      {showAllWorkouts ? 'Show less' : `Show ${Math.min(logs.length - 1, 7)} more`}
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
