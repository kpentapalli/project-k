import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PK-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function Admin() {
  const [users, setUsers] = useState([])
  const [programs, setPrograms] = useState([])
  const [feedback, setFeedback] = useState([])
  const [requests, setRequests] = useState([])
  const [codes, setCodes] = useState([])
  const [codeForm, setCodeForm] = useState({ label: '', max_uses: '1', expires_at: '' })
  const [creatingCode, setCreatingCode] = useState(false)
  const [newCode, setNewCode] = useState(null)
  const [selected, setSelected] = useState(null)
  const [assignForm, setAssignForm] = useState({ program_id: '', start_date: '' })
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    async function load() {
      const [usersRes, programsRes, feedbackRes, requestsRes, codesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at'),
        supabase.from('programs').select('*').eq('is_active', true).order('name'),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('access_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('signup_codes').select('*').order('created_at', { ascending: false }),
      ])
      const profiles = usersRes.data || []

      // Load each user's current active assignment
      const assignments = await Promise.all(
        profiles.map(p =>
          supabase
            .from('program_assignments')
            .select('*, programs(name)')
            .eq('user_id', p.id)
            .eq('status', 'active')
            .order('assigned_at', { ascending: false })
            .limit(1)
            .single()
        )
      )

      const enriched = profiles.map((p, i) => ({
        ...p,
        assignment: assignments[i].data || null,
      }))

      setUsers(enriched)
      setPrograms(programsRes.data || [])
      setFeedback(feedbackRes.data || [])
      setRequests(requestsRes.data || [])
      setCodes(codesRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function selectUser(user) {
    setSelected(user)
    setAssignForm({
      program_id: user.assignment?.program_id || '',
      start_date: user.assignment?.start_date || new Date().toISOString().slice(0, 10),
    })
  }

  async function assignProgram() {
    if (!assignForm.program_id || !assignForm.start_date) return
    setSaving(true)

    const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').single()

    // Mark existing active assignment complete, then insert a new one
    if (selected.assignment?.id) {
      await supabase.from('program_assignments')
        .update({ status: 'completed' })
        .eq('id', selected.assignment.id)
    }

    await supabase.from('program_assignments').insert({
      user_id: selected.id,
      program_id: assignForm.program_id,
      start_date: assignForm.start_date,
      assigned_by: adminProfile.id,
      assigned_at: new Date().toISOString(),
      status: 'active',
    })

    const prog = programs.find(p => p.id === assignForm.program_id)
    setUsers(prev => prev.map(u => u.id === selected.id
      ? { ...u, assignment: { program_id: assignForm.program_id, start_date: assignForm.start_date, programs: { name: prog?.name } } }
      : u
    ))
    setSelected(prev => ({ ...prev, assignment: { program_id: assignForm.program_id, start_date: assignForm.start_date, programs: { name: prog?.name } } }))
    setSaving(false)
  }

  async function approveRequest(req) {
    setApprovingId(req.id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email: req.email, name: req.name, requestId: req.id }),
    })
    const result = await res.json()
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
    } else {
      alert('Invite failed: ' + result.error)
    }
    setApprovingId(null)
  }

  async function createCode() {
    setCreatingCode(true)
    const code = generateCode()
    const payload = {
      code,
      label: codeForm.label.trim() || null,
      max_uses: parseInt(codeForm.max_uses, 10) || 1,
      expires_at: codeForm.expires_at ? new Date(codeForm.expires_at).toISOString() : null,
    }
    const { data, error } = await supabase.from('signup_codes').insert(payload).select().single()
    setCreatingCode(false)
    if (error) {
      alert('Failed to create code: ' + error.message)
      return
    }
    setCodes(prev => [data, ...prev])
    setNewCode(data.code)
    setCodeForm({ label: '', max_uses: '1', expires_at: '' })
  }

  async function deleteCode(code) {
    await supabase.from('signup_codes').delete().eq('code', code)
    setCodes(prev => prev.filter(c => c.code !== code))
    if (newCode === code) setNewCode(null)
  }

  async function rejectRequest(req) {
    await supabase.from('access_requests').update({ status: 'rejected' }).eq('id', req.id)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
  }

  if (loading) return <div className="loading-screen">Loading...</div>

  return (
    <div className="page">
      <TopBar active="admin" />
      <div className="page-content">
        <div className="hero">
          <div className="hero-label">ADMIN</div>
          <h1 className="hero-title">DASHBOARD</h1>
        </div>

        <div className="admin-tabs">
          <button className={`week-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Users ({users.length})
          </button>
          <button className={`week-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="tab-badge">{requests.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
          <button className={`week-tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            Feedback {feedback.length > 0 && `(${feedback.length})`}
          </button>
          <button className={`week-tab ${activeTab === 'codes' ? 'active' : ''}`} onClick={() => setActiveTab('codes')}>
            Codes ({codes.length})
          </button>
        </div>

        {activeTab === 'feedback' && (
          <div className="feedback-list">
            {feedback.length === 0 ? (
              <p className="empty-state">No feedback yet.</p>
            ) : (
              feedback.map(f => (
                <div className="feedback-item" key={f.id}>
                  <div className="feedback-meta">
                    <span className="feedback-user">{f.user_name || 'Unknown'}</span>
                    <span className="feedback-date">{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {f.rating && <span className="feedback-rating">{'😤😐🙂😄🔥'.split('')[f.rating - 1]}</span>}
                  </div>
                  <div className="feedback-message">{f.message}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="request-list">
            {requests.length === 0 ? (
              <p className="empty-state">No access requests yet.</p>
            ) : (
              requests.map(req => (
                <div className={`request-card request-card-${req.status}`} key={req.id}>
                  <div className="request-header">
                    <div className="request-identity">
                      <div className="request-name">{req.name}</div>
                      <div className="request-email">{req.email}</div>
                    </div>
                    <div className="request-meta-right">
                      <span className={`badge ${req.status === 'pending' ? 'badge-warn' : req.status === 'approved' ? 'badge-green' : 'badge-muted'}`}>
                        {req.status}
                      </span>
                      <div className="request-date">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {req.message && <div className="request-message">"{req.message}"</div>}
                  {req.status === 'pending' && (
                    <div className="request-actions">
                      <button
                        className="btn-approve"
                        onClick={() => approveRequest(req)}
                        disabled={approvingId === req.id}
                      >
                        {approvingId === req.id ? 'Sending invite...' : '✓ Approve & Invite'}
                      </button>
                      <button className="btn-reject" onClick={() => rejectRequest(req)}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'codes' && (
          <div className="codes-panel">
            <div className="codes-generator">
              <div className="section-title">Generate Invite Code</div>
              <div className="codes-form">
                <div className="field">
                  <label>Label <span className="optional">(optional)</span></label>
                  <input
                    type="text"
                    value={codeForm.label}
                    onChange={e => setCodeForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Family batch Apr 2026"
                  />
                </div>
                <div className="field">
                  <label>Max uses</label>
                  <input
                    type="number"
                    min="1"
                    value={codeForm.max_uses}
                    onChange={e => setCodeForm(prev => ({ ...prev, max_uses: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Expires <span className="optional">(optional)</span></label>
                  <input
                    type="date"
                    value={codeForm.expires_at}
                    onChange={e => setCodeForm(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <button className="btn-primary" onClick={createCode} disabled={creatingCode}>
                  {creatingCode ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
              {newCode && (
                <div className="code-reveal">
                  <span className="code-reveal-label">New code — share this:</span>
                  <div className="code-reveal-value">
                    <code>{newCode}</code>
                    <button
                      className="btn-ghost"
                      onClick={() => { navigator.clipboard.writeText(newCode); }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="section-title" style={{ marginTop: '24px' }}>Active Codes</div>
            {codes.length === 0 ? (
              <p className="empty-state">No codes yet.</p>
            ) : (
              <div className="codes-table">
                <div className="codes-table-header">
                  <span>Code</span>
                  <span>Label</span>
                  <span>Uses</span>
                  <span>Expires</span>
                  <span></span>
                </div>
                {codes.map(c => {
                  const exhausted = c.uses >= c.max_uses
                  const expired = c.expires_at && new Date(c.expires_at) < new Date()
                  return (
                    <div key={c.code} className={`codes-table-row ${exhausted || expired ? 'codes-row-dead' : ''}`}>
                      <span className="code-mono">{c.code}</span>
                      <span className="code-label">{c.label || <span style={{ opacity: 0.4 }}>—</span>}</span>
                      <span className="code-uses">{c.uses}/{c.max_uses}</span>
                      <span className="code-expires">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : <span style={{ opacity: 0.4 }}>Never</span>}
                      </span>
                      <button className="btn-reject-sm" onClick={() => deleteCode(c.code)}>Revoke</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && <div className="admin-layout">
          <div className="admin-user-list">
            <div className="section-title">Users ({users.length})</div>
            {users.map(user => (
              <div
                key={user.id}
                className={`admin-user-row ${selected?.id === user.id ? 'active' : ''}`}
                onClick={() => selectUser(user)}
              >
                <div className="admin-user-name">{user.full_name || '(no name)'}</div>
                <div className="admin-user-meta">
                  {user.intake_completed
                    ? <span className="badge badge-green">Intake done</span>
                    : <span className="badge badge-warn">Awaiting intake</span>}
                  {user.assignment
                    ? <span className="badge badge-acc">{user.assignment.programs?.name}</span>
                    : <span className="badge badge-muted">No program</span>}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="admin-user-detail">
              <div className="section-title">{selected.full_name || 'User'}</div>

              {selected.intake_completed ? (
                <div className="intake-view">
                  <div className="intake-row"><span>Goal</span><span>{selected.goal}</span></div>
                  <div className="intake-row"><span>Experience</span><span>{selected.experience}</span></div>
                  <div className="intake-row"><span>Days/week</span><span>{selected.days_per_week}</span></div>
                  <div className="intake-row"><span>Equipment</span><span>{selected.equipment}</span></div>
                  {selected.limitations && <div className="intake-row"><span>Limitations</span><span>{selected.limitations}</span></div>}
                  {selected.weight_current && <div className="intake-row"><span>Current weight</span><span>{selected.weight_current} lbs</span></div>}
                  {selected.weight_target && <div className="intake-row"><span>Target weight</span><span>{selected.weight_target} lbs</span></div>}
                </div>
              ) : (
                <p className="empty-state">Intake not completed yet.</p>
              )}

              <div className="assign-section">
                <div className="section-title">Assign Program</div>
                <div className="field">
                  <label>Program</label>
                  <select
                    value={assignForm.program_id}
                    onChange={e => setAssignForm(prev => ({ ...prev, program_id: e.target.value }))}
                  >
                    <option value="">Select a program...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.duration_weeks}wk · {p.difficulty})</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input
                    type="date"
                    value={assignForm.start_date}
                    onChange={e => setAssignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={assignProgram}
                  disabled={!assignForm.program_id || !assignForm.start_date || saving}
                >
                  {saving ? 'Saving...' : selected.assignment ? 'Update Assignment' : 'Assign Program'}
                </button>
              </div>
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}
