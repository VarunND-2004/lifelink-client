import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { io } from 'socket.io-client'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function timeAgo(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function RequestsPage() {
  const { token, user } = useAuth()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [responding, setResponding] = useState(null)
  const [form, setForm] = useState({ blood_group: 'O+', units: 1, urgency: 'normal', address: 'Bengaluru' })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetchRequests()
    const socket = io('https://web-production-f6275.up.railway.app')
    socket.on('new_request', req => {
      setRequests(p => [{ ...req, response_count: 0 }, ...p])
      toast('🩸 New blood request!', 'info')
    })
    socket.on('donor_responded', ({ request_id, donor }) => {
      setRequests(p => p.map(r => r.id === request_id ? { ...r, response_count: (r.response_count || 0) + 1 } : r))
      toast(`💪 ${donor.name} responded to a request`, 'success')
    })
    return () => socket.disconnect()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await api('/requests', {}, token)
      setRequests(data)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const postRequest = async () => {
    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify({ ...form, latitude: 12.9716, longitude: 77.5946 })
      }, token)
      toast('Blood request posted!', 'success')
      setShowModal(false)
      fetchRequests()
    } catch (e) { toast(e.message, 'error') }
  }

  const respond = async (id) => {
    setResponding(id)
    try {
      await api(`/requests/${id}/respond`, { method: 'POST' }, token)
      toast('✅ You have agreed to donate!', 'success')
      fetchRequests()
    } catch (e) { toast(e.message, 'error') }
    setResponding(null)
  }

  const closeRequest = async (id) => {
    try {
      await api(`/requests/${id}/close`, { method: 'PATCH' }, token)
      toast('Request closed', 'info')
      fetchRequests()
    } catch (e) { toast(e.message, 'error') }
  }

  const urgencyColor = { normal: 'blue', urgent: 'yellow', critical: 'red' }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>🩸 Blood Requests</h1>
        <p>Live feed of blood donation requests</p>
      </div>

      <div className="section-header">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge green">● Live</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{requests.filter(r => r.status === 'open').length} open requests</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Request</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loader" style={{ width: 40, height: 40 }} /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No requests yet</p></div>
      ) : (
        requests.map(req => (
          <div key={req.id} className={`request-card ${req.urgency === 'critical' ? 'urgent' : ''}`}>
            <div className="request-meta">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(232,25,44,0.12)', border: '2px solid rgba(232,25,44,0.3)', borderRadius: 10, fontFamily: 'Syne', fontWeight: 800, color: 'var(--red-light)', fontSize: 13 }}>
                {req.blood_group}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{req.requester_name || 'Anonymous'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>📍 {req.address} · {timeAgo(req.created_at)}</div>
              </div>
              <span className={`badge ${urgencyColor[req.urgency] || 'blue'}`}>{req.urgency}</span>
              <span className={`badge ${req.status === 'open' ? 'green' : 'gray'}`}>{req.status}</span>
              <span className="badge blue">{req.units} unit{req.units > 1 ? 's' : ''}</span>
              <span className="badge gray">👥 {req.response_count || 0} responded</span>
            </div>

            {req.status === 'open' && (
              <div className="request-actions">
                {user?.role === 'donor' && (
                  <button className="btn btn-primary btn-sm" onClick={() => respond(req.id)} disabled={responding === req.id}>
                    {responding === req.id ? <span className="loader" /> : '💉 I can donate'}
                  </button>
                )}
                {(user?.role === 'admin' || user?.id === req.requester_id || user?.id === req.hospital_id) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => closeRequest(req.id)}>✕ Close</button>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Post Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🩸 Post Blood Request</h2>
            <div className="form-group">
              <label className="form-label">Blood Group Needed</label>
              <select className="form-input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Units Needed</label>
                <input className="form-input" type="number" min="1" max="10" value={form.units} onChange={e => set('units', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Urgency</label>
                <select className="form-input" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hospital / Address</label>
              <input className="form-input" placeholder="e.g. Manipal Hospital, Bengaluru" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={postRequest}>Post Request</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
