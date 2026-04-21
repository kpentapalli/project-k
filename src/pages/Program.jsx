import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import FeedbackButton from '../components/FeedbackButton'

export default function Program() {
  const { session } = useAuth()
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [session.user.id])

  async function load() {
    const { data: assignData } = await supabase
      .from('program_assignments')
      .select('*, programs(*)')
      .eq('user_id', session.user.id)
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

  function getSetState(wkIdx, dayIdx, gi, ei) {
    const key = `${wkIdx}-${dayIdx}-${gi}-${ei}`
    const row = setLogs_.find(s =>
      s.week_index === wkIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    )
    return row?.set_states || []
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

  async function toggleSet(wkIdx, dayIdx, gi, ei, si, totalSets) {
    const current = getSetState(wkIdx, dayIdx, gi, ei)
    const arr = Array(totalSets).fill(false)
    current.forEach((v, i) => { if (i < totalSets) arr[i] = v })
    arr[si] = !arr[si]

    const existing = setLogs_.find(s =>
      s.week_index === wkIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    )

    if (existing) {
      await supabase.from('set_logs').update({ set_states: arr, updated_at: new Date().toISOString() }).eq('id', existing.id)
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, set_states: arr } : s))
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: session.user.id,
        program_id: assignment.program_id,
        week_index: wkIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: arr,
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

  async function finishWorkout() {
    if (isDayComplete(currentWeek, currentDay)) return
    const day = getDayData(currentWeek, currentDay)
    const { data } = await supabase.from('workout_logs').insert({
      user_id: session.user.id,
      program_id: assignment.program_id,
      week_index: currentWeek,
      day_index: currentDay,
      day_title: day?.title,
      muscle_groups: day?.groups?.map(g => g.name) || [],
      completed_at: new Date().toISOString(),
    }).select().single()
    if (data) setLogs(prev => [...prev, data])
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
      <div className="page-content">
        <div className="hero">
          <div className="hero-label">PROGRAM 01 · {program.duration_weeks} WEEKS · {program.days_per_week} DAYS/WK</div>
          <h1 className="hero-title">{program.name.toUpperCase()}</h1>
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
              <div className="progress-label">{done} / {total} sets</div>
            </div>

            {day.groups?.map((group, gi) => (
              <div className="ex-group" key={gi}>
                <div className="group-name">{group.name}</div>
                {group.exercises.map((ex, ei) => {
                  const cardKey = `${currentWeek}-${currentDay}-${gi}-${ei}`
                  const isOpen = openCard === cardKey
                  const setStates = getSetState(currentWeek, currentDay, gi, ei)
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
                          <button className="swap-btn" onClick={e => { e.stopPropagation(); setSwapTarget({ wk: currentWeek, day: currentDay, gi, ei }) }}>⇄</button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="set-body">
                          {ex.note && <div className="set-hint">{ex.note}</div>}
                          <div className="set-chips">
                            {Array.from({ length: ex.sets }).map((_, si) => (
                              <div
                                key={si}
                                className={`set-chip ${setStates[si] ? 'done' : ''}`}
                                onClick={() => toggleSet(currentWeek, currentDay, gi, ei, si, ex.sets)}
                              >
                                {setStates[si] ? '✓' : `S${si + 1}`}
                              </div>
                            ))}
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
              onClick={finishWorkout}
              disabled={complete}
            >
              {complete ? '✓ Workout Logged' : 'Finish & Log Workout'}
            </button>
          </div>
        )}
      </div>

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
