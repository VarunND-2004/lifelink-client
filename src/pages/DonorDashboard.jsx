import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CENTER = [12.9716, 77.5946]

export default function DonorDashboard() {
  const { token, user } = useAuth()
  const toast = useToast()
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [radius, setRadius] = useState(20)
  const [available, setAvailable] = useState(user?.available === 1)

  const fetchDonors = async () => {
    setLoading(true)
    try {
      const bg = filter === 'All' ? '' : filter
      const data = await api(`/donors/nearby?blood_group=${bg}&lat=${CENTER[0]}&lng=${CENTER[1]}&radius=${radius}`, {}, token)
      setDonors(data)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  useEffect(() => { fetchDonors() }, [filter, radius])

  const toggleAvailability = async () => {
    try {
      await api('/donors/availability', { method: 'PATCH', body: JSON.stringify({ available: !available }) }, token)
      setAvailable(!available)
      toast(`You are now ${!available ? 'available' : 'unavailable'} for donation`, 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>🗺️ Find Donors</h1>
        <p>Search for blood donors near you in Bengaluru</p>
      </div>

      {user?.role === 'donor' && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Your Availability</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Toggle to show/hide yourself to requesters</div>
          </div>
          <div className="toggle-wrap">
            <span style={{ fontSize: 13, color: available ? 'var(--green)' : 'var(--muted)' }}>
              {available ? 'Available' : 'Unavailable'}
            </span>
            <div className={`toggle ${available ? 'on' : ''}`} onClick={toggleAvailability} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div className="form-label">Blood Group</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  className={`btn btn-sm ${filter === bg ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(bg)}
                >{bg}</button>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div className="form-label">Radius: {radius}km</div>
            <input type="range" min="5" max="50" value={radius} onChange={e => setRadius(e.target.value)}
              style={{ accentColor: 'var(--red)', width: 120 }} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Map */}
        <div>
          <div className="section-header">
            <h2>Live Map</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{donors.length} donor{donors.length !== 1 ? 's' : ''} found</span>
          </div>
          <div className="map-container">
            <MapContainer center={CENTER} zoom={12} style={{ height: 420 }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
              />
              <Circle center={CENTER} radius={radius * 1000} pathOptions={{ color: '#E8192C', fillOpacity: 0.04, weight: 1 }} />
              {/* Center marker (you) */}
              <Marker position={CENTER} icon={redIcon}>
                <Popup><strong>📍 Search Origin</strong><br />Bengaluru</Popup>
              </Marker>
              {donors.map(d => (
                <Marker key={d.id} position={[d.latitude, d.longitude]}>
                  <Popup>
                    <strong>{d.name}</strong><br />
                    🩸 {d.blood_group}<br />
                    {d.phone && <>📞 {d.phone}<br /></>}
                    📍 {d.distance}km away
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Donor list */}
        <div>
          <div className="section-header">
            <h2>Available Donors</h2>
            {loading && <span className="loader" />}
          </div>
          {donors.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>No donors found for {filter === 'All' ? 'any blood group' : filter} within {radius}km</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {donors.map(d => (
                <div key={d.id} className="donor-card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div className="blood-badge">{d.blood_group}</div>
                    <div style={{ flex: 1 }}>
                      <h3>{d.name}</h3>
                      <div className="dist">📍 {d.distance}km away {d.phone ? `· 📞 ${d.phone}` : ''}</div>
                      <span className="badge green">✓ Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
