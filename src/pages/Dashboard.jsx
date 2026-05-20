import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'
import WeightSection from '../components/WeightSection'
import ProgramSwitcher from '../components/ProgramSwitcher'
import { getReadinessState, READINESS_PRIORITY } from '../lib/readiness'

const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs']

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return 999
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000))
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
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllWorkouts, setShowAllWorkouts] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', weeks: '8', days: '3' })
  const [creatingCustom, setCreatingCustom] = useState(false)

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
          .select('*, programs(name, duration_weeks, days_per_week, difficulty)')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
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

  async function createCustomProgram() {
    if (creatingCustom) return
    setCreatingCustom(true)
    const weeks = Math.max(1, Math.min(16, parseInt(customForm.weeks) || 8))
    const days  = Math.max(1, Math.min(7,  parseInt(customForm.days)  || 3))
    const structure = {
      weeks: Array.from({ length: weeks }, (_, wi) => ({
        label: `Week ${wi + 1}`,
        rep_note: '',
        days: Array.from({ length: days }, (_, di) => ({
          title: `Day ${di + 1}`,
          sub: '',
          groups: [],
        })),
      })),
      swap_options: {},
    }
    const { data: prog, error } = await supabase
      .from('programs')
      .insert({
        name: customForm.name.trim() || 'My Program',
        description: '',
        duration_weeks: weeks,
        days_per_week: days,
        goal_tag: 'custom',
        difficulty: 'intermediate',
        is_active: true,
        owner_id: session.user.id,
        is_user_created: true,
        structure,
      })
      .select()
      .single()
    if (error) { setCreatingCustom(false); return }

    if (assignment?.id) {
      await supabase.from('program_assignments')
        .update({ status: 'completed' })
        .eq('id', assignment.id)
    }
    await supabase.from('program_assignments').insert({
      user_id:     session.user.id,
      program_id:  prog.id,
      start_date:  new Date().toISOString().slice(0, 10),
      assigned_by: session.user.id,
      assigned_at: new Date().toISOString(),
      status:      'active',
    })
    setCreatingCustom(false)
    setShowCustomModal(false)
    navigate('/program')
  }

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
                <div className="stat-value">{assignment ? `W${currentWeek}` : '—'}</div>
                <div className="stat-label">Current Week</div>
              </div>
            </div>

            {/* ── Current Program / Choose Program CTA ── */}
            <section className="section program-card-section">
              {assignment ? (
                <div className="program-card-row">
                  <div className="program-card-info">
                    <div className="program-card-label">Current Program</div>
                    <div className="program-card-name">{assignment.programs?.name}</div>
                    <div className="program-card-meta">
                      {assignment.programs?.duration_weeks}wk · {assignment.programs?.days_per_week}d/wk · {assignment.programs?.difficulty}
                    </div>
                  </div>
                  <button className="btn-ghost" onClick={() => setShowSwitcher(true)}>
                    Switch
                  </button>
                </div>
              ) : (
                <div className="program-card-row program-card-empty">
                  <div className="program-card-info">
                    <div className="program-card-label">No Active Program</div>
                    <div className="program-card-name">Ready for your next block?</div>
                    <div className="program-card-meta">Pick a preset or build your own.</div>
                  </div>
                  <div className="program-card-actions">
                    <button className="btn-primary btn-choose-program" onClick={() => setShowSwitcher(true)}>
                      Choose Program
                    </button>
                    <button className="btn-ghost btn-build-custom" onClick={() => setShowCustomModal(true)}>
                      Build Custom
                    </button>
                  </div>
                </div>
              )}
            </section>

            {showSwitcher && (
              <ProgramSwitcher
                currentAssignment={assignment}
                userId={session.user.id}
                onSwitched={newAssignment => {
                  setAssignment(newAssignment)
                  setShowSwitcher(false)
                }}
                onClose={() => setShowSwitcher(false)}
              />
            )}

            {showCustomModal && (
              <div className="modal-bg" onClick={() => setShowCustomModal(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-title">Build Custom Program</div>
                  <div className="modal-sub">Blank slate — add exercises as you go, week by week.</div>

                  <div className="field">
                    <label>Program name <span className="optional">(optional)</span></label>
                    <input
                      type="text"
                      value={customForm.name}
                      onChange={e => setCustomForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="My Program"
                      autoFocus
                    />
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <label>Weeks</label>
                      <input
                        type="number"
                        min="1" max="16"
                        value={customForm.weeks}
                        onChange={e => setCustomForm(p => ({ ...p, weeks: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>Days / week</label>
                      <input
                        type="number"
                        min="1" max="7"
                        value={customForm.days}
                        onChange={e => setCustomForm(p => ({ ...p, days: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={createCustomProgram}
                    disabled={creatingCustom}
                  >
                    {creatingCustom ? 'Creating...' : 'Create & Start'}
                  </button>
                  <button className="modal-close" onClick={() => setShowCustomModal(false)}>✕ Cancel</button>
                </div>
              </div>
            )}

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
      </div>
    </div>
  )
}
