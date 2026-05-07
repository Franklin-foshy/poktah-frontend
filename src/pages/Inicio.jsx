import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getPedidos, getPagosPendientes } from '../api/client'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSSE } from '../hooks/useSSE'

// ─── Iconos SVG ────────────────────────────────────────────────────────────────

const Ico = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  ventas:    'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.06-.879-1.06-2.303 0-3.182s2.947-.879 4.006 0l.415.33',
  pedidos:   'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  pagos:     'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  clientes:  'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  productos: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.286 8.986a.75.75 0 01-1.06 0l-1.796-1.8a.75.75 0 111.06-1.06l1.796 1.8 4.303-4.305a.75.75 0 011.06 1.06l-4.303 4.305z',
  margen:    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  agente:    'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  refresh:   'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  chevron_r: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  plan:      'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
}

const PERIODOS = [
  { key: 'hoy',    label: 'Hoy'   },
  { key: 'semana', label: 'Semana'},
  { key: 'mes',    label: 'Mes'   },
  { key: 'anio',   label: 'Año'   },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function fmtDate() {
  return new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, iconColor, iconBg, sub, onClick, t }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: t.surface, borderRadius: 14,
        padding: '15px 16px', cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${t.border}`, boxShadow: t.shadow,
        transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.shadowMd } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.shadow }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico d={ICONS[icon]} size={16} color={iconColor} />
        </div>
        {sub && (
          <span style={{ fontSize: 10, fontWeight: 700, color: sub.color, background: sub.bg, padding: '2px 7px', borderRadius: 20 }}>
            {sub.label}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </div>
  )
}

// ─── PedidoRow ────────────────────────────────────────────────────────────────

function PedidoRow({ p, t, onClick }) {
  const ESTADO_COLORS = {
    nuevo:          { bg: t.blueBg,    text: t.blue,       dot: t.blue       },
    esperando_pago: { bg: t.yellowBg,  text: t.yellow,     dot: t.yellow     },
    pago_recibido:  { bg: t.orangeBg,  text: t.orange,     dot: t.orange     },
    confirmado:     { bg: t.greenBg,   text: t.greenDark,  dot: t.green      },
    enviado:        { bg: t.accentBg,  text: t.accentText, dot: t.accent     },
    entregado:      { bg: t.border,    text: t.textSec,    dot: t.textMuted  },
    cancelado:      { bg: t.redBg,     text: t.red,        dot: t.red        },
  }
  const ec = ESTADO_COLORS[p.estado] || ESTADO_COLORS.nuevo
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.borderLight}`, cursor: 'pointer' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: t.accentBg, color: t.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
        {p.cliente?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.cliente}</div>
        <div style={{ fontSize: 11, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.codigo} · {p.producto}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Q{p.total}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, marginTop: 3, background: ec.bg, color: ec.text, fontSize: 10, fontWeight: 600 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ec.dot, flexShrink: 0 }} />
          {p.estado.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({ title, linkLabel, onLink, children, t }) {
  return (
    <div style={{ background: t.surface, borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: t.shadow }}>
      <div style={{ padding: '13px 16px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.borderLight}` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{title}</span>
        {onLink && (
          <button onClick={onLink} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: t.accent, padding: 0, fontFamily: 'inherit' }}>
            {linkLabel || 'Ver todos'} <Ico d={ICONS.chevron_r} size={11} color={t.accent} />
          </button>
        )}
      </div>
      <div style={{ padding: '4px 16px 12px' }}>{children}</div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Inicio() {
  const [stats,      setStats]      = useState(null)
  const [pedidos,    setPedidos]    = useState([])
  const [pagos,      setPagos]      = useState([])
  const [loading,    setLoad]       = useState(true)
  const [periodo,    setPeriodo]    = useState('hoy')
  const [refreshing, setRefreshing] = useState(false)

  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { t }    = useTheme()
  const { user } = useAuth()

  useEffect(() => { cargar(periodo) }, [periodo]) // eslint-disable-line
  useSSE(['pedido', 'pago'], () => cargar(periodo))

  const cargar = async (p = periodo) => {
    try {
      const [s, ped, pg] = await Promise.all([
        getStats(p),
        getPedidos(null, 1, 5),
        getPagosPendientes(),
      ])
      setStats(s.data)
      setPedidos(ped.data.items ?? [])
      setPagos(pg.data)
    } catch(e) { console.error(e) }
    finally { setLoad(false); setRefreshing(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico d={ICONS.refresh} size={20} color={t.accent} />
        </div>
        <span style={{ fontSize: 13, color: t.textMuted }}>Cargando...</span>
      </div>
    )
  }

  const pad   = isMobile ? 12 : 20
  const cols4 = isMobile ? 'repeat(2,1fr)' : 'repeat(4,minmax(0,1fr))'
  const cols2 = isMobile ? '1fr' : '1fr 1fr'
  const gap   = isMobile ? 10 : 12

  const ventas      = stats?.ventas_hoy          ?? 0
  const ganancia    = stats?.ganancia_neta_hoy   ?? 0
  const margen      = stats?.margen_pct          ?? 0
  const pedidosCnt  = stats?.pedidos_nuevos      ?? 0
  const pagosPend   = stats?.pagos_pendientes    ?? 0
  const clientesCnt = stats?.clientes_activos    ?? 0
  const clientesNew = stats?.clientes_nuevos_hoy ?? 0

  const planKey    = stats?.plan || 'basico'
  const limiteMsgs = stats?.plan_limite_msgs  ?? 500
  const usadoMsgs  = stats?.plan_mensajes_mes ?? 0
  const pctMsgs    = limiteMsgs === -1 ? 8 : Math.min(100, Math.round((usadoMsgs / limiteMsgs) * 100))
  const barColor   = pctMsgs >= 90 ? t.red : pctMsgs >= 70 ? t.yellow : t.accent
  const margenColor = margen >= 30 ? t.green : margen >= 15 ? t.yellow : t.red

  // Colores del plan — no dependen del tema porque el badge tiene su propio bg
  const planCfg = {
    basico:     { label: 'Básico',     color: '#6B7280', border: '#6B728030' },
    pro:        { label: 'Pro',        color: '#15803D', border: '#15803D30' },
    enterprise: { label: 'Enterprise', color: '#92400E', border: '#92400E30' },
  }
  const planC = planCfg[planKey] || planCfg.basico

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>

      {/* ── HEADER (sticky) ─────────────────────────────────────────────── */}
      <div style={{
        background: t.surface,
        borderBottom: `1px solid ${t.border}`,
        padding: isMobile ? '14px 14px 10px' : '16px 22px 12px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>

        {/* Fila 1: saludo + refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 2 }}>{fmtDate()}</div>
            <h1 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 }}>
              {greeting()}{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''} 👋
            </h1>
          </div>

          <button
            onClick={() => { setRefreshing(true); cargar(periodo) }}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: t.surfaceHover, color: t.textSec,
              border: `1px solid ${t.border}`,
              padding: '7px 11px', borderRadius: 9, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', opacity: refreshing ? 0.6 : 1, fontFamily: 'inherit',
            }}
          >
            <Ico d={ICONS.refresh} size={13} color={t.textMuted} />
            {!isMobile && (refreshing ? 'Actualizando…' : 'Actualizar')}
          </button>
        </div>

        {/* Fila 2: barra de plan compacta */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
          padding: '7px 12px', background: t.bg,
          borderRadius: 10, border: `1px solid ${t.borderLight}`,
          marginBottom: 10,
        }}>
          {/* Badge plan */}
          <span
            onClick={() => navigate('/dashboard/suscripcion')}
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: planC.color,
              border: `1px solid ${planC.border}`, borderRadius: 6,
              padding: '2px 8px', cursor: 'pointer', flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {planC.label}
          </span>

          {/* Progress bar */}
          <div style={{ flex: 1, height: 5, background: t.borderLight, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${pctMsgs}%`, background: barColor, transition: 'width 0.5s ease' }} />
          </div>

          {/* Contador */}
          <span style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {limiteMsgs === -1 ? `${usadoMsgs} msgs IA` : `${usadoMsgs} / ${limiteMsgs} msgs`}
          </span>

          {/* Mejorar link */}
          {planKey !== 'enterprise' && !isMobile && (
            <button
              onClick={() => navigate('/dashboard/suscripcion')}
              style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Mejorar →
            </button>
          )}
        </div>

        {/* Fila 3: selector de período */}
        <div style={{ display: 'flex', gap: 5 }}>
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              style={{
                padding: isMobile ? '4px 11px' : '5px 13px',
                borderRadius: 20, border: periodo === p.key ? 'none' : `1px solid ${t.border}`,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: periodo === p.key ? t.accent   : t.surfaceHover,
                color:      periodo === p.key ? '#fff'     : t.textMuted,
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* ── BANNER CATÁLOGO — siempre visible ─────────────────────────── */}
        {stats && (stats.plan_catalogo ? (() => {
          const catalogoUrl = stats.catalogo_slug
            ? `${window.location.origin}/tienda/${stats.catalogo_slug}`
            : null
          return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderRadius: 12, marginBottom: gap,
            background: t.accentBg, border: `1px solid ${t.accent}33`,
          }}>
            <span style={{ fontSize: 18 }}>🛍️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.accentText, marginBottom: 2 }}>Tu tienda web está activa</div>
              <div style={{ fontSize: 11, color: t.accentText, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {catalogoUrl || 'Ve a Configuración para activar tu catálogo'}
              </div>
            </div>
            {catalogoUrl && <>
              <button
                onClick={() => navigator.clipboard.writeText(catalogoUrl)}
                style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${t.accent}44`, background: 'transparent', fontSize: 11, fontWeight: 600, color: t.accentText, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Copiar
              </button>
              <a href={catalogoUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '6px 10px', borderRadius: 7, background: t.accent, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Ver →
              </a>
            </>}
          </div>
          )
        })() :
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderRadius: 12, marginBottom: gap,
            background: t.surfaceHover, border: `1px dashed ${t.border}`,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div style={{ flex: 1, fontSize: 12, color: t.textMuted }}>
              <span style={{ fontWeight: 700, color: t.textSec }}>Catálogo web </span>
              disponible en Plan Pro — tus clientes verán tus productos y pedirán por WhatsApp.
            </div>
            <a href="/dashboard/suscripcion"
              style={{ padding: '6px 12px', borderRadius: 7, background: t.accent, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Mejorar →
            </a>
          </div>
        )}

        {/* ── MÉTRICAS — fila 1 ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: cols4, gap, marginBottom: gap }}>
          <MetricCard
            label="Ventas"
            value={`Q${ventas.toFixed(0)}`}
            icon="ventas" iconColor={t.green} iconBg={t.greenBg}
            sub={{ label: 'periodo', color: t.green, bg: t.greenBg }}
            t={t}
          />
          <MetricCard
            label="Pedidos"
            value={pedidosCnt}
            icon="pedidos" iconColor={t.blue} iconBg={t.blueBg}
            sub={pedidosCnt > 0 ? { label: `${pedidosCnt} nuevos`, color: t.blue, bg: t.blueBg } : undefined}
            onClick={() => navigate('/dashboard/pedidos')}
            t={t}
          />
          <MetricCard
            label="Pagos pendientes"
            value={pagosPend}
            icon="pagos" iconColor={t.yellow} iconBg={t.yellowBg}
            sub={pagosPend > 0 ? { label: 'por revisar', color: t.yellow, bg: t.yellowBg } : undefined}
            onClick={() => navigate('/dashboard/pagos')}
            t={t}
          />
          <MetricCard
            label="Clientes"
            value={clientesCnt}
            icon="clientes" iconColor={t.purple} iconBg={t.purpleBg}
            sub={clientesNew > 0 ? { label: `+${clientesNew} hoy`, color: t.purple, bg: t.purpleBg } : undefined}
            onClick={() => navigate('/dashboard/clientes')}
            t={t}
          />
        </div>

        {/* ── MÉTRICAS — fila 2 ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: cols4, gap, marginBottom: isMobile ? 12 : 14 }}>
          <MetricCard
            label="Ganancia neta"
            value={`Q${ganancia.toFixed(0)}`}
            icon="ventas" iconColor={t.accent} iconBg={t.accentBg}
            t={t}
          />
          <MetricCard
            label="Margen"
            value={`${margen}%`}
            icon="margen" iconColor={margenColor} iconBg={`${margenColor}18`}
            sub={{ label: margen >= 30 ? 'saludable' : margen >= 15 ? 'regular' : 'bajo', color: margenColor, bg: `${margenColor}18` }}
            t={t}
          />
          <MetricCard
            label="Clientes nuevos"
            value={clientesNew}
            icon="clientes" iconColor={t.orange} iconBg={t.orangeBg}
            t={t}
          />
          <MetricCard
            label="Productos activos"
            value={stats?.productos_activos ?? '—'}
            icon="productos" iconColor={t.textMuted} iconBg={t.surfaceHover}
            onClick={() => navigate('/dashboard/productos')}
            t={t}
          />
        </div>

        {/* ── SECCIONES INFERIORES ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: isMobile ? 10 : 12 }}>

          {/* Pedidos recientes */}
          <SectionCard title="Pedidos recientes" linkLabel="Ver todos" onLink={() => navigate('/dashboard/pedidos')} t={t}>
            {pedidos.length === 0
              ? <div style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', padding: '22px 0' }}>Sin pedidos aún</div>
              : pedidos.map(p => (
                  <PedidoRow key={p.id} p={p} t={t} onClick={() => navigate('/dashboard/pedidos')} />
                ))
            }
          </SectionCard>

          {/* Comprobantes pendientes */}
          <SectionCard title="Comprobantes pendientes" linkLabel="Revisar" onLink={() => navigate('/dashboard/pagos')} t={t}>
            {pagos.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: t.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d={ICONS.pagos} size={17} color={t.green} />
                </div>
                <span style={{ fontSize: 12, color: t.textMuted }}>Todo al día ✓</span>
              </div>
            ) : pagos.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${t.borderLight}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: t.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico d={ICONS.pagos} size={15} color={t.yellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.cliente}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{p.pedido_codigo} · Q{p.monto}</div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/pagos')}
                  style={{ background: t.accentBg, color: t.accentText, border: 'none', padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                >
                  Revisar
                </button>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
