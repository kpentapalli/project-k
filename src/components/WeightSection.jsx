import { useState } from 'react'
import { supabase } from '../lib/supabase'

function fmtDate(d) {
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Combined weight + BF% chart on a single SVG with dual Y-axis.
// Each series is plotted independently — missing BF% points don't affect weight line.
function CombinedBodyChart({ weightPoints, bfPoints, goalWeight }) {
  const hasBF = bfPoints.length > 0

  // Collect all unique dates across both series for the shared X axis
  const allDates = [...new Set([
    ...weightPoints.map(p => p.date),
    ...bfPoints.map(p => p.date),
  ])].sort()

  if (allDates.length < 2 && weightPoints.length < 2) return null

  const W = 400, H = 110
  const PAD = { l: 38, r: hasBF ? 38 : 14, t: 22, b: 16 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const dateX = date => {
    const idx = allDates.indexOf(date)
    return PAD.l + (allDates.length > 1 ? (idx / (allDates.length - 1)) : 0.5) * cW
  }

  // Weight Y scale (left axis)
  const wVals = weightPoints.map(p => p.value)
  const allWVals = goalWeight != null ? [...wVals, goalWeight] : wVals
  const wMin = wVals.length ? Math.floor(Math.min(...allWVals) - 3) : 0
  const wMax = wVals.length ? Math.ceil(Math.max(...allWVals) + 3) : 100
  const wRange = wMax - wMin || 1
  const wY = v => PAD.t + cH - ((v - wMin) / wRange) * cH

  // BF% Y scale (right axis)
  const bVals = bfPoints.map(p => p.value)
  const bMin = bVals.length ? Math.floor(Math.min(...bVals) - 1) : 0
  const bMax = bVals.length ? Math.ceil(Math.max(...bVals) + 1) : 40
  const bRange = bMax - bMin || 1
  const bY = v => PAD.t + cH - ((v - bMin) / bRange) * cH

  const wPts = weightPoints.map(p => `${dateX(p.date).toFixed(1)},${wY(p.value).toFixed(1)}`).join(' ')
  const bPts = bfPoints.map(p => `${dateX(p.date).toFixed(1)},${bY(p.value).toFixed(1)}`).join(' ')
  const areaBase = (PAD.t + cH).toFixed(1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39ff8a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#39ff8a" stopOpacity="0" />
        </linearGradient>
        {hasBF && (
          <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* Legend */}
      <circle cx={PAD.l} cy="11" r="3" fill="#39ff8a" />
      <text x={PAD.l + 7} y="15" fontSize="8" fill="var(--muted2)">Weight (lbs)</text>
      {hasBF && (
        <>
          <circle cx={PAD.l + 85} cy="11" r="3" fill="#f59e0b" />
          <text x={PAD.l + 92} y="15" fontSize="8" fill="var(--muted2)">Body Fat (%)</text>
        </>
      )}

      {/* Grid lines */}
      {[wMin, Math.round((wMin + wMax) / 2), wMax].map(v => (
        <line key={v} x1={PAD.l} x2={W - PAD.r} y1={wY(v)} y2={wY(v)}
          stroke="var(--border)" strokeWidth="1" />
      ))}

      {/* Goal weight dashed line */}
      {goalWeight != null && wVals.length > 0 && (
        <>
          <line x1={PAD.l} x2={W - PAD.r} y1={wY(goalWeight)} y2={wY(goalWeight)}
            stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={W - PAD.r - 2} y={wY(goalWeight) - 3}
            fontSize="8" fill="var(--muted)" textAnchor="end">goal</text>
        </>
      )}

      {/* Weight area + line + dots */}
      {weightPoints.length >= 2 && (
        <>
          <polyline
            points={`${dateX(weightPoints[0].date).toFixed(1)},${areaBase} ${wPts} ${dateX(weightPoints[weightPoints.length - 1].date).toFixed(1)},${areaBase}`}
            fill="url(#wGrad)" stroke="none"
          />
          <polyline points={wPts} fill="none" stroke="#39ff8a" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {weightPoints.map((p, i) => (
        <circle key={i} cx={dateX(p.date)} cy={wY(p.value)} r="3"
          fill="#39ff8a" stroke="var(--surface)" strokeWidth="1.5" />
      ))}

      {/* BF% area + line + dots */}
      {bfPoints.length >= 2 && (
        <>
          <polyline
            points={`${dateX(bfPoints[0].date).toFixed(1)},${areaBase} ${bPts} ${dateX(bfPoints[bfPoints.length - 1].date).toFixed(1)},${areaBase}`}
            fill="url(#bfGrad)" stroke="none"
          />
          <polyline points={bPts} fill="none" stroke="#f59e0b" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {bfPoints.map((p, i) => (
        <circle key={i} cx={dateX(p.date)} cy={bY(p.value)} r="3"
          fill="#f59e0b" stroke="var(--surface)" strokeWidth="1.5" />
      ))}

      {/* Left Y-axis labels (weight) */}
      {wVals.length > 0 && (
        <>
          <text x={PAD.l - 4} y={wY(wMax) + 4} fontSize="9" fill="var(--muted2)" textAnchor="end">{wMax}</text>
          <text x={PAD.l - 4} y={wY(wMin) + 4} fontSize="9" fill="var(--muted2)" textAnchor="end">{wMin}</text>
        </>
      )}

      {/* Right Y-axis labels (BF%) */}
      {bVals.length > 0 && (
        <>
          <text x={W - PAD.r + 4} y={bY(bMax) + 4} fontSize="9" fill="#f59e0b" textAnchor="start">{bMax}%</text>
          <text x={W - PAD.r + 4} y={bY(bMin) + 4} fontSize="9" fill="#f59e0b" textAnchor="start">{bMin}%</text>
        </>
      )}

      {/* X-axis labels — first and last date */}
      {allDates.length >= 2 && (
        <>
          <text x={PAD.l} y={H} fontSize="9" fill="var(--muted2)" textAnchor="middle">
            {fmtDate(allDates[0])}
          </text>
          <text x={W - PAD.r} y={H} fontSize="9" fill="var(--muted2)" textAnchor="end">
            {fmtDate(allDates[allDates.length - 1])}
          </text>
        </>
      )}
    </svg>
  )
}

export default function WeightSection({ logs, profile, userId, onLogAdded }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ weight: '', bodyFat: '', date: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sorted      = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
  const latest      = sorted[sorted.length - 1]
  const first       = sorted[0]
  const target      = profile?.weight_target ? Number(profile.weight_target) : null
  const currentWeight = latest ? Number(latest.weight) : (profile?.weight_current ?? null)
  const delta       = sorted.length >= 2 ? Number(latest.weight) - Number(first.weight) : null
  const latestBF    = latest?.body_fat != null ? Number(latest.body_fat) : null

  const weightPoints = sorted.map(l => ({ date: l.logged_at, value: Number(l.weight) }))
  const bfPoints     = sorted
    .filter(l => l.body_fat != null)
    .map(l => ({ date: l.logged_at, value: Number(l.body_fat) }))

  function openModal() {
    setForm({
      weight:  latest?.weight   ? String(latest.weight)   : (profile?.weight_current ? String(profile.weight_current) : ''),
      bodyFat: latest?.body_fat ? String(latest.body_fat) : '',
      date:    new Date().toISOString().slice(0, 10),
    })
    setSaveError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.weight || !form.date) return
    setSaving(true)
    setSaveError('')
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({
        user_id:   userId,
        weight:    parseFloat(form.weight),
        body_fat:  form.bodyFat ? parseFloat(form.bodyFat) : null,
        logged_at: form.date,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    if (data) onLogAdded(data)
    setShowModal(false)
  }

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-title">Weight & Body Composition</div>
        <button className="btn-log" onClick={openModal}>+ Log</button>
      </div>

      {/* Stats row */}
      <div className="weight-stats">
        <div className="weight-stat">
          <div className="weight-stat-val">{currentWeight != null ? currentWeight : '—'}</div>
          <div className="weight-stat-unit">lbs</div>
          <div className="weight-stat-label">Current</div>
        </div>

        {delta !== null && (
          <div className="weight-stat">
            <div className={`weight-stat-val ${delta < 0 ? 'val-down' : delta > 0 ? 'val-up' : ''}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
            </div>
            <div className="weight-stat-unit">lbs</div>
            <div className="weight-stat-label">Change</div>
          </div>
        )}

        {latestBF !== null && (
          <div className="weight-stat">
            <div className="weight-stat-val">{latestBF.toFixed(1)}</div>
            <div className="weight-stat-unit">%</div>
            <div className="weight-stat-label">Body Fat</div>
          </div>
        )}

        {target !== null && (
          <div className="weight-stat">
            <div className="weight-stat-val">{target}</div>
            <div className="weight-stat-unit">lbs</div>
            <div className="weight-stat-label">Target</div>
          </div>
        )}
      </div>

      {/* Combined chart */}
      {weightPoints.length >= 2 ? (
        <div className="weight-chart-wrap">
          <CombinedBodyChart
            weightPoints={weightPoints}
            bfPoints={bfPoints}
            goalWeight={target}
          />
        </div>
      ) : (
        <p className="empty-state" style={{ fontSize: '0.82rem', marginTop: 8 }}>
          {sorted.length === 0
            ? 'No weigh-ins yet. Tap + Log to start tracking.'
            : 'Log one more weigh-in to see your progress chart.'}
        </p>
      )}

      {/* Log modal */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Log Weight</div>
            <div className="modal-sub">Track your progress over time</div>

            <div className="field-row">
              <div className="field">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                  placeholder="185"
                  min={50} max={500} step={0.1}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Body fat % <span className="optional">(optional)</span></label>
                <input
                  type="number"
                  value={form.bodyFat}
                  onChange={e => setForm(p => ({ ...p, bodyFat: e.target.value }))}
                  placeholder="18.5"
                  min={1} max={60} step={0.1}
                />
              </div>
            </div>

            <div className="date-field">
              <label className="date-label">Date</label>
              <input
                type="date"
                className="date-input"
                value={form.date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
              <p className="date-hint">Back-date to log a missed check-in.</p>
            </div>

            {saveError && <p className="auth-error" style={{ margin: '0 0 4px' }}>{saveError}</p>}

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!form.weight || !form.date || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕ Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
