import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import ProgramSwitcher from '../components/ProgramSwitcher'

export default function Retrospective() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const aid = searchParams.get('aid')

  const [assignment, setAssignment] = useState(null)
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSwitcher, setShowSwitcher] = useState(false)

  useEffect(() => {
    if (!aid) { navigate('/dashboard'); return }

    async function load() {
      const [assignRes, logsRes, weightRes] = await Promise.all([
        supabase
          .from('program_assignments')
          .select('*, programs(*)')
          .eq('id', aid)
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: true }),
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('logged_at', { ascending: true }),
      ])

      if (!assignRes.data) { navigate('/dashboard'); return }

      const a = assignRes.data
      setAssignment(a)

      // Filter workout logs to this program run (start_date → now)
      const filtered = (logsRes.data || []).filter(l =>
        l.program_id === a.program_id &&
        l.completed_at.slice(0, 10) >= a.start_date
      )
      setWorkoutLogs(filtered)
      setWeightLogs(weightRes.data || [])
      setLoading(false)
    }
    load()
  }, [aid, session.user.id])

  if (loading) return <div className="loading-screen">Loading...</div>

  const program = assignment.programs

  // Stats
  const uniqueDates = [...new Set(workoutLogs.map(l => l.completed_at.slice(0, 10)))]
  const daysTrained = uniqueDates.length
  const lastWorkoutDate = uniqueDates.sort().at(-1) || assignment.start_date

  const muscleCounts = {}
  for (const log of workoutLogs) {
    for (const m of (log.muscle_groups || [])) {
      muscleCounts[m] = (muscleCounts[m] || 0) + 1
    }
  }
  const topMuscles = Object.entries(muscleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxMuscleCount = topMuscles[0]?.[1] || 1

  // Weight delta — filter to assignment date range
  const rangeWeightLogs = weightLogs.filter(w =>
    w.logged_at >= assignment.start_date && w.logged_at <= lastWorkoutDate
  )
  const firstWeight = rangeWeightLogs.find(w => w.weight)
  const lastWeight = [...rangeWeightLogs].reverse().find(w => w.weight)
  const weightDelta = firstWeight && lastWeight && firstWeight.id !== lastWeight.id
    ? (lastWeight.weight - firstWeight.weight).toFixed(1)
    : null

  const firstBF = rangeWeightLogs.find(w => w.body_fat)
  const lastBF = [...rangeWeightLogs].reverse().find(w => w.body_fat)
  const bfDelta = firstBF && lastBF && firstBF.id !== lastBF.id
    ? (lastBF.body_fat - firstBF.body_fat).toFixed(1)
    : null

  const startFmt = new Date(assignment.start_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const endFmt = new Date(lastWorkoutDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  function handleSwitched() {
    navigate('/program')
  }

  return (
    <div className="page">
      <TopBar active="program" />

      {showSwitcher && (
        <ProgramSwitcher
          currentAssignment={null}
          userId={session.user.id}
          onSwitched={handleSwitched}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      <div className="page-content retro-page">

        <div className="retro-hero">
          <div className="retro-badge">PROGRAM COMPLETE</div>
          <h1 className="retro-title">{program.name.toUpperCase()}</h1>
          <div className="retro-dates">{startFmt} → {endFmt}</div>
        </div>

        <div className="retro-stats-row">
          <div className="retro-stat">
            <div className="retro-stat-value">{daysTrained}</div>
            <div className="retro-stat-label">DAYS TRAINED</div>
          </div>
          <div className="retro-stat">
            <div className="retro-stat-value">{program.duration_weeks}</div>
            <div className="retro-stat-label">WEEKS</div>
          </div>
          <div className="retro-stat">
            <div className="retro-stat-value">{topMuscles.length}</div>
            <div className="retro-stat-label">MUSCLES HIT</div>
          </div>
        </div>

        {topMuscles.length > 0 && (
          <div className="retro-section">
            <div className="retro-section-title">MUSCLE BREAKDOWN</div>
            <div className="retro-muscles">
              {topMuscles.map(([muscle, count]) => (
                <div key={muscle} className="retro-muscle-row">
                  <div className="retro-muscle-name">{muscle}</div>
                  <div className="retro-muscle-bar-wrap">
                    <div
                      className="retro-muscle-bar"
                      style={{ width: `${(count / maxMuscleCount) * 100}%` }}
                    />
                  </div>
                  <div className="retro-muscle-count">{count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(weightDelta !== null || bfDelta !== null) && (
          <div className="retro-section">
            <div className="retro-section-title">BODY COMPOSITION</div>
            <div className="retro-body-row">
              {weightDelta !== null && (
                <div className="retro-body-stat">
                  <div className={`retro-delta ${parseFloat(weightDelta) < 0 ? 'retro-delta-down' : 'retro-delta-up'}`}>
                    {parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} lbs
                  </div>
                  <div className="retro-body-label">Weight change</div>
                  <div className="retro-body-sub">{firstWeight.weight} → {lastWeight.weight} lbs</div>
                </div>
              )}
              {bfDelta !== null && (
                <div className="retro-body-stat">
                  <div className={`retro-delta ${parseFloat(bfDelta) < 0 ? 'retro-delta-down' : 'retro-delta-up'}`}>
                    {parseFloat(bfDelta) > 0 ? '+' : ''}{bfDelta}%
                  </div>
                  <div className="retro-body-label">Body fat change</div>
                  <div className="retro-body-sub">{firstBF.body_fat}% → {lastBF.body_fat}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="retro-cta">
          <button className="btn-primary retro-next-btn" onClick={() => setShowSwitcher(true)}>
            Choose Next Program
          </button>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
