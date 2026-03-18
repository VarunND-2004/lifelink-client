import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const navByRole = {
  donor: [
    { icon: '🗺️', label: 'Find Donors', path: '/dashboard' },
    { icon: '🩸', label: 'Blood Requests', path: '/requests' },
    { icon: '👤', label: 'My Profile', path: '/profile' },
  ],
  hospital: [
    { icon: '📋', label: 'Dashboard', path: '/dashboard' },
    { icon: '🩸', label: 'Post Request', path: '/requests' },
    { icon: '👥', label: 'Manage Requests', path: '/hospital' },
  ],
  admin: [
    { icon: '📊', label: 'Overview', path: '/dashboard' },
    { icon: '👥', label: 'Users', path: '/admin/users' },
    { icon: '🩸', label: 'Requests', path: '/admin/requests' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null
  const nav = navByRole[user.role] || navByRole.donor

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="pulse">🩸</div>
        <span>Life<em>Link</em></span>
      </div>
      <nav className="sidebar-nav">
        {nav.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="uname">{user.name}</div>
            <div className="urole">{user.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  )
}
