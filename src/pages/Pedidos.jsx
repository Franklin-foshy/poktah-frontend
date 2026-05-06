import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPedidos, cambiarEstadoPedido, getDetallePedido, actualizarGuia } from '../api/client'
import PageHeader from '../components/PageHeader'
import ProtectedImage from '../components/ProtectedImage'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'
import { useSSE } from '../hooks/useSSE'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS = ['todos','nuevo','esperando_pago','pago_recibido','confirmado','enviado','entregado','cancelado']

const ESTADOS_SIGUIENTE = {
  nuevo:          ['esperando_pago','confirmado','cancelado'],
  esperando_pago: ['pago_recibido','cancelado'],
  pago_recibido:  ['confirmado','cancelado'],
  confirmado:     ['enviado','cancelado'],
  enviado:        ['entregado'],
  entregado:      [],
  cancelado:      [],
}

const ESTADOS_CON_NOTIF = new Set(['confirmado', 'enviado', 'entregado', 'cancelado'])

const MENSAJES_PREVIEW = {
  confirmado: (cod, tot) => `✅ ¡Hola! Tu pedido *${cod}* fue *confirmado*.\nTotal: Q${tot}\nEn breve te contactamos para coordinar la entrega. 🙏`,
  enviado:    (cod, tot) => `🚚 Tu pedido *${cod}* ya está *en camino*.\nTotal: Q${tot}\nTe avisamos cuando llegue a tu dirección.`,
  entregado:  (cod)      => `🎉 Tu pedido *${cod}* fue *entregado* con éxito.\n¡Gracias por tu compra! Si tenés cualquier consulta, aquí estamos. 😊`,
  cancelado:  (cod)      => `❌ Tu pedido *${cod}* fue *cancelado*.\nSi tenés alguna pregunta o querés hacer un nuevo pedido, escribinos.`,
}

function getAccionColors(t) {
  return {
    esperando_pago: { bg: t.yellowBg,    text: t.yellow   },
    pago_recibido:  { bg: t.orangeBg,    text: t.orange   },
    confirmado:     { bg: t.greenBg,     text: t.greenDark },
    enviado:        { bg: t.blueBg,      text: t.blue     },
    entregado:      { bg: t.surfaceHover,text: t.textSec  },
    cancelado:      { bg: t.redBg,       text: t.red      },
  }
}

function getEstadoColors(t) {
  return {
    nuevo:          { bg: t.blueBg,      text: t.blue     },
    esperando_pago: { bg: t.yellowBg,    text: t.yellow   },
    pago_recibido:  { bg: t.orangeBg,    text: t.orange   },
    confirmado:     { bg: t.greenBg,     text: t.greenDark },
    enviado:        { bg: t.accentBg,    text: t.accentText},
    entregado:      { bg: t.surfaceHover,text: t.textSec  },
    cancelado:      { bg: t.redBg,       text: t.red      },
  }
}

// ─── ConfirmPanel ─────────────────────────────────────────────────────────────

