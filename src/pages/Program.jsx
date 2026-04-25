import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'
import { musclesFromDay } from '../lib/muscles'

export default function Program() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [program, setProgram] = useState(null)
  const [logs, setLogs] = useState([])
  const [setLogs_, setSetLogs] = useState([])
  const [swaps, setSwaps] = useState([])
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentDay, setCurrentDay] = useState(0)
  const [openCard, setOpenCard] = useState(null)
  const [swapTarget, setSwapTarget] = useState(null)
  const [timers, setTimers] = useState({})
  const [showDateModal, setShowDateModal] = useState(false)
  const [workoutDate, setWorkoutDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    load()
  }, [session.user.id])

  async function load() {
    const { data: assignData } = await supabase
      .from('program_assignments')
      .select('*, programs(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single()

    if (!assignData) { setLoading(false); return }

    const [logsRes, setLogsRes, swapsRes] = await Promise.all([
      supabase.from('workout_logs').select('*').eq('user_id', session.user.id).eq('program_id', assignData.program_id),
      supabase.from('set_logs').select('*').eq('user_id', session.user.id).eq('program_id', assignData.program_id),
      supabase.from('exercise_swaps').select('*').eq('user_id', session.user.id).eq('program_id', assignData.program_id),
    ])

    setAssignment(assignData)
    setProgram(assignData.programs)
    setLogs(logsRes.data || [])
    setSetLogs(setLogsRes.data || [])
    setSwaps(swapsRes.data || [])

    const introKey = `pk_intro_${assignData.program_id}`
    if (!localStorage.getItem(introKey)) setShowIntro(true)

    const startDate = new Date(assignData.start_date)
    const weekIdx = Math.min(
      Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000)),
      (assignData.programs.duration_weeks || 1) - 1
    )
    setCurrentWeek(Math.max(0, weekIdx))
    setLoading(false)
  }

  function getWeekData(wkIdx) {
    return program?.structure?.weeks?.[wkIdx]
  }

  function getDayData(wkIdx, dayIdx) {
    return getWeekData(wkIdx)?.days?.[dayIdx]
  }

  function isDayComplete(wkIdx, dayIdx) {
    return logs.some(l => l.week_index === wkIdx && l.day_index === dayIdx)
  }

  function getSetLogRow(wkIdx, dayIdx, gi, ei) {
    return setLogs_.find(s =>
      s.week_index === wkIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    )
  }

  function getSetState(wkIdx, dayIdx, gi, ei) {
    const row = getSetLogRow(wkIdx, dayIdx, gi, ei)
    // Derive booleans from effort_states if present, else fall back to set_states
    if (row?.effort_states?.some(e => e)) {
      return row.effort_states.map(e => !!e)
    }
    return row?.set_states || []
  }

  function getEffortState(wkIdx, dayIdx, gi, ei) {
    return getSetLogRow(wkIdx, dayIdx, gi, ei)?.effort_states || []
  }

  function getExName(wkIdx, dayIdx, gi, ei) {
    const swap = swaps.find(s =>
      s.week_index === wkIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    )
    if (swap) return swap.swap_name
    return getDayData(wkIdx, dayIdx)?.groups?.[gi]?.exercises?.[ei]?.name || ''
  }

  function dayProgress(wkIdx, dayIdx) {
    const day = getDayData(wkIdx, dayIdx)
    if (!day) return { total: 0, done: 0 }
    let total = 0, done = 0
    day.groups.forEach((g, gi) => {
      g.exercises.forEach((ex, ei) => {
        total += ex.sets
        const states = getSetState(wkIdx, dayIdx, gi, ei)
        done += states.filter(Boolean).length
      })
    })
    return { total, done }
  }

  const EFFORT_CYCLE = [null, 'easy', 'medium', 'hard']

  async function cycleSetEffort(wkIdx, dayIdx, gi, ei, si, totalSets) {
    const existing = getSetLogRow(wkIdx, dayIdx, gi, ei)
    const currentEfforts = existing?.effort_states || Array(totalSets).fill(null)
    const efforts = Array(totalSets).fill(null)
    currentEfforts.forEach((v, i) => { if (i < totalSets) efforts[i] = v || null })

    const current = efforts[si]
    const nextIdx = (EFFORT_CYCLE.indexOf(current) + 1) % EFFORT_CYCLE.length
    efforts[si] = EFFORT_CYCLE[nextIdx]

    // Keep set_states in sync for day-completion logic
    const bools = efforts.map(e => !!e)
    const now = new Date().toISOString()

    if (existing) {
      await supabase.from('set_logs').update({ set_states: bools, effort_states: efforts, updated_at: now }).eq('id', existing.id)
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, set_states: bools, effort_states: efforts } : s))
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: bools,
        effort_states: efforts,
      }).select().single()
      if (data) setSetLogs(prev => [...prev, data])
    }
  }

  async function applySwap(wkIdx, dayIdx, gi, ei, name) {
    const existing = swaps.find(s =>
      s.week_index === wkIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    )
    if (name === null) {
      if (existing) {
        await supabase.from('exercise_swaps').delete().eq('id', existing.id)
        setSwaps(prev => prev.filter(s => s.id !== existing.id))
      }
    } else if (existing) {
      await supabase.from('exercise_swaps').update({ swap_name: name }).eq('id', existing.id)
      setSwaps(prev => prev.map(s => s.id === existing.id ? { ...s, swap_name: name } : s))
    } else {
      const { data } = await supabase.from('exercise_swaps').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        swap_name: name,
      }).select().single()
      if (data) setSwaps(prev => [...prev, data])
    }
    setSwapTarget(null)
  }

  function openFinishModal() {
    if (isDayComplete(currentWeek, currentDay)) return
    setWorkoutDate(new Date().toISOString().slice(0, 10))
    setShowDateModal(true)
  }

  async function confirmFinishWorkout() {
    const day = getDayData(currentWeek, currentDay)
    // Store as noon UTC so date slicing is always timezone-safe
    const completedAt = new Date(workoutDate + 'T12:00:00Z').toISOString()
    const { data } = await supabase.from('workout_logs').insert({
      user_id: session.user.id,
      program_id: assignment.program_id,
      week_index: currentWeek,
      day_index: currentDay,
      day_title: day?.title,
      muscle_groups: musclesFromDay(day),
      completed_at: completedAt,
    }).select().single()
    if (data) setLogs(prev => [...prev, data])
    setShowDateModal(false)
  }

  function startTimer(key) {
    if (timers[key]) return
    let t = 60
    const id = setInterval(() => {
      t--
      setTimers(prev => ({ ...prev, [key]: t <= 0 ? 'GO!' : t }))
      if (t <= 0) clearInterval(id)
    }, 1000)
    setTimers(prev => ({ ...prev, [key]: 60 }))
  }

  function dismissIntro() {
    localStorage.setItem(`pk_intro_${assignment.program_id}`, '1')
    setShowIntro(false)
  }

  async function completeProgram() {
    if (!assignment?.id || completing) return
    if (!window.confirm(`Mark "${program.name}" as complete? You can choose your next program on the next screen.`)) return
    setCompleting(true)
    await supabase
      .from('program_assignments')
      .update({ status: 'completed' })
      .eq('id', assignment.id)
    navigate(`/retrospective?aid=${assignment.id}`)
  }

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!assignment) return (
    <div className="page">
      <TopBar active="program" />
      <div className="page-content">
        <div className="holding-state">
          <div className="holding-icon">⏳</div>
          <h2>No program assigned yet</h2>
          <p>Your program will appear here once it's assigned.</p>
        </div>
      </div>
    </div>
  )

  const week = getWeekData(currentWeek)
  const day = getDayData(currentWeek, currentDay)
  const { total, done } = dayProgress(currentWeek, currentDay)
  const complete = isDayComplete(currentWeek, currentDay)
  const swapOptions = program?.structure?.swap_options || {}

  return (
    <div className="page">
      <TopBar active="program" />
      <FeedbackButton />

      {showIntro && (
        <div className="modal-bg intro-bg">
          <div className="intro-card">
            <div className="hero-label">{program.duration_weeks} WEEKS · {program.days_per_week} DAYS/WK · {program.difficulty?.toUpperCase()}</div>
            <h2 className="intro-title">{program.name.toUpperCase()}</h2>
            <p className="intro-body">{program.description}</p>
            <div className="intro-tip">Your sets, reps, and exercise notes are all inside each workout day. Tap any exercise card to expand it.</div>
            <button className="btn-primary intro-cta" onClick={dismissIntro}>Let's Go</button>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="hero">
          <div className="hero-label">{program.duration_weeks} WEEKS · {program.days_per_week} DAYS/WK · {program.difficulty?.toUpperCase()}</div>
          <h1 className="hero-title">{program.name.toUpperCase()}</h1>
          {program.description && (
            <div className="about-toggle-wrap">
              <button className="about-toggle" onClick={() => setShowAbout(v => !v)}>
                About this program {showAbout ? '▲' : '▼'}
              </button>
              {showAbout && (
                <div className="about-inline">{program.description}</div>
              )}
            </div>
          )}
          <button
            className="btn-ghost btn-complete-program"
            onClick={completeProgram}
            disabled={completing}
          >
            {completing ? 'Completing...' : 'Mark as Complete'}
          </button>
        </div>

        <div className="week-tabs">
          {Array.from({ length: program.duration_weeks }).map((_, wi) => (
            <button
              key={wi}
              className={`week-tab ${currentWeek === wi ? 'active' : ''}`}
              onClick={() => { setCurrentWeek(wi); setCurrentDay(0); setOpenCard(null) }}
            >
              W{wi + 1}
            </button>
          ))}
        </div>

        {week?.rep_note && (
          <div className="rep-banner" dangerouslySetInnerHTML={{ __html: week.rep_note }} />
        )}

        <div className="day-tabs">
          {Array.from({ length: program.days_per_week }).map((_, di) => (
            <button
              key={di}
              className={`day-tab ${currentDay === di ? 'active' : ''} ${isDayComplete(currentWeek, di) ? 'done' : ''}`}
              onClick={() => { setCurrentDay(di); setOpenCard(null) }}
            >
              Day {di + 1}{isDayComplete(currentWeek, di) ? ' ✓' : ''}
            </button>
          ))}
        </div>

        {day && (
          <div className="workout-area">
            <div className="workout-header">
              <div className="workout-title">{day.title}</div>
              <div className="workout-sub">{day.sub}</div>
            </div>

            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
            <div className="progress-label">{done} / {total} sets</div>

            {day.groups?.map((group, gi) => (
              <div className="ex-group" key={gi}>
                <div className="group-name">{group.name}</div>
                {group.exercises.map((ex, ei) => {
                  const cardKey = `${currentWeek}-${currentDay}-${gi}-${ei}`
                  const isOpen = openCard === cardKey
                  const setStates = getSetState(currentWeek, currentDay, gi, ei)
                  const effortStates = getEffortState(currentWeek, currentDay, gi, ei)
                  const allDone = setStates.length === ex.sets && setStates.every(Boolean)
                  const exName = getExName(currentWeek, currentDay, gi, ei)
                  const isSwapped = exName !== ex.name

                  return (
                    <div className={`ex-card ${allDone ? 'done' : ''}`} key={ei}>
                      <div className="ex-head" onClick={() => setOpenCard(isOpen ? null : cardKey)}>
                        <div className="ex-num">{String(ei + 1).padStart(2, '0')}</div>
                        <div className="ex-info">
                          <div className="ex-name">{exName}{isSwapped && <span className="swapped-badge">swapped</span>}</div>
                          <div className="ex-meta"><b>{ex.sets} sets</b> × {ex.reps} reps</div>
                        </div>
                        <div className="ex-actions">
                          <a
                            className="swap-btn yt-btn"
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exName + ' exercise form tutorial')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Search on YouTube"
                          >▶</a>
                          <button className="swap-btn" onClick={e => { e.stopPropagation(); setSwapTarget({ wk: currentWeek, day: currentDay, gi, ei }) }}>⇄</button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="set-body">
                          {ex.note && <div className="set-hint">{ex.note}</div>}
                          <div className="set-chips">
                            {Array.from({ length: ex.sets }).map((_, si) => {
                              const effort = effortStates[si] || null
                              return (
                                <div
                                  key={si}
                                  className={`set-chip${effort ? ` effort-${effort}` : ''}`}
                                  onClick={() => cycleSetEffort(currentWeek, currentDay, gi, ei, si, ex.sets)}
                                  title={effort ? effort.charAt(0).toUpperCase() + effort.slice(1) : `Set ${si + 1}`}
                                >
                                  {effort ? effort[0].toUpperCase() : `S${si + 1}`}
                                </div>
                              )
                            })}
                          </div>
                          <div className="rest-row">
                            <button className="rest-btn" onClick={() => startTimer(cardKey)}>⏱ 60s rest</button>
                            {timers[cardKey] !== undefined && (
                              <div className={`rest-timer ${timers[cardKey] === 'GO!' ? 'go' : 'on'}`}>
                                {timers[cardKey] === 'GO!' ? 'GO!' : `0:${String(timers[cardKey]).padStart(2, '0')}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            <button
              className={`btn-finish ${complete ? 'btn-finish-done' : ''}`}
              onClick={openFinishModal}
              disabled={complete}
            >
              {complete ? '✓ Workout Logged' : 'Finish & Log Workout'}
            </button>
          </div>
        )}
      </div>

      {showDateModal && (
        <div className="modal-bg" onClick={() => setShowDateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">When did you finish?</div>
            <div className="modal-sub">
              Week {currentWeek + 1} · Day {currentDay + 1}
              {day?.title ? ` — ${day.title}` : ''}
            </div>
            <div className="date-field">
              <label className="date-label">Workout date</label>
              <input
                type="date"
                className="date-input"
                value={workoutDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setWorkoutDate(e.target.value)}
              />
              <p className="date-hint">Back-date if you're logging a missed session.</p>
            </div>
            <button className="btn-primary" onClick={confirmFinishWorkout} disabled={!workoutDate}>
              Log Workout
            </button>
            <button className="modal-close" onClick={() => setShowDateModal(false)}>✕ Cancel</button>
          </div>
        </div>
      )}

      {swapTarget && (() => {
        const { wk, day: d, gi, ei } = swapTarget
        const ex = getDayData(wk, d)?.groups?.[gi]?.exercises?.[ei]
        const category = ex?.swap_category
        const options = category ? (swapOptions[category] || []) : []
        return (
          <div className="modal-bg" onClick={() => setSwapTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-title">Swap: {ex?.name}</div>
              <div className="modal-sub">Choose a replacement exercise</div>
              {options.map((opt, i) => (
                <div className="alt-item" key={i} onClick={() => applySwap(wk, d, gi, ei, opt.name)}>
                  <div className="alt-name">{opt.name}</div>
                  {opt.note && <div className="alt-note">{opt.note}</div>}
                </div>
              ))}
              <div className="alt-item alt-reset" onClick={() => applySwap(wk, d, gi, ei, null)}>
                <div className="alt-name">↩ Reset to original</div>
              </div>
              <button className="modal-close" onClick={() => setSwapTarget(null)}>✕ Cancel</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
