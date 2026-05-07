import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { getStats } from '../api/client'

// ─── Iconos SVG ───────────────────────────────────────────────────────────────

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const icons = {
    home:    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
    orders:  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />,
    payments:<><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></>,
    products:<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.286 8.986a.75.75 0 01-1.06 0l-1.796-1.8a.75.75 0 111.06-1.06l1.796 1.8 4.303-4.305a.75.75 0 011.06 1.06l-4.303 4.305z" />,
    clients: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    followup:<path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    agent:   <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />,
    promos:  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z" />,
    config:  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
    users:   <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    plan:    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
    logout:  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />,
    sun:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />,
    moon:    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />,
    menu:    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />,
    chevron: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />,
    close:   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  }
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.6}>
      {icons[name]}
    </svg>
  )
}

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV = [
  { path: '/dashboard',               icon: 'home',     label: 'Inicio' },
  { path: '/dashboard/pedidos',       icon: 'orders',   label: 'Pedidos' },
  { path: '/dashboard/pagos',         icon: 'payments', label: 'Pagos' },
  { path: '/dashboard/productos',     icon: 'products', label: 'Productos' },
  { path: '/dashboard/clientes',      icon: 'clients',  label: 'Clientes' },
  { path: '/dashboard/seguimientos',  icon: 'followup', label: 'Post-venta',    planPro: true },
  { path: '/dashboard/agente',        icon: 'agent',    label: 'Agente IA' },
  { path: '/dashboard/promociones',   icon: 'promos',   label: 'Promociones',   planPro: true },
  { path: '/dashboard/configuracion', icon: 'config',   label: 'Configuración' },
  { path: '/dashboard/usuarios',      icon: 'users',    label: 'Usuarios',    solodueno: true },
  { path: '/dashboard/suscripcion',   icon: 'plan',     label: 'Suscripción', solodueno: true },
]

const TAB_NAV = NAV.slice(0, 4)

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ collapsed }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'linear-gradient(135deg, #1C1410 0%, #2A1E12 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 2px 8px rgba(212,168,67,0.25)',
      }}>
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#D4A843"/>
          <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#D4A843" opacity="0.5"/>
          <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#D4A843" opacity="0.5"/>
          <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#D4A843"/>
        </svg>
      </div>
      {!collapsed && (
        <span style={{ fontSize: 16, fontWeight: 800, color: t.sidebarText, letterSpacing: '-0.4px', lineHeight: 1 }}>
          Pok<span style={{ color: '#D4A843' }}>tah</span>
        </span>
      )}
    </div>
  )
}

// ─── LAYOUT raíz ─────────────────────────────────────────────────────────────

export default function Layout({ children }) {
  const isMobile = useIsMobile()
  return isMobile ? <MobileLayout>{children}</MobileLayout> : <DesktopLayout>{children}</DesktopLayout>
}

// ─── DESKTOP ─────────────────────────────────────────────────────────────────

