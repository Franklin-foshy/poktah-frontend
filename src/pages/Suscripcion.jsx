import { useState, useEffect } from 'react'
import { getSuscripcionInfo, solicitarUpgrade, getCuentaBancaria } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

const FEATURES = {
  basico:     ['500 mensajes IA/mes', '20 productos', '1 usuario', 'Agente de ventas'],
  pro:        ['3,000 mensajes IA/mes', '100 productos', '3 usuarios', 'Agente de ventas', 'Seguimiento post-venta', 'Prompt personalizado'],
  enterprise: ['Mensajes ilimitados', 'Productos ilimitados', 'Usuarios ilimitados', 'Agente de ventas', 'Seguimiento post-venta', 'Prompt personalizado', 'Soporte prioritario'],
}

export default function Suscripcion() {
  const isMobile = useIsMobile()
  const { t }    = useTheme()
  const [info,          setInfo]         = useState(null)
  const [cargando,      setCargando]     = useState(true)
  const [planSel,       setPlanSel]      = useState('pro')
  const [periodo,       setPeriodo]      = useState('mensual')
  const [referencia,    setReferencia]   = useState('')
  const [enviando,      setEnviando]     = useState(false)
  const [exito,         setExito]        = useState(null)
  const [error,         setError]        = useState('')
  const [cuentaBancaria, setCuentaBancaria] = useState(null)

  useEffect(() => {
    getSuscripcionInfo()
      .then(r => setInfo(r.data))
      .catch(console.error)
      .finally(() => setCargando(false))
    getCuentaBancaria()
      .then(r => setCuentaBancaria(r.data))
      .catch(() => {})
  }, [])

  const PLAN_CFG = {
    basico:     { color: t.textMuted,   bg: t.surfaceHover, nombre: 'Básico' },
    pro:        { color: t.accentText,  bg: t.accentBg,     nombre: 'Pro' },
    enterprise: { color: t.yellow,      bg: t.yellowBg,     nombre: 'Enterprise' },
  }

  const planActual = info?.plan || 'basico'
  const precioKey  = `${planSel}_${periodo}`
  const precio     = info?.precios?.[precioKey] ?? 0

  const handleSolicitar = async () => {
    if (!referencia.trim()) {
      setError('Ingresá el número de transferencia o referencia del pago.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const r = await solicitarUpgrade(planSel, periodo, referencia.trim())
      setExito(r.data)
      setReferencia('')
    } catch (e) {
      setError('No se pudo registrar la solicitud. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: t.textMuted, fontSize: 13, fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      Cargando...
    </div>
  )

  const cfg = PLAN_CFG[planActual] || PLAN_CFG.basico

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader title="Suscripción" subtitle="Gestioná tu plan y pagos" />

      <div style={{ padding: isMobile ? 14 : 24, maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Plan actual */}
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
          padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          boxShadow: t.shadow,
        }}>
          <div style={{
            padding: '6px 16px', borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            fontSize: 13, fontWeight: 700,
          }}>
            {cfg.nombre}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Plan actual</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
              {info?.suscripcion_hasta
                ? `Vence el ${info.suscripcion_hasta}`
                : 'Sin fecha de vencimiento'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: t.textMuted }}>Mensajes este mes</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>
              {info?.mensajes_mes ?? 0}
              {info?.limite_msgs !== -1 && (
                <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 400 }}>
                  {' '}/ {info?.limite_msgs}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pagos pendientes */}
        {info?.pagos_pendientes?.length > 0 && (
          <div style={{
            background: t.yellowBg, border: `1px solid ${t.yellow}44`,
            borderRadius: 12, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.yellow, marginBottom: 8 }}>
              Pagos en revisión
            </div>
            {info.pagos_pendientes.map(p => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: `1px solid ${t.yellow}33`,
                fontSize: 12, color: t.yellow,
              }}>
                <span>Plan {p.plan.toUpperCase()} {p.periodo} — Q{p.monto}</span>
                <span style={{ opacity: 0.8 }}>Esperando confirmación · {p.created_at}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: t.yellow, marginTop: 8, opacity: 0.8 }}>
              El administrador confirmará el pago en un plazo de 24h hábiles.
            </div>
          </div>
        )}

        {/* Éxito */}
        {exito && (
          <div style={{
            background: t.greenBg, border: `1px solid ${t.green}44`,
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.greenDark, marginBottom: 4 }}>
              ✓ Solicitud registrada correctamente
            </div>
            <div style={{ fontSize: 12, color: t.greenDark, opacity: 0.85 }}>
              El administrador revisará tu pago (ID #{exito.pago_id}) y activará tu plan en breve.
            </div>
          </div>
        )}

        {/* Comparación de planes */}
        {planActual !== 'enterprise' && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '20px 22px', boxShadow: t.shadow }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 16 }}>
              Actualizar plan
            </div>

            {/* Selector de plan */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {['pro', 'enterprise'].map(p => {
                const c      = PLAN_CFG[p]
                const activo = planSel === p
                return (
                  <div
                    key={p}
                    onClick={() => setPlanSel(p)}
                    style={{
                      border: `2px solid ${activo ? c.color : t.border}`,
                      background: activo ? c.bg : t.bg,
                      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.nombre}</span>
                      {planActual === p && (
                        <span style={{ fontSize: 10, background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                          Actual
                        </span>
                      )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: t.textSec, lineHeight: 1.8 }}>
                      {FEATURES[p].map(f => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Toggle mensual/anual */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: t.bg, borderRadius: 10, padding: 4, width: 'fit-content', border: `1px solid ${t.border}` }}>
              {[
                { key: 'mensual', label: 'Mensual' },
                { key: 'anual',   label: 'Anual (−17%)' },
              ].map(tp => (
                <button
                  key={tp.key}
                  onClick={() => setPeriodo(tp.key)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: periodo === tp.key ? t.surface : 'transparent',
                    color:      periodo === tp.key ? t.text : t.textMuted,
                    fontSize: 12, fontWeight: periodo === tp.key ? 700 : 400,
                    boxShadow: periodo === tp.key ? t.shadow : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Precio + datos */}
            <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, color: t.textMuted }}>Total a transferir</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: t.text }}>
                    Q{precio}
                    <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 400 }}>{' '}/{periodo}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: t.textSec, marginBottom: 8 }}>
                Datos de transferencia
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Banco',   value: cuentaBancaria?.banco   || '—' },
                  { label: 'Cuenta',  value: cuentaBancaria?.cuenta  || '—' },
                  { label: 'Tipo',    value: cuentaBancaria?.tipo    || '—' },
                  { label: 'Titular', value: cuentaBancaria?.titular || '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: t.textMuted }}>{r.label}</span>
                    <span style={{ fontWeight: 700, color: t.text }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referencia + botón */}
            <div>
              <div style={{ fontSize: 12, color: t.textSec, fontWeight: 700, marginBottom: 6 }}>
                Número de referencia / comprobante
              </div>
              <input
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ej: 0000123456"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px', border: `1.5px solid ${t.border}`,
                  borderRadius: 10, fontSize: 13, color: t.text,
                  outline: 'none', marginBottom: 10, background: t.bg, fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border}
              />
              {error && (
                <div style={{ fontSize: 12, color: t.red, marginBottom: 8 }}>{error}</div>
              )}
              <button
                onClick={handleSolicitar}
                disabled={enviando}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: enviando ? t.border : t.accent,
                  color: enviando ? t.textMuted : '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {enviando ? 'Enviando...' : `Solicitar upgrade a ${PLAN_CFG[planSel].nombre}`}
              </button>
              <div style={{ fontSize: 11, color: t.textMuted, textAlign: 'center', marginTop: 8 }}>
                Tu plan se activará al confirmar el pago. Recibirás una notificación.
              </div>
            </div>
          </div>
        )}

        {/* Ya está en enterprise */}
        {planActual === 'enterprise' && (
          <div style={{
            background: t.yellowBg, border: `1px solid ${t.yellow}44`,
            borderRadius: 14, padding: '20px 22px', textAlign: 'center',
            boxShadow: t.shadow,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👑</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.yellow }}>
              Estás en el plan Enterprise
            </div>
            <div style={{ fontSize: 12, color: t.yellow, marginTop: 4, opacity: 0.85 }}>
              Ya tenés acceso a todas las funcionalidades disponibles.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
