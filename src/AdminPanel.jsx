import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { useLocation } from 'react-router-dom'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function timeAgo(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AdminPanel() {
  const { token } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [tab, setTab] = useState(location.pathname.includes('requests') ? 'requests' : 'overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone: '', password: '', role: 'hospital', blood_group: 'O+' })
  const [adding, setAdding] = useState(false)

  const setF = (k, v) => setAddForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetchStats()
    if (tab === 'users') fetchUsers()
    if (tab === 'requests') fetchRequests()
  }, [tab])

  const fetchStats = async () => {
    try {
      const data = await api('/admin/stats', {}, token)
      setStats(data)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try { setUsers(await api('/admin/users', {}, token)) }
    catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const fetchRequests = async () => {
    setLoading(true)
    try { setRequests(await api('/admin/requests', {}, token)) }
    catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const addUser = async () => {
    if (!addForm.name || !addForm.phone || !addForm.password) return toast('Fill all fields', 'error')
    setAdding(true)
    try {
      await api('/admin/users', { method: 'POST', body: JSON.stringify(addForm) }, token)
      toast(`${addForm.role === 'hospital' ? '🏥 Hospital' : '🩸 Donor'} added successfully!`, 'success')
      setShowAddModal(false)
      setAddForm({ name: '', phone: '', password: '', role: 'hospital', blood_group: 'O+' })
      fetchUsers()
      fetchStats()
    } catch (e) { toast(e.message, 'error') }
    setAdding(false)
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' }, token)
      toast('User deleted', 'info')
      fetchUsers()
    } catch (e) { toast(e.message, 'error') }
  }

  const toggleUser = async (id) => {
    try {
      await api(`/admin/users/${id}/toggle`, { method: 'PATCH' }, token)
      fetchUsers()
    } catch (e) { toast(e.message, 'error') }
  }

  const roleColor = { admin: 'red', hospital: 'blue', donor: 'green' }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>📊 Admin Panel</h1>
        <p>System overview and management</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['overview', 'users', 'requests'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '🩸 Requests'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card red"><div className="stat-val">{stats.totalDonors}</div><div className="stat-label">Total Donors</div></div>
            <div className="stat-card green"><div className="stat-val">{stats.availableDonors}</div><div className="stat-label">Available Now</div></div>
            <div className="stat-card blue"><div className="stat-val">{stats.totalRequests}</div><div className="stat-label">Total Requests</div></div>
            <div className="stat-card yellow"><div className="stat-val">{stats.openRequests}</div><div className="stat-label">Open Requests</div></div>
            <div className="stat-card green"><div className="stat-val">{stats.totalResponses}</div><div className="stat-label">Donor Responses</div></div>
            <div className="stat-card blue"><div className="stat-val">{stats.hospitals}</div><div className="stat-label">Hospitals</div></div>
          </div>

          <div className="grid-2" style={{ gap: 20 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontFamily: 'Syne' }}>System Health</h3>
              {[
                { label: 'Donor availability rate', val: stats.totalDonors ? Math.round((stats.availableDonors / stats.totalDonors) * 100) : 0, color: 'var(--green)' },
                { label: 'Request fulfillment rate', val: stats.totalRequests ? Math.round(((stats.totalRequests - stats.openRequests) / stats.totalRequests) * 100) : 0, color: 'var(--blue)' },
                { label: 'Response rate', val: stats.totalRequests ? Math.round((stats.totalResponses / Math.max(stats.totalRequests, 1)) * 100) : 0, color: 'var(--yellow)' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>{m.label}</span>
                    <span style={{ fontWeight: 700 }}>{m.val}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16, fontFamily: 'Syne' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary" onClick={() => { setTab('users'); setShowAddModal(true) }} style={{ justifyContent: 'flex-start' }}>🏥 Add New Hospital</button>
                <button className="btn btn-ghost" onClick={() => { setTab('users'); setShowAddModal(true); setF('role','donor') }} style={{ justifyContent: 'flex-start' }}>🩸 Add New Donor</button>
                <button className="btn btn-ghost" onClick={() => setTab('requests')} style={{ justifyContent: 'flex-start' }}>📋 View All Requests →</button>
                <button className="btn btn-ghost" onClick={fetchStats} style={{ justifyContent: 'flex-start' }}>🔄 Refresh Stats →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <h2>All Users ({users.length})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={fetchUsers}>🔄 Refresh</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add User</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Phone</th><th>Role</th>
                  <th>Blood Group</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--muted)' }}>{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>{u.phone}</td>
                    <td><span className={`badge ${roleColor[u.role] || 'gray'}`}>{u.role}</span></td>
                    <td>{u.blood_group ? <span className="badge red">{u.blood_group}</span> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td>
                      {u.role === 'donor'
                        ? <span className={`badge ${u.available ? 'green' : 'gray'}`}>{u.available ? 'Available' : 'Unavailable'}</span>
                        : <span className="badge blue">Active</span>}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{timeAgo(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {u.role === 'donor' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id)}>
                            {u.available ? 'Disable' : 'Enable'}
                          </button>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(232,25,44,0.15)', color: 'var(--red-light)', border: 'none', cursor: 'pointer', borderRadius: 7, padding: '6px 12px', fontSize: 12 }}
                          onClick={() => deleteUser(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUESTS */}
      {tab === 'requests' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <h2>All Requests ({requests.length})</h2>
            <button className="btn btn-ghost btn-sm" onClick={fetchRequests}>🔄 Refresh</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Posted By</th><th>Blood Group</th><th>Units</th><th>Urgency</th><th>Address</th><th>Status</th><th>Responses</th><th>Time</th></tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--muted)' }}>{r.id}</td>
                    <td>{r.requester_name || '—'}</td>
                    <td><span className="badge red">{r.blood_group}</span></td>
                    <td>{r.units}</td>
                    <td><span className={`badge ${r.urgency === 'critical' ? 'red' : r.urgency === 'urgent' ? 'yellow' : 'blue'}`}>{r.urgency}</span></td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{r.address}</td>
                    <td><span className={`badge ${r.status === 'open' ? 'green' : 'gray'}`}>{r.status}</span></td>
                    <td><span className="badge blue">👥 {r.response_count || 0}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>➕ Add New User</h2>

            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['hospital', 'donor'].map(r => (
                  <button
                    key={r}
                    className={`btn btn-sm ${addForm.role === r ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setF('role', r)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {r === 'hospital' ? '🏥 Hospital' : '🩸 Donor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{addForm.role === 'hospital' ? 'Hospital Name' : 'Full Name'}</label>
              <input className="form-input" placeholder={addForm.role === 'hospital' ? 'e.g. Apollo Hospital Bengaluru' : 'e.g. Rahul Kumar'} value={addForm.name} onChange={e => setF('name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="10-digit phone" value={addForm.phone} onChange={e => setF('phone', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Set a password" value={addForm.password} onChange={e => setF('password', e.target.value)} />
            </div>

            {addForm.role === 'donor' && (
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={addForm.blood_group} onChange={e => setF('blood_group', e.target.value)}>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addUser} disabled={adding}>
                {adding ? <span className="loader" /> : `✅ Add ${addForm.role === 'hospital' ? 'Hospital' : 'Donor'}`}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
