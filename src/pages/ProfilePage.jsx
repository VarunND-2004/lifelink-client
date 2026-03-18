import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function ProfilePage() {
  const { token, user, login } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const data = await api('/donors/profile', {}, token)
      setProfile(data)
      setForm({ name: data.name, blood_group: data.blood_group, latitude: data.latitude, longitude: data.longitude })
    } catch (e) { toast(e.message, 'error') }
  }

  const save = async () => {
    setLoading(true)
    try {
      await api('/donors/profile', { method: 'PUT', body: JSON.stringify(form) }, token)
      toast('Profile updated!', 'success')
      setEditing(false)
      fetchProfile()
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const toggleAvail = async () => {
    try {
      await api('/donors/availability', { method: 'PATCH', body: JSON.stringify({ available: !profile.available }) }, token)
      setProfile(p => ({ ...p, available: p.available ? 0 : 1 }))
      toast(`Availability updated`, 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  if (!profile) return <div className="main-content"><div className="empty-state"><div className="loader" style={{ width: 40, height: 40 }} /></div></div>

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your donor information</p>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          {/* Avatar + name */}
          <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(232,25,44,0.12)', border: '3px solid var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: 'var(--red)', fontFamily: 'Syne' }}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <h2 style={{ fontFamily: 'Syne', marginBottom: 4 }}>{profile.name}</h2>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>📞 {profile.phone}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="badge red">🩸 {profile.blood_group}</span>
              <span className={`badge ${profile.available ? 'green' : 'gray'}`}>{profile.available ? '✓ Available' : '✗ Unavailable'}</span>
              <span className="badge blue" style={{ textTransform: 'capitalize' }}>{profile.role}</span>
            </div>
          </div>

          {/* Availability toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Donation Availability</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Let others find you for blood requests</div>
            </div>
            <div className="toggle-wrap">
              <span style={{ fontSize: 12, color: profile.available ? 'var(--green)' : 'var(--muted)' }}>
                {profile.available ? 'On' : 'Off'}
              </span>
              <div className={`toggle ${profile.available ? 'on' : ''}`} onClick={toggleAvail} />
            </div>
          </div>

          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Info</div>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Member since</span>
                <span>{new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Location</span>
                <span>{profile.latitude?.toFixed(4)}, {profile.longitude?.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h2>Edit Profile</h2>
            {!editing && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>}
          </div>

          {editing ? (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={form.blood_group} onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))}>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={loading}>
                  {loading ? <span className="loader" /> : '💾 Save Changes'}
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Name', val: profile.name },
                { label: 'Phone', val: profile.phone },
                { label: 'Blood Group', val: profile.blood_group },
                { label: 'Latitude', val: profile.latitude },
                { label: 'Longitude', val: profile.longitude },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{f.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f.val ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
