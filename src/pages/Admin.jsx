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

  // Program builder state
  const EMPTY_PROGRAM = {
    name: '', description: '', duration_weeks: 6, days_per_week: 5,
    goal_tag: 'bulk', difficulty: 'intermediate', is_active: true,
    structure: JSON.stringify({
      weeks: [
        {
          label: 'Week 1',
          rep_note: '<b>Week 1.</b> Main lifts: <b>8–12 reps</b>.',
          days: [
            {
              title: 'Day 1',
              sub: 'Day 1 — Description',
              groups: [
                {
                  name: 'GROUP NAME',
                  exercises: [
                    { name: 'Exercise Name', sets: 4, reps: '8–12', note: 'Technique note.', swap_category: 'chest_multi' }
                  ]
                }
              ]
            }
          ]
        }
      ],
      swap_options: {
        chest_multi: [{ name: 'Alternative Exercise', note: 'Note.' }]
      }
    }, null, 2),
  }
  const [programEditor, setProgramEditor] = useState({ open: false, data: null, saving: false, error: null })

  useEffect(() => {
    async function load() {
      const [usersRes, programsRes, feedbackRes, requestsRes, codesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at'),
        supabase.from('programs').select('id, name, description, duration_weeks, days_per_week, goal_tag, difficulty, is_active').order('name'),
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

  function openNewProgram() {
    setProgramEditor({ open: true, data: { ...EMPTY_PROGRAM }, saving: false, error: null })
  }

  function openEditProgram(p) {
    // Fetch full structure for editing
    supabase.from('programs').select('*').eq('id', p.id).single().then(({ data }) => {
      if (!data) return
      setProgramEditor({
        open: true,
        saving: false,
        error: null,
        data: {
          id: data.id,
          name: data.name,
          description: data.description || '',
          duration_weeks: data.duration_weeks,
          days_per_week: data.days_per_week,
          goal_tag: data.goal_tag,
          difficulty: data.difficulty,
          is_active: data.is_active,
          structure: JSON.stringify(data.structure, null, 2),
        }
      })
    })
  }

  async function saveProgram() {
    const d = programEditor.data
    let parsed
    try {
      parsed = JSON.parse(d.structure)
    } catch {
      setProgramEditor(prev => ({ ...prev, error: 'Structure is not valid JSON. Fix it and try again.' }))
      return
    }
    if (!d.name.trim()) {
      setProgramEditor(prev => ({ ...prev, error: 'Name is required.' }))
      return
    }
    setProgramEditor(prev => ({ ...prev, saving: true, error: null }))
    const payload = {
      name: d.name.trim(),
      description: d.description.trim(),
      duration_weeks: Number(d.duration_weeks),
      days_per_week: Number(d.days_per_week),
      goal_tag: d.goal_tag,
      difficulty: d.difficulty,
      is_active: d.is_active,
      structure: parsed,
    }
    if (d.id) {
      const { error } = await supabase.from('programs').update(payload).eq('id', d.id)
      if (error) { setProgramEditor(prev => ({ ...prev, saving: false, error: error.message })); return }
      setPrograms(prev => prev.map(p => p.id === d.id ? { ...p, ...payload } : p))
    } else {
      const { data, error } = await supabase.from('programs').insert(payload).select('id, name, description, duration_weeks, days_per_week, goal_tag, difficulty, is_active').single()
      if (error) { setProgramEditor(prev => ({ ...prev, saving: false, error: error.message })); return }
      setPrograms(prev => [...prev, data])
    }
    setProgramEditor({ open: false, data: null, saving: false, error: null })
  }

  async function toggleProgramActive(p) {
    await supabase.from('programs').update({ is_active: !p.is_active }).eq('id', p.id)
    setPrograms(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x))
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
          <button className={`week-tab ${activeTab === 'programs' ? 'active' : ''}`} onClick={() => setActiveTab('programs')}>
            Programs ({programs.length})
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

        {activeTab === 'programs' && (
          <div className="programs-panel">
            <div className="programs-header">
              <div className="section-title">Programs ({programs.length})</div>
              <button className="btn-primary programs-new-btn" onClick={openNewProgram}>+ New Program</button>
            </div>

            <div className="programs-list">
              {programs.map(p => (
                <div key={p.id} className={`program-row ${!p.is_active ? 'program-row-inactive' : ''}`}>
                  <div className="program-row-info">
                    <div className="program-row-name">{p.name}</div>
                    <div className="program-row-meta">
                      {p.duration_weeks}wk · {p.days_per_week}d/wk · {p.goal_tag} · {p.difficulty}
                      {!p.is_active && <span className="badge badge-muted" style={{ marginLeft: 8 }}>inactive</span>}
                    </div>
                  </div>
                  <div className="program-row-actions">
                    <button className="btn-ghost btn-sm" onClick={() => openEditProgram(p)}>Edit</button>
                    <button className="btn-ghost btn-sm" onClick={() => toggleProgramActive(p)}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {programEditor.open && (
              <div className="program-editor">
                <div className="program-editor-header">
                  <div className="section-title">{programEditor.data?.id ? 'Edit Program' : 'New Program'}</div>
                  <button className="modal-close" onClick={() => setProgramEditor({ open: false, data: null, saving: false, error: null })}>✕</button>
                </div>

                <div className="program-editor-fields">
                  <div className="program-editor-meta">
                    <div className="field">
                      <label>Name</label>
                      <input type="text" value={programEditor.data.name}
                        onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))} />
                    </div>
                    <div className="field">
                      <label>Description</label>
                      <textarea rows={2} value={programEditor.data.description}
                        onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))} />
                    </div>
                    <div className="program-editor-row">
                      <div className="field">
                        <label>Duration (weeks)</label>
                        <input type="number" min="1" max="52" value={programEditor.data.duration_weeks}
                          onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, duration_weeks: e.target.value } }))} />
                      </div>
                      <div className="field">
                        <label>Days / week</label>
                        <input type="number" min="1" max="7" value={programEditor.data.days_per_week}
                          onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, days_per_week: e.target.value } }))} />
                      </div>
                      <div className="field">
                        <label>Goal</label>
                        <select value={programEditor.data.goal_tag}
                          onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, goal_tag: e.target.value } }))}>
                          <option value="cut">Cut</option>
                          <option value="bulk">Bulk</option>
                          <option value="maintain">Maintain</option>
                          <option value="athletic">Athletic</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Difficulty</label>
                        <select value={programEditor.data.difficulty}
                          onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, difficulty: e.target.value } }))}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="field field-checkbox">
                      <label>
                        <input type="checkbox" checked={programEditor.data.is_active}
                          onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, is_active: e.target.checked } }))} />
                        Active (visible for assignment)
                      </label>
                    </div>
                  </div>

                  <div className="field program-structure-field">
                    <label>Structure <span className="optional">(JSON)</span></label>
                    <textarea
                      className="program-structure-textarea"
                      value={programEditor.data.structure}
                      onChange={e => setProgramEditor(prev => ({ ...prev, data: { ...prev.data, structure: e.target.value } }))}
                      spellCheck={false}
                    />
                  </div>
                </div>

                {programEditor.error && <p className="form-error" style={{ marginTop: 8 }}>{programEditor.error}</p>}

                <div className="program-editor-actions">
                  <button className="btn-primary" onClick={saveProgram} disabled={programEditor.saving}>
                    {programEditor.saving ? 'Saving...' : programEditor.data?.id ? 'Save Changes' : 'Create Program'}
                  </button>
                  <button className="btn-ghost" onClick={() => setProgramEditor({ open: false, data: null, saving: false, error: null })}>
                    Cancel
                  </button>
                </div>
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
                    {programs.filter(p => p.is_active).map(p => (
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
