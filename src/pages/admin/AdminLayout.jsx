import { useNavigate, useLocation, Link } from 'react-router-dom'

const NAV = [
  { path: '/admin',          label: 'Inicio',     icon: '📊' },
  { path: '/admin/negocios', label: 'Negocios',   icon: '🏢' },
  { path: '/admin/leads',    label: 'Prospectos', icon: '🎯' },
  { path: '/admin/planes',   label: 'Planes',     icon: '📦' },
  { path: '/admin/precios',  label: 'Precios',    icon: '💰' },
  { path: '/admin/pagos',    label: 'Pagos',      icon: '💸' },
]

export default function AdminLayout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path)

  const handleLogout = () => {
    localStorage.removeItem('poktah_admin_token')
    navigate('/admin/login')
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#0F0F1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: '#1A1A2E', borderRight: '1px solid #2D2D44',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #2D2D44' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Poktah
          </div>
          <div style={{ fontSize: 11, color: '#6C63FF', marginTop: 2, fontWeight: 600 }}>
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(item => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                  background: active ? '#6C63FF22' : 'transparent',
                  color: active ? '#6C63FF' : '#9CA3AF',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #2D2D44' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              background: 'transparent', border: '1px solid #2D2D44',
              color: '#6B7280', fontSize: 13, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}
