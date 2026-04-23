import { useState } from 'react'
import { supabase } from '../lib/supabase'

function fmtDate(d) {
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Generic reusable line chart — used for both weight and BF%
function MiniLineChart({ points, color, gradId, refLine = null, unit = '' }) {
  if (points.length < 2) return null

  const W = 400, H = 90
  const PAD = { l: 36, r: 14, t: 8, b: 16 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const vals = points.map(p => p.value)
  const allV = refLine !== null ? [...vals, refLine] : vals
  const pad  = unit === '%' ? 1 : 3
  const minV = Math.floor(Math.min(...allV) - pad)
  const maxV = Math.ceil(Math.max(...allV) + pad)
  const range = maxV - minV || 1

  const cx = i => PAD.l + (i / (points.length - 1)) * cW
  const cy = v => PAD.t + cH - ((v - minV) / range) * cH

  const pts = points.map((p, i) => `${cx(i).toFixed(1)},${cy(p.value).toFixed(1)}`).join(' ')
  const areaBase = (PAD.t + cH).toFixed(1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[minV, Math.round((minV + maxV) / 2), maxV].map(v => (
        <line key={v} x1={PAD.l} x2={W - PAD.r} y1={cy(v)} y2={cy(v)}
          stroke="var(--border)" strokeWidth="1" />
      ))}

      {/* Reference line (goal weight) */}
      {refLine !== null && (
        <>
          <line x1={PAD.l} x2={W - PAD.r} y1={cy(refLine)} y2={cy(refLine)}
            stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={W - PAD.r + 2} y={cy(refLine) + 4}
            fontSize="8" fill="var(--muted)" textAnchor="start">goal</text>
        </>
      )}

      {/* Area fill */}
      <polyline
        points={`${PAD.l.toFixed(1)},${areaBase} ${pts} ${cx(points.length - 1).toFixed(1)},${areaBase}`}
        fill={`url(#${gradId})`} stroke="none"
      />

      {/* Line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={cx(i)} cy={cy(p.value)} r="3"
          fill={color} stroke="var(--surface)" strokeWidth="1.5" />
      ))}

      {/* Y-axis labels */}
      <text x={PAD.l - 4} y={cy(maxV) + 4} fontSize="9" fill="var(--muted2)" textAnchor="end">{maxV}{unit}</text>
      <text x={PAD.l - 4} y={cy(minV) + 4} fontSize="9" fill="var(--muted2)" textAnchor="end">{minV}{unit}</text>

      {/* X-axis labels — first and last date */}
      <text x={cx(0)} y={H} fontSize="9" fill="var(--muted2)" textAnchor="middle">
        {fmtDate(points[0].date)}
      </text>
      <text x={cx(points.length - 1)} y={H} fontSize="9" fill="var(--muted2)" textAnchor="end">
        {fmtDate(points[points.length - 1].date)}
      </text>
    </svg>
  )
}

export default function WeightSection({ logs, profile, userId, onLogAdded }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ weight: '', bodyFat: '', date: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sorted     = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
  const latest     = sorted[sorted.length - 1]
  const first      = sorted[0]
  const target     = profile?.weight_target ? Number(profile.weight_target) : null
  const currentWeight = latest ? Number(latest.weight) : (profile?.weight_current ?? null)
  const delta      = sorted.length >= 2 ? Number(latest.weight) - Number(first.weight) : null
  const latestBF   = latest?.body_fat != null ? Number(latest.body_fat) : null

  // Chart data
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
        user_id:  userId,
        weight:   parseFloat(form.weight),
        body_fat: form.bodyFat ? parseFloat(form.bodyFat) : null,
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
        <div className="section-title">Weight</div>
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

      {/* Charts */}
      {sorted.length >= 2 ? (
        <div className="weight-chart-wrap">
          <div className="chart-track-label">Weight — lbs</div>
          <MiniLineChart
            points={weightPoints}
            color="var(--acc)"
            gradId="wGrad"
            refLine={target}
          />

          {bfPoints.length >= 2 && (
            <>
              <div className="chart-track-label" style={{ marginTop: 12 }}>Body Fat — %</div>
              <MiniLineChart
                points={bfPoints}
                color="var(--warn)"
                gradId="bfGrad"
                unit="%"
              />
            </>
          )}
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