function ConfirmPanel({ pending, notificar, mensajeNotif, onToggle, onChangeMensaje, onConfirm, onCancel, cambiando }) {
  const { t } = useTheme()
  if (!pending) return null
  const { estado, pedidoId } = pending
  const ac = getAccionColors(t)[estado] || { bg: t.accentBg, text: t.accentText }

  return (
    <div style={{ marginTop: 14, background: t.bg, borderRadius: 12, padding: 14, border: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
        Cambiar a{' '}
        <span style={{ padding: '2px 8px', borderRadius: 20, background: ac.bg, color: ac.text }}>
          {estado.replace(/_/g,' ')}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Mensaje al cliente
        </span>
        <span style={{ fontSize: 10, color: t.textMuted }}>editable</span>
      </div>
      <textarea
        value={mensajeNotif}
        onChange={e => onChangeMensaje(e.target.value)}
        rows={4}
        style={{
          width: '100%', fontSize: 12, background: t.surface, padding: '10px 12px', borderRadius: 9,
          color: t.textSec, border: `1px solid ${t.border}`, lineHeight: 1.6, marginBottom: 12,
          resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: t.text }}>Notificar al cliente por WhatsApp</span>
        <button
          onClick={onToggle}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: notificar ? t.accent : t.border,
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 3,
            left: notificar ? 22 : 2,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '9px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={cambiando === pedidoId}
          style={{ flex: 2, padding: '9px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', background: t.accent, color: '#fff', cursor: 'pointer', opacity: cambiando === pedidoId ? 0.7 : 1, fontFamily: 'inherit' }}
        >
          {cambiando === pedidoId ? 'Guardando...' : `Confirmar${notificar ? ' y notificar' : ''}`}
        </button>
      </div>
    </div>
  )
}

// ─── GuiaEnvio ────────────────────────────────────────────────────────────────

function GuiaEnvio({ pedidoId, codigoGuia }) {
  const { t }      = useTheme()
  const [editando, setEditando] = useState(false)
  const [valor,    setValor]    = useState(codigoGuia || '')
  const [saving,   setSaving]   = useState(false)

  const guardar = async () => {
    setSaving(true)
    try {
      await actualizarGuia(pedidoId, valor.trim())
      setEditando(false)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (editando) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={valor}
          onChange={e => setValor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && guardar()}
          placeholder="Ej: GU-987654321"
          autoFocus
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${t.accent}`, fontSize: 12, outline: 'none', background: t.bg, color: t.text, fontFamily: 'inherit' }}
        />
        <button onClick={guardar} disabled={saving}
          style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: t.accent, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {saving ? '...' : 'Guardar'}
        </button>
        <button onClick={() => { setEditando(false); setValor(codigoGuia || '') }}
          style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {valor
        ? <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'monospace', letterSpacing: '0.02em' }}>{valor}</span>
        : <span style={{ fontSize: 12, color: t.textMuted }}>Sin código de guía</span>
      }
      <button onClick={() => setEditando(true)}
        style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
        {valor ? 'Editar' : '+ Agregar'}
      </button>
    </div>
  )
}

// ─── Section / Row helpers ────────────────────────────────────────────────────

function Section({ title, children, t }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, t }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 12, color: t.textMuted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{value}</span>
    </div>
  )
}

// ─── DetalleModal ─────────────────────────────────────────────────────────────

function DetalleModal({
  detalle, loadDet, isMobile,
  pending, notificar, mensajeNotif,
  cambiando,
  onClose, onToggleNotif, onChangeMensaje, onIniciarCambio, onConfirmarCambio, onCancelPending,
  onIrPagos,
}) {
  const { t } = useTheme()
  const ACCION_COLORS = getAccionColors(t)
  const ESTADO_COLORS = getEstadoColors(t)

  if (!detalle && !loadDet) return null

  const pill = {
    display: 'inline-flex', padding: '3px 8px',
    borderRadius: 20, fontSize: 10, fontWeight: 600, width: 'fit-content',
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex',
    alignItems:     isMobile ? 'flex-end'  : 'center',
    justifyContent: 'center',
    padding:        isMobile ? 0 : 16,
  }
  const sheetStyle = isMobile
    ? { background: t.surface, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${t.border}` }
    : { background: t.surface, borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: t.shadowLg, border: `1px solid ${t.border}` }

  const isPendingThisOrder = pending && detalle && pending.pedidoId === detalle.id

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '12px auto 4px', flexShrink: 0 }} />}

        {loadDet && <div style={{ padding: 40, textAlign: 'center', color: t.textMuted }}>Cargando...</div>}

        {!loadDet && detalle && (
          <>
            {/* Header */}
            <div style={{ padding: isMobile ? '10px 20px 14px' : '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{detalle.codigo}</div>
                <div style={{ fontSize: 11, color: t.textMuted }}>{detalle.created_at}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ ...pill, background: ESTADO_COLORS[detalle.estado]?.bg, color: ESTADO_COLORS[detalle.estado]?.text }}>
                  {detalle.estado.replace(/_/g,' ')}
                </span>
                <button onClick={onClose} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: t.textMuted }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* Cliente */}
              <Section title="Cliente" t={t}>
                <Row label="Nombre"    value={detalle.cliente.nombre} t={t} />
                <Row label="WhatsApp"  value={`+${detalle.cliente.whatsapp}`} t={t} />
                <Row label="Dirección" value={detalle.cliente.direccion} t={t} />
                <a
                  href={`https://wa.me/${detalle.cliente.whatsapp}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
                >
                  💬 Abrir chat en WhatsApp
                </a>
              </Section>

              {/* Productos */}
              <Section title="Productos del pedido" t={t}>
                {detalle.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9, background: t.bg, border: `1px solid ${t.border}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.imagen_url
                        ? <ProtectedImage serverPath={item.imagen_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback={<span style={{ fontSize: 18 }}>📦</span>} />
                        : <span style={{ fontSize: 18 }}>📦</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.producto}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>
                        {[item.variante_talla, item.variante_color].filter(Boolean).join(' · ')}
                        {item.sku && ` · SKU: ${item.sku}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Q{item.subtotal.toFixed(0)}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{item.cantidad} × Q{item.precio_unitario.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: t.accent }}>Q{detalle.total.toFixed(0)}</span>
                </div>
              </Section>

              {/* Pagos */}
              {detalle.pagos.length > 0 && (
                <Section title="Comprobantes de pago" t={t}>
                  {detalle.pagos.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{p.metodo.replace(/_/g,' ')} · Q{p.monto}</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>{p.created_at}</div>
                      </div>
                      <span style={{ ...pill, background: p.estado === 'confirmado' ? t.greenBg : t.yellowBg, color: p.estado === 'confirmado' ? t.greenDark : t.yellow }}>
                        {p.estado.replace(/_/g,' ')}
                      </span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Notas */}
              {detalle.notas && (
                <Section title="Notas" t={t}>
                  <p style={{ fontSize: 12, color: t.textSec, lineHeight: 1.6 }}>{detalle.notas}</p>
                </Section>
              )}

              {/* Código de guía */}
              {detalle.tiene_envio && (
                <Section title="Código de guía de envío" t={t}>
                  <GuiaEnvio pedidoId={detalle.id} codigoGuia={detalle.codigo_guia} />
                </Section>
              )}

              {/* Ir a pagos */}
              {(detalle.estado === 'pago_recibido' || detalle.estado === 'esperando_pago') && (
                <Section title="Pago" t={t}>
                  <button
                    onClick={onIrPagos}
                    style={{ padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${t.yellow}44`, background: t.yellowBg, color: t.yellow, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
                  >
                    🧾 Verificar comprobante →
                  </button>
                </Section>
              )}

              {/* Cambiar estado */}
              {(ESTADOS_SIGUIENTE[detalle.estado]?.length > 0) && (
                <Section title="Cambiar estado" t={t}>
                  {!isPendingThisOrder && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ESTADOS_SIGUIENTE[detalle.estado].map(s => {
                        const ac = ACCION_COLORS[s] || { bg: t.accentBg, text: t.accentText }
                        return (
                          <button
                            key={s}
                            disabled={cambiando === detalle.id}
                            onClick={() => onIniciarCambio(detalle.id, s, detalle.codigo, detalle.total)}
                            style={{ padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${ac.text}33`, background: ac.bg, color: ac.text, cursor: 'pointer', opacity: cambiando === detalle.id ? 0.6 : 1, fontFamily: 'inherit' }}
                          >
                            {s.replace(/_/g,' ')}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {isPendingThisOrder && (
                    <ConfirmPanel
                      pending={pending}
                      notificar={notificar}
                      mensajeNotif={mensajeNotif}
                      onToggle={onToggleNotif}
                      onChangeMensaje={onChangeMensaje}
                      onConfirm={onConfirmarCambio}
                      onCancel={onCancelPending}
                      cambiando={cambiando}
                    />
                  )}
                </Section>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Paginación ───────────────────────────────────────────────────────────────

function Pagination({ page, pages, total, onPrev, onNext, t }) {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 0' }}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: page <= 1 ? t.textMuted : t.textSec, cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}
      >
        ← Anterior
      </button>
      <span style={{ fontSize: 12, color: t.textMuted }}>Página {page} de {pages} · {total} en total</span>
      <button
        onClick={onNext}
        disabled={page >= pages}
        style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: page >= pages ? t.textMuted : t.textSec, cursor: page >= pages ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}
      >
        Siguiente →
      </button>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Pedidos() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { t }     = useTheme()

  const ACCION_COLORS = getAccionColors(t)
  const ESTADO_COLORS = getEstadoColors(t)

  const pill = {
    display: 'inline-flex', padding: '3px 8px',
    borderRadius: 20, fontSize: 10, fontWeight: 600, width: 'fit-content',
  }

  const [pedidos,      setPedidos]      = useState([])
  const [meta,         setMeta]         = useState({ total: 0, page: 1, pages: 1 })
  const [page,         setPage]         = useState(1)
  const [filtro,       setFiltro]       = useState('todos')
  const [busqueda,     setBusqueda]     = useState('')
  const [loading,      setLoad]         = useState(true)
  const [cambiando,    setCamb]         = useState(null)
  const [detalle,      setDetalle]      = useState(null)
  const [loadDet,      setLoadDet]      = useState(false)
  const [pending,      setPending]      = useState(null)
  const [notificar,    setNotificar]    = useState(true)
  const [mensajeNotif, setMensajeNotif] = useState('')

  useEffect(() => { cargar(filtro, page) }, [filtro, page]) // eslint-disable-line
  useSSE('pedido', () => cargar(filtro, page))

  const cargar = async (f = filtro, p = page) => {
    setLoad(true)
    try {
      const { data } = await getPedidos(f === 'todos' ? null : f, p)
      setPedidos(data.items)
      setMeta({ total: data.total, page: data.page, pages: data.pages })
    } catch(e) { console.error(e) }
    finally { setLoad(false) }
  }

  const cambiarFiltro = (f) => { setFiltro(f); setPage(1) }

  const cambiarEstado = async (id, estado, notif = false, mensaje = null) => {
    setCamb(id)
    try {
      await cambiarEstadoPedido(id, estado, notif, mensaje)
      const { data } = await getPedidos(filtro === 'todos' ? null : filtro, page)
      setPedidos(data.items)
      setMeta({ total: data.total, page: data.page, pages: data.pages })
      if (detalle?.id === id) {
        const { data: det } = await getDetallePedido(id)
        setDetalle(det)
      }
    } catch(e) { console.error(e) }
    finally { setCamb(null) }
  }

  const iniciarCambio = (pedidoId, nuevoEstado, codigo, total) => {
    if (ESTADOS_CON_NOTIF.has(nuevoEstado)) {
      const textoInicial = MENSAJES_PREVIEW[nuevoEstado]?.(codigo, Math.round(total)) || ''
      setPending({ pedidoId, estado: nuevoEstado, codigo, total })
      setNotificar(true)
      setMensajeNotif(textoInicial)
    } else {
      cambiarEstado(pedidoId, nuevoEstado, false)
    }
  }

  const confirmarCambio = () => {
    if (!pending) return
    cambiarEstado(pending.pedidoId, pending.estado, notificar, notificar ? mensajeNotif : null)
    setPending(null)
  }

  const abrirDetalle = async (id) => {
    setPending(null)
    setLoadDet(true)
    try {
      const { data } = await getDetallePedido(id)
      setDetalle(data)
    } catch(e) { console.error(e) }
    finally { setLoadDet(false) }
  }

  const cerrarDetalle = () => { setDetalle(null); setPending(null) }

  const filtrados = pedidos.filter(p =>
    p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.producto.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader title="Pedidos" subtitle={`${meta.total} pedidos en total`} />

      <DetalleModal
        detalle={detalle} loadDet={loadDet} isMobile={isMobile}
        pending={pending} notificar={notificar} mensajeNotif={mensajeNotif}
        cambiando={cambiando}
        onClose={cerrarDetalle}
        onToggleNotif={() => setNotificar(n => !n)}
        onChangeMensaje={setMensajeNotif}
        onIniciarCambio={iniciarCambio}
        onConfirmarCambio={confirmarCambio}
        onCancelPending={() => setPending(null)}
        onIrPagos={() => { cerrarDetalle(); navigate('/dashboard/pagos') }}
      />

      <div style={{ padding: isMobile ? '14px 16px' : 20 }}>

        {/* Filtros */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: isMobile ? 12 : 14, marginBottom: 14, boxShadow: t.shadow }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: isMobile ? 0 : 200, padding: '8px 12px', border: `1.5px solid ${t.border}`, borderRadius: 9, fontSize: 13, color: t.text, outline: 'none', background: t.bg, boxSizing: 'border-box', fontFamily: 'inherit' }}
              placeholder="Buscar cliente, código o producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ESTADOS.map(e => (
                <button key={e} onClick={() => cambiarFiltro(e)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: filtro === e ? 700 : 400,
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                    background: filtro === e ? t.accent : t.surfaceHover,
                    color:      filtro === e ? '#fff'   : t.textMuted,
                  }}>
                  {e === 'todos' ? 'Todos' : e.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <div style={{ padding: 24, textAlign: 'center', color: t.textMuted, fontSize: 13 }}>Cargando...</div>}
        {!loading && filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: t.textMuted, fontSize: 13 }}>Sin pedidos</div>}

        {/* ── MOBILE ── */}
        {isMobile && !loading && filtrados.map(p => {
          const ec  = ESTADO_COLORS[p.estado] || ESTADO_COLORS.nuevo
          const sig = ESTADOS_SIGUIENTE[p.estado] || []
          return (
            <div key={p.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: t.shadow }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: t.accentBg, color: t.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                  {p.cliente?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.cliente}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{p.codigo} · {p.created_at}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Q{p.total}</div>
                      <span style={{ ...pill, background: ec.bg, color: ec.text }}>{p.estado.replace(/_/g,' ')}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSec, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.producto}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => abrirDetalle(p.id)}
                      style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 11, fontWeight: 600, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Ver detalle
                    </button>
                    {sig.slice(0,1).map(s => {
                      const ac = ACCION_COLORS[s] || { bg: t.accentBg, text: t.accentText }
                      return (
                        <button key={s} disabled={cambiando === p.id} onClick={() => abrirDetalle(p.id)}
                          style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 11, fontWeight: 600, border: `1px solid ${ac.text}33`, background: ac.bg, color: ac.text, cursor: 'pointer', opacity: cambiando === p.id ? 0.6 : 1, fontFamily: 'inherit' }}>
                          {s.replace(/_/g,' ')} →
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <Pagination
          page={meta.page} pages={meta.pages} total={meta.total}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(meta.pages, p + 1))}
          t={t}
        />

        {/* ── DESKTOP ── */}
        {!isMobile && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: t.shadow }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1.5fr', padding: '10px 16px', borderBottom: `1px solid ${t.border}`, background: t.bg }}>
              {['Cliente','Producto','Total','Estado','Fecha','Acción'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {!loading && filtrados.map(p => {
              const ec  = ESTADO_COLORS[p.estado] || ESTADO_COLORS.nuevo
              const sig = ESTADOS_SIGUIENTE[p.estado] || []
              return (
                <div key={p.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1.5fr', padding: '12px 16px', borderBottom: `1px solid ${t.border}`, alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = t.surface}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => abrirDetalle(p.id)}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: t.accentBg, color: t.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {p.cliente?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{p.cliente}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{p.codigo}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSec, cursor: 'pointer' }} onClick={() => abrirDetalle(p.id)}>{p.producto}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text, cursor: 'pointer' }} onClick={() => abrirDetalle(p.id)}>Q{p.total}</div>
                  <span style={{ ...pill, background: ec.bg, color: ec.text }}>{p.estado.replace(/_/g,' ')}</span>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{p.created_at}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => abrirDetalle(p.id)}
                      style={{ padding: '4px 8px', borderRadius: 7, fontSize: 10, fontWeight: 600, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Ver detalle
                    </button>
                    {sig.slice(0,1).map(s => {
                      const ac = ACCION_COLORS[s] || { bg: t.accentBg, text: t.accentText }
                      return (
                        <button key={s} disabled={cambiando === p.id} onClick={() => abrirDetalle(p.id)}
                          style={{ padding: '4px 8px', borderRadius: 7, fontSize: 10, fontWeight: 600, border: `1px solid ${ac.text}33`, background: ac.bg, color: ac.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {s.replace(/_/g,' ')} →
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