function DesktopLayout({ children }) {
  const { user, logout } = useAuth()
  const { mode, toggle, t } = useTheme()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [plan, setPlan] = useState(null)

  useEffect(() => {
    getStats().then(r => setPlan(r.data.plan || 'basico')).catch(() => {})
  }, [])

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path)

  const visibles = NAV.filter(item => {
    if (item.solodueno && user?.rol === 'empleado') return false
    if (item.planPro && plan === 'basico') return false
    return true
  })

  const sideW = collapsed ? 64 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside style={{
        width: sideW,
        background: t.sidebarBg,
        borderRight: `1px solid ${t.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>

        {/* Brand */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 18px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 68, borderBottom: `1px solid ${t.sidebarBorder}`,
        }}>
          <Logo collapsed={collapsed} />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: t.sidebarTextMuted, display: 'flex', alignItems: 'center', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = t.sidebarHover}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="chevron" size={14} color={t.sidebarTextMuted} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', margin: '12px auto 4px', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', color: t.sidebarTextMuted }}
            onMouseEnter={e => e.currentTarget.style.background = t.sidebarHover}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Icon name="menu" size={16} color={t.sidebarTextMuted} />
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', scrollbarWidth: 'none' }}>
          {visibles.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: collapsed ? '9px 0' : '9px 11px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  marginBottom: 2, transition: 'all 0.12s',
                  background: active ? t.sidebarNavActive : 'transparent',
                  color: active ? t.sidebarNavActiveText : t.sidebarNavText,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  position: 'relative',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.sidebarHover }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {active && !collapsed && (
                  <span style={{
                    position: 'absolute', left: 0, top: '18%', bottom: '18%',
                    width: 3, borderRadius: 99, background: t.accent,
                  }} />
                )}
                <Icon name={item.icon} size={16} color={active ? t.sidebarNavActiveText : t.sidebarNavText} />
                {!collapsed && <span style={{ lineHeight: 1 }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ borderTop: `1px solid ${t.sidebarBorder}`, padding: collapsed ? '12px 0' : '12px 10px' }}>

          {/* Toggle tema */}
          <button
            onClick={toggle}
            title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: '100%', display: 'flex', fontFamily: 'inherit',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, padding: collapsed ? '8px 0' : '8px 10px',
              borderRadius: 9, marginBottom: 6,
              color: t.sidebarTextMuted, fontSize: 12,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.sidebarHover}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Icon name={mode === 'light' ? 'moon' : 'sun'} size={15} color={t.sidebarTextMuted} />
            {!collapsed && <span style={{ color: t.sidebarTextMuted }}>{mode === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>}
          </button>

          {/* Usuario */}
          {!collapsed && (
            <div style={{
              background: t.sidebarUserBg,
              border: `1px solid ${t.sidebarBorder}`,
              borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    {(user?.nombre || 'N')?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.sidebarText, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.nombre || 'Mi negocio'}
                    </div>
                    {plan && <PlanBadge plan={plan} onClick={() => navigate('/dashboard/suscripcion')} />}
                  </div>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  title="Cerrar sesión"
                  onMouseEnter={e => e.currentTarget.style.background = t.sidebarHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon name="logout" size={14} color={t.sidebarTextMuted} />
                </button>
              </div>
            </div>
          )}

          {collapsed && (
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', margin: '0 auto', padding: 8, borderRadius: 8 }}
              title="Cerrar sesión"
            >
              <Icon name="logout" size={15} color={t.sidebarTextMuted} />
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, background: t.bg }}>
        <div key={location.pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}

// ─── MOBILE ──────────────────────────────────────────────────────────────────

function MobileLayout({ children }) {
  const { user, logout } = useAuth()
  const { mode, toggle, t } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [masOpen, setMasOpen] = useState(false)
  const [plan,    setPlan]    = useState(null)

  useEffect(() => {
    getStats().then(r => setPlan(r.data.plan || 'basico')).catch(() => {})
  }, [])

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path)

  const isMasActive = NAV.slice(4).some(item => isActive(item.path))
  const goTo = (path) => { setMasOpen(false); navigate(path) }
  const visibleMas = NAV.slice(4).filter(item => {
    if (item.solodueno && user?.rol === 'empleado') return false
    if (item.planPro && plan === 'basico') return false
    return true
  })

  return (
    <div style={{
      background: t.bg, minHeight: '100dvh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    }}>
      <div style={{ paddingBottom: 72, minHeight: '100dvh' }}>
        <div key={location.pathname} className="page-enter">
          {children}
        </div>
      </div>

      {/* ── BOTTOM TAB ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: t.surface,
        borderTop: `1px solid ${t.border}`,
        display: 'flex', height: 64, zIndex: 200,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        {TAB_NAV.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="btn-tap"
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, border: 'none', background: 'none',
                cursor: 'pointer', padding: '6px 4px',
                color: active ? t.accent : t.textMuted,
                position: 'relative',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 3, borderRadius: '0 0 3px 3px',
                  background: t.accent,
                }} />
              )}
              <div style={{
                padding: '5px 12px', borderRadius: 10,
                background: active ? t.accentBg : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Icon name={item.icon} size={18} color={active ? t.accent : t.textMuted} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}

        {/* Más */}
        <button
          onClick={() => setMasOpen(v => !v)}
          className="btn-tap"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, border: 'none', background: 'none',
            cursor: 'pointer', padding: '6px 4px',
            color: (masOpen || isMasActive) ? t.accent : t.textMuted,
            position: 'relative',
          }}
        >
          {(masOpen || isMasActive) && (
            <span style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 32, height: 3, borderRadius: '0 0 3px 3px',
              background: t.accent,
            }} />
          )}
          <div style={{
            padding: '5px 12px', borderRadius: 10,
            background: (masOpen || isMasActive) ? t.accentBg : 'transparent',
            transition: 'all 0.15s',
          }}>
            <Icon name={masOpen ? 'close' : 'menu'} size={18} color={(masOpen || isMasActive) ? t.accent : t.textMuted} />
          </div>
          <span style={{ fontSize: 10, fontWeight: (masOpen || isMasActive) ? 600 : 400 }}>Más</span>
        </button>
      </nav>

      {/* ── MÁS DRAWER ─────────────────────────────────────────────── */}
      {masOpen && (
        <>
          <div onClick={() => setMasOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300,
          }} />
          <div style={{
            position: 'fixed', bottom: 64, left: 0, right: 0,
            background: t.surface, borderRadius: '20px 20px 0 0',
            zIndex: 400, boxShadow: t.shadowLg, paddingBottom: 8,
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '14px auto 16px' }} />

            {/* Header usuario */}
            <div style={{ padding: '0 20px 14px', borderBottom: `1px solid ${t.borderLight}`, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(user?.nombre || 'N')?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{user?.nombre || 'Mi negocio'}</div>
                    {plan && <PlanBadge plan={plan} light />}
                  </div>
                </div>
                <button onClick={toggle} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 8px', cursor: 'pointer', display: 'flex' }}>
                  <Icon name={mode === 'light' ? 'moon' : 'sun'} size={16} color={t.textMuted} />
                </button>
              </div>
            </div>

            {/* Nav items */}
            {visibleMas.map(item => (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className="btn-tap"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 14, padding: '12px 20px', border: 'none',
                  background: isActive(item.path) ? t.navActive : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  color: isActive(item.path) ? t.accent : t.text,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: isActive(item.path) ? t.accentBg : t.surfaceHover,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={item.icon} size={17} color={isActive(item.path) ? t.accent : t.textMuted} />
                </div>
                <span style={{ fontSize: 14, fontWeight: isActive(item.path) ? 600 : 400 }}>{item.label}</span>
                {!isActive(item.path) && (
                  <div style={{ marginLeft: 'auto' }}>
                    <Icon name="chevronRight" size={14} color={t.textMuted} />
                  </div>
                )}
              </button>
            ))}

            {/* Logout */}
            <div style={{ borderTop: `1px solid ${t.borderLight}`, marginTop: 6 }}>
              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 14, padding: '12px 20px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  color: t.textMuted, fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: t.surfaceHover,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="logout" size={17} color={t.textMuted} />
                </div>
                <span style={{ fontSize: 14 }}>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS = {
  basico:     { color: '#9CA3AF', border: '#9CA3AF30' },
  pro:        { color: '#22C55E', border: '#22C55E44' },
  enterprise: { color: '#D4A843', border: '#D4A84344' },
}

function PlanBadge({ plan, light, onClick }) {
  const pc = PLAN_COLORS[plan] || PLAN_COLORS.basico
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block', marginTop: 2,
        padding: '1px 7px', borderRadius: 4,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: light ? (PLAN_COLORS[plan]?.color?.replace('A8', '6C') || '#6C63FF') : pc.color,
        border: `1px solid ${light ? (pc.border) : pc.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {plan}
    </span>
  )
}
