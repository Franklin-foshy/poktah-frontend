import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import Admin         from './pages/admin/Admin'
import AdminLogin    from './pages/admin/AdminLogin'
import TiendaPublica from './pages/TiendaPublica'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-stone-400">Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight:'100vh', background:'#F5F0E8' }} />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/tienda/:slug" element={<TiendaPublica />} />
          <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard/*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*"     element={<Admin />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}