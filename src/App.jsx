import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import DonorDashboard from './pages/DonorDashboard'
import RequestsPage from './pages/RequestsPage'
import HospitalPanel from './pages/HospitalPanel'
import AdminPanel from './pages/AdminPanel'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loader" style={{ width: 48, height: 48 }} /></div>
  if (!user) return <Navigate to="/auth" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      {children}
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Donor routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <DonorDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <AppLayout>
                  <RequestsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['donor']}>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Hospital routes */}
            <Route path="/hospital" element={
              <ProtectedRoute roles={['hospital', 'admin']}>
                <AppLayout>
                  <HospitalPanel />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout>
                  <AdminPanel />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout>
                  <AdminPanel />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
