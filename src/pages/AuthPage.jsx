import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [step, setStep] = useState(1) // 1=form, 2=otp
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ phone: '', password: '', name: '', blood_group: 'O+', otp: '' })
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const sendOTP = async () => {
    if (!form.phone || form.phone.length < 10) return toast('Enter valid phone number', 'error')
    setLoading(true)
    try {
      await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: form.phone }) })
      toast('OTP sent! Use 123456 for demo', 'success')
      setStep(2)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone: form.phone, otp: form.otp }) })
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, phone: form.phone, password: form.password, blood_group: form.blood_group, latitude: 12.9716, longitude: 77.5946 })
      })
      login(data.token, data.user)
      toast('Welcome to LifeLink! 🩸', 'success')
      navigate('/dashboard')
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ phone: form.phone, password: form.password }) })
      login(data.token, data.user)
      toast(`Welcome back, ${data.user.name}!`, 'success')
      navigate('/dashboard')
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="pulse">🩸</div>
          <h1>Life<em>Link</em></h1>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setStep(1) }}>Login</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setStep(1) }}>Register</button>
        </div>

        {tab === 'login' ? (
          <>
            <div className="otp-note">📋 Demo: Admin 9999900000 / Hospital 9999911111 / Donor 9876543210 — all password: <strong>admin123 / hospital123 / donor123</strong></div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="10-digit phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin} disabled={loading}>
              {loading ? <span className="loader" /> : '🩸 Login'}
            </button>
          </>
        ) : (
          <>
            {step === 1 ? (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" placeholder="10-digit phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Create password" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={sendOTP} disabled={loading}>
                  {loading ? <span className="loader" /> : 'Send OTP →'}
                </button>
              </>
            ) : (
              <>
                <div className="otp-note">📱 OTP sent to {form.phone}. Demo OTP: <strong>123456</strong></div>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input className="form-input" placeholder="6-digit OTP" value={form.otp} onChange={e => set('otp', e.target.value)} maxLength={6} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={handleRegister} disabled={loading}>
                  {loading ? <span className="loader" /> : '✅ Verify & Register'}
                </button>
                <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setStep(1)}>← Back</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
