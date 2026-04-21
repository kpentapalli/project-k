import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'

const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs']

function daysSince(dateStr) {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

function heatLabel(days) {
  if (days === 999) return 'Never'
  if (days <= 1) return 'Rest!'
  if (days === 2) return 'Sore'
  if (days <= 5) return 'Ready'
  return 'Fresh'
}

function heatColor(days) {
  if (days === 999) return 'var(--muted)'
  if (days <= 1) return 'var(--danger)'
  if (days === 2) return 'var(--warn)'
  if (days <= 5) return 'var(--acc)'
  return 'var(--muted)'
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

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [logsRes, assignRes] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('program_assignments')
          .select('*, programs(name)')
          .eq('user_id', session.user.id)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single(),
      ])
      setLogs(logsRes.data || [])
      setAssignment(assignRes.data || null)
      setLoading(false)
    }
    load()
  }, [session.user.id])

  const streak = calcStreak(logs)
  const currentWeek = assignment
    ? Math.floor((Date.now() - new Date(assignment.start_date).getTime()) / (7 * 86400000)) + 1
    : null

  const muscleLastTrained = {}
  for (const log of logs) {
    for (const muscle of (log.muscle_groups || [])) {
      if (!muscleLastTrained[muscle] || log.completed_at > muscleLastTrained[muscle]) {
        muscleLastTrained[muscle] = log.completed_at
      }
    }
  }

  if (loading) return <div className="loading-screen">Loading...</div>

  return (
    <div className="page">
      <TopBar active="dashboard" />
      <FeedbackButton />

      <div className="page-content">
        <div className="hero">
          <div className="hero-label">PROJECT K</div>
          <h1 className="hero-title">YOUR DASHBOARD</h1>
          {profile?.full_name && <p className="hero-sub">Welcome back, {profile.full_name.split(' ')[0]}.</p>}
        </div>

        {!assignment ? (
          <div className="holding-state">
            <div className="holding-icon">⏳</div>
            <h2>Your program is being set up</h2>
            <p>Check back soon — your program will appear here once it's assigned.</p>
          </div>
        ) : (
          <>
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
                <div className="stat-value">W{Math.min(currentWeek, assignment?.programs?.duration_weeks || 99)}</div>
                <div className="stat-label">Current Week</div>
              </div>
            </div>

            <section className="section">
              <div className="section-title">Muscle Status</div>
              <div className="muscle-grid">
                {MUSCLES.map(muscle => {
                  const days = daysSince(muscleLastTrained[muscle])
                  return (
                    <div className="muscle-card" key={muscle}>
                      <div className="muscle-name">{muscle}</div>
                      <div className="muscle-status" style={{ color: heatColor(days) }}>
                        {heatLabel(days)}
                      </div>
                      <div className="muscle-days">
                        {days === 999 ? '—' : days === 0 ? 'today' : `${days}d ago`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="section">
              <div className="section-title">Recent Workouts</div>
              {logs.length === 0 ? (
                <p className="empty-state">No workouts logged yet. Head to your program to get started.</p>
              ) : (
                <div className="log-list">
                  {logs.slice(0, 8).map(log => (
                    <div className="log-item" key={log.id}>
                      <div className="log-date">
                        {new Date(log.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="log-title">{log.day_title || `Week ${log.week_index + 1} · Day ${log.day_index + 1}`}</div>
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
