import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function timeAgo(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function HospitalPanel() {
  const { token, user } = useAuth()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ blood_group: 'O+', units: 1, urgency: 'normal', address: user?.name || 'City General Hospital' })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const all = await api('/requests', {}, token)
      // show only this hospital's requests
      const mine = all.filter(r => r.hospital_id === user?.id || r.requester_id === user?.id || user?.role === 'hospital')
      setRequests(all)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const fetchResponses = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    try {
      const data = await api(`/requests/${id}/responses`, {}, token)
      setResponses(p => ({ ...p, [id]: data }))
      setExpandedId(id)
    } catch (e) { toast(e.message, 'error') }
  }

  const postRequest = async () => {
    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify({ ...form, latitude: 12.9352, longitude: 77.6245 })
      }, token)
      toast('Blood request posted!', 'success')
      setShowModal(false)
      fetchRequests()
    } catch (e) { toast(e.message, 'error') }
  }

  const closeReq = async (id) => {
    try {
      await api(`/requests/${id}/close`, { method: 'PATCH' }, token)
      toast('Request closed', 'info')
      fetchRequests()
    } catch (e) { toast(e.message, 'error') }
  }

  const stats = {
    open: requests.filter(r => r.status === 'open').length,
    closed: requests.filter(r => r.status === 'closed').length,
    total: requests.length,
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>🏥 Hospital Panel</h1>
        <p>Manage blood requests for {user?.name}</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card red"><div className="stat-val">{stats.open}</div><div className="stat-label">Open Requests</div></div>
        <div className="stat-card green"><div className="stat-val">{stats.closed}</div><div className="stat-label">Fulfilled</div></div>
        <div className="stat-card blue"><div className="stat-val">{stats.total}</div><div className="stat-label">Total Posted</div></div>
      </div>

      <div className="section-header">
        <h2>All Blood Requests</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Emergency Request</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loader" style={{ width: 40, height: 40 }} /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No requests yet</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <>
                    <tr key={req.id}>
                      <td><span className="badge red">{req.blood_group}</span></td>
                      <td>{req.units}</td>
                      <td>
                        <span className={`badge ${req.urgency === 'critical' ? 'red' : req.urgency === 'urgent' ? 'yellow' : 'blue'}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.address}</td>
                      <td><span className={`badge ${req.status === 'open' ? 'green' : 'gray'}`}>{req.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => fetchResponses(req.id)}>
                          👥 {req.response_count || 0} {expandedId === req.id ? '▲' : '▼'}
                        </button>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{timeAgo(req.created_at)}</td>
                      <td>
                        {req.status === 'open' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => closeReq(req.id)}>Close</button>
                        )}
                      </td>
                    </tr>
                    {expandedId === req.id && responses[req.id] && (
                      <tr key={`resp-${req.id}`}>
                        <td colSpan={8} style={{ background: 'var(--bg3)', padding: '12px 16px' }}>
                          {responses[req.id].length === 0 ? (
                            <span style={{ color: 'var(--muted)', fontSize: 13 }}>No donors have responded yet</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {responses[req.id].map(r => (
                                <div key={r.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                                  <strong>{r.name}</strong> · 🩸 {r.blood_group} · 📞 {r.phone}
                                  <span className="badge green" style={{ marginLeft: 8 }}>Accepted</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🚨 Emergency Blood Request</h2>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Units</label>
                <input className="form-input" type="number" min="1" max="20" value={form.units} onChange={e => set('units', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Urgency Level</label>
              <select className="form-input" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">🚨 Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hospital Address</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={postRequest}>🚨 Post Emergency Request</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
