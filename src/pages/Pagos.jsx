import { useState, useEffect, useCallback } from 'react'
import { getPagosPendientes, confirmarPago } from '../api/client'
import { useSSE } from '../hooks/useSSE'
import PageHeader from '../components/PageHeader'
import ProtectedImage from '../components/ProtectedImage'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

const METODO_LABEL = {
  transferencia:  'Transferencia',
  contra_entrega: 'Contra entrega',
  tarjeta:        'Tarjeta',
}

export default function Pagos() {
  const isMobile = useIsMobile()
  const { t }    = useTheme()

  const METODO_COLOR = {
    transferencia:  { bg: t.blueBg,   text: t.blue      },
    contra_entrega: { bg: t.greenBg,  text: t.greenDark },
    tarjeta:        { bg: t.purpleBg, text: t.purple    },
  }
  const [pagos,   setPagos]   = useState([])
  const [loading, setLoad]    = useState(true)
  const [accion,  setAccion]  = useState(null)
  const [preview, setPreview] = useState(null)

  const cargar = useCallback(async () => {
    setLoad(true)
    try {
      const { data } = await getPagosPendientes()
      setPagos(data)
    } catch(e) { console.error(e) }
    finally { setLoad(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useSSE('pago', cargar)

  const handleAccion = async (pago_id, tipo, notificar = false) => {
    setAccion(pago_id)
    try {
      await confirmarPago(pago_id, tipo, notificar)
      setPreview(null)
      await cargar()
    } catch(e) {
      console.error(e)
      alert('Error al procesar el pago. Intentá de nuevo.')
    } finally {
      setAccion(null)
    }
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Comprobantes de pago"
        subtitle={`${pagos.length} pendiente${pagos.length !== 1 ? 's' : ''} de revisión`}
      />

      {/* ── MODAL PREVIEW ──────────────────────────────────────────── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center', padding: isMobile ? 0 : 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.surface,
              borderRadius: isMobile ? '20px 20px 0 0' : 16,
              overflow: 'hidden', maxWidth: isMobile ? 430 : 440, width: '100%',
              boxShadow: t.shadowLg, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            }}
          >
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '14px auto 6px', flexShrink: 0 }} />}

            {/* Header */}
            <div style={{
              padding: '14px 18px', borderBottom: `1px solid ${t.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{preview.cliente || 'Sin nombre'}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                  {preview.pedido_codigo} · Q{preview.monto}
                </div>
              </div>
              <button
                onClick={() => setPreview(null)}
                style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: t.textMuted }}
              >✕</button>
            </div>

            {/* Imagen comprobante */}
            <ProtectedImage
              serverPath={preview.comprobante_url}
              alt="comprobante"
              style={{ width: '100%', maxHeight: 360, objectFit: 'contain', background: t.bg, display: 'block' }}
              fallback={
                <div style={{ padding: 48, textAlign: 'center', background: t.bg }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
                  <div style={{ fontSize: 13, color: t.textMuted }}>Sin imagen adjunta</div>
                </div>
              }
            />

            {/* Acciones */}
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={accion === preview.id}
                  onClick={() => handleAccion(preview.id, 'confirmar', false)}
                  style={{
                    flex: 1, background: t.accent, color: '#fff', border: 'none',
                    padding: '11px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: accion === preview.id ? 'not-allowed' : 'pointer',
                    opacity: accion === preview.id ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {accion === preview.id ? 'Procesando...' : '✓ Confirmar'}
                </button>
                <button
                  disabled={accion === preview.id}
                  onClick={() => handleAccion(preview.id, 'confirmar', true)}
                  style={{
                    flex: 1, background: t.blue, color: '#fff', border: 'none',
                    padding: '11px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: accion === preview.id ? 'not-allowed' : 'pointer',
                    opacity: accion === preview.id ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ✓ Confirmar + Notificar
                </button>
              </div>
              <button
                disabled={accion === preview.id}
                onClick={() => {
                  if (!window.confirm('¿Rechazar este comprobante?')) return
                  handleAccion(preview.id, 'rechazar', true)
                }}
                style={{
                  width: '100%', background: t.redBg, color: t.red,
                  border: `1px solid ${t.red}44`, padding: '9px',
                  borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: accion === preview.id ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✕ Rechazar y notificar al cliente
              </button>
              <div style={{ fontSize: 10, color: t.textMuted, textAlign: 'center' }}>
                "Confirmar" guarda el pago. "Confirmar + Notificar" avisa al cliente por WhatsApp.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENIDO ──────────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? 14 : 22 }}>

        {loading && (
          <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: 48 }}>Cargando...</div>
        )}

        {!loading && pagos.length === 0 && (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
            padding: '56px 24px', textAlign: 'center', boxShadow: t.shadow,
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>Todo al día</div>
            <div style={{ fontSize: 13, color: t.textMuted }}>No hay comprobantes pendientes de revisión</div>
          </div>
        )}

        {/* Grid comprobantes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px,1fr))',
          gap: isMobile ? 12 : 14,
        }}>
          {pagos.map(p => {
            const mc = METODO_COLOR[p.metodo] || { bg: t.accentBg, text: t.accent }
            return (
              <div
                key={p.id}
                style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 16, overflow: 'hidden', boxShadow: t.shadow,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = t.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = t.shadow}
              >
                {/* Miniatura */}
                <div
                  onClick={() => setPreview(p)}
                  style={{
                    height: 160, background: t.bg, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', borderBottom: `1px solid ${t.border}`, overflow: 'hidden',
                  }}
                >
                  <ProtectedImage
                    serverPath={p.comprobante_url}
                    alt="comprobante"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>Sin imagen</div>
                      </div>
                    }
                  />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.15s',
                    fontSize: 12, color: '#fff', fontWeight: 700, gap: 6,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    🔍 Ver comprobante
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.cliente || 'Sin nombre'}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{p.pedido_codigo} · {p.created_at}</div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Q{p.monto}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: mc.bg, color: mc.text,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {METODO_LABEL[p.metodo] || p.metodo}
                    </span>
                  </div>

                  <button
                    onClick={() => setPreview(p)}
                    style={{
                      width: '100%', background: t.accentBg, color: t.accentText,
                      border: `1px solid ${t.accent}33`, padding: '9px',
                      borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Revisar comprobante →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
