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
  const [weightInputs, setWeightInputs] = useState({})
  const [trackMore, setTrackMore] = useState(() => localStorage.getItem('pk_track_more') === '1')

  function toggleTrackMore() {
    setTrackMore(v => {
      const next = !v
      localStorage.setItem('pk_track_more', next ? '1' : '0')
      return next
    })
  }

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
    return getSetLogRow(wkIdx, dayIdx, gi, ei)?.set_states || []
  }

  function getEffortState(wkIdx, dayIdx, gi, ei) {
    return getSetLogRow(wkIdx, dayIdx, gi, ei)?.effort_states || []
  }

  function getWeights(wkIdx, dayIdx, gi, ei) {
    return getSetLogRow(wkIdx, dayIdx, gi, ei)?.weights || []
  }

  // Max weight ever recorded for this exercise position across all program set_logs
  function getExerciseBestWeight(gi, ei, excludeWk, excludeDay) {
    let max = 0
    for (const log of setLogs_) {
      if (log.group_index !== gi || log.exercise_index !== ei) continue
      if (log.week_index === excludeWk && log.day_index === excludeDay) continue
      for (const w of (log.weights || [])) {
        if (w && w > max) max = w
      }
    }
    return max
  }

  // Most recent prior session's weights for this exercise position (for pre-fill)
  function getMostRecentWeights(gi, ei, excludeWk, excludeDay) {
    let best = null
    let bestKey = -1
    for (const log of setLogs_) {
      if (log.group_index !== gi || log.exercise_index !== ei) continue
      if (log.week_index === excludeWk && log.day_index === excludeDay) continue
      if (!log.weights || !log.weights.some(w => w != null)) continue
      const key = log.week_index * 100 + log.day_index
      if (key > bestKey) { bestKey = key; best = log }
    }
    return best?.weights || []
  }

  function initWeightInputs(cardKey, wkIdx, dayIdx, gi, ei, totalSets) {
    const saved = getWeights(wkIdx, dayIdx, gi, ei)
    const prev = getMostRecentWeights(gi, ei, wkIdx, dayIdx)
    const prevFallback = prev.find(w => w != null)
    const inputs = Array(totalSets).fill('').map((_, i) => {
      if (saved[i] != null) return String(saved[i])
      if (prev[i] != null) return String(prev[i])
      if (prevFallback != null) return String(prevFallback)
      return ''
    })
    setWeightInputs(prev => ({ ...prev, [cardKey]: inputs }))
  }

  function handleWeightChange(cardKey, si, value) {
    setWeightInputs(prev => {
      const arr = [...(prev[cardKey] || [])]
      arr[si] = value
      // Cascade: fill empty subsequent cells with same value (first-session ergonomics).
      // Skips cells that already have a value (preserves drop sets and pre-filled prev-session weights).
      if (value !== '') {
        for (let i = si + 1; i < arr.length; i++) {
          if (!arr[i]) arr[i] = value
        }
      }
      return { ...prev, [cardKey]: arr }
    })
  }

  async function saveWeights(wkIdx, dayIdx, gi, ei, totalSets, inputs) {
    const weights = Array(totalSets).fill(null).map((_, i) => {
      const v = parseFloat(inputs[i])
      return isNaN(v) ? null : v
    })
    const existing = getSetLogRow(wkIdx, dayIdx, gi, ei)
    const now = new Date().toISOString()
    if (existing) {
      await supabase.from('set_logs').update({ weights, updated_at: now }).eq('id', existing.id)
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, weights } : s))
    } else {
      const bools = Array(totalSets).fill(false)
      const { data } = await supabase.from('set_logs').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: bools, effort_states: Array(totalSets).fill(null), weights,
      }).select().single()
      if (data) setSetLogs(prev => [...prev, data])
    }
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

  async function cycleSetDone(wkIdx, dayIdx, gi, ei, si, totalSets) {
    const existing = getSetLogRow(wkIdx, dayIdx, gi, ei)
    const currentBools = existing?.set_states || Array(totalSets).fill(false)
    const bools = Array(totalSets).fill(false)
    currentBools.forEach((v, i) => { if (i < totalSets) bools[i] = !!v })
    bools[si] = !bools[si]

    const now = new Date().toISOString()
    if (existing) {
      await supabase.from('set_logs').update({ set_states: bools, updated_at: now }).eq('id', existing.id)
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, set_states: bools } : s))
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: bools,
        effort_states: Array(totalSets).fill(null),
      }).select().single()
      if (data) setSetLogs(prev => [...prev, data])
    }
  }

  async function cycleSetEffort(wkIdx, dayIdx, gi, ei, si, totalSets) {
    const existing = getSetLogRow(wkIdx, dayIdx, gi, ei)
    const currentEfforts = existing?.effort_states || Array(totalSets).fill(null)
    const efforts = Array(totalSets).fill(null)
    currentEfforts.forEach((v, i) => { if (i < totalSets) efforts[i] = v || null })

    const current = efforts[si]
    const nextIdx = (EFFORT_CYCLE.indexOf(current) + 1) % EFFORT_CYCLE.length
    efforts[si] = EFFORT_CYCLE[nextIdx]

    const now = new Date().toISOString()
    if (existing) {
      await supabase.from('set_logs').update({ effort_states: efforts, updated_at: now }).eq('id', existing.id)
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, effort_states: efforts } : s))
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: Array(totalSets).fill(false),
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
            <div className="progress-label-row">
              <div className="progress-label">{done} / {total} sets</div>
              <button
                className={`track-toggle ${trackMore ? 'on' : ''}`}
                onClick={toggleTrackMore}
                title="Toggle effort + weight tracking"
              >
                ⚙ {trackMore ? 'Tracking effort + weight' : 'Track effort + weight'}
              </button>
            </div>

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
                  const cardWeights = weightInputs[cardKey] || []
                  const prevBest = getExerciseBestWeight(gi, ei, currentWeek, currentDay)
                  const currentMax = Math.max(...cardWeights.map(v => parseFloat(v) || 0))
                  const isPR = prevBest > 0 && currentMax > prevBest

                  return (
                    <div className={`ex-card ${allDone ? 'done' : ''}`} key={ei}>
                      <div className="ex-head" onClick={() => {
                        if (isOpen) { setOpenCard(null) }
                        else { setOpenCard(cardKey); initWeightInputs(cardKey, currentWeek, currentDay, gi, ei, ex.sets) }
                      }}>
                        <div className="ex-num">{String(ei + 1).padStart(2, '0')}</div>
                        <div className="ex-info">
                          <div className="ex-name">
                            {exName}
                            {isSwapped && <span className="swapped-badge">swapped</span>}
                            {isPR && <span className="pr-badge">★ PR</span>}
                          </div>
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
                          <div className="set-grid">
                            <div className="set-row set-row-done">
                              {Array.from({ length: ex.sets }).map((_, si) => {
                                const isDone = !!setStates[si]
                                return (
                                  <div
                                    key={si}
                                    className={`set-cell set-chip ${isDone ? 'done' : ''}`}
                                    onClick={() => cycleSetDone(currentWeek, currentDay, gi, ei, si, ex.sets)}
                                    title={isDone ? `Set ${si + 1} done` : `Tap to mark set ${si + 1} done`}
                                  >
                                    {isDone ? '✓' : `S${si + 1}`}
                                  </div>
                                )
                              })}
                            </div>
                            {trackMore && (
                              <div className="set-row set-row-effort">
                                {Array.from({ length: ex.sets }).map((_, si) => {
                                  const effort = effortStates[si] || null
                                  return (
                                    <div
                                      key={si}
                                      className={`set-cell effort-cell${effort ? ` effort-${effort}` : ''}`}
                                      onClick={() => cycleSetEffort(currentWeek, currentDay, gi, ei, si, ex.sets)}
                                      title={effort ? effort.charAt(0).toUpperCase() + effort.slice(1) : `Set ${si + 1} effort (tap E/M/H)`}
                                    >
                                      {effort ? effort[0].toUpperCase() : '–'}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {trackMore && (
                              <div className="set-row set-row-weight">
                                {Array.from({ length: ex.sets }).map((_, si) => (
                                  <input
                                    key={si}
                                    type="number"
                                    min="0"
                                    step="2.5"
                                    className="set-cell weight-input"
                                    placeholder="lbs"
                                    value={cardWeights[si] ?? ''}
                                    onChange={e => handleWeightChange(cardKey, si, e.target.value)}
                                    onBlur={() => saveWeights(currentWeek, currentDay, gi, ei, ex.sets, weightInputs[cardKey] || [])}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ))}
                              </div>
                            )}
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
