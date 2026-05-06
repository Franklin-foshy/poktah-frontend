import { useState, useEffect } from 'react'
import {
  getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion,
  previewMasivo, enviarMasivo, getProductos,
} from '../api/client'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'

const TIPO_LABELS = {
  porcentaje: 'Descuento %',
  monto_fijo: 'Monto fijo (Q)',
  '2x1':      '2×1',
}

const CATEGORIA_LABELS = {
  todos:      'Todos los clientes',
  interesado: 'Interesados (contactaron pero no compraron)',
  prospecto:  'Prospectos (consultaron productos)',
  comprador:  'Compradores (1 pedido)',
  recurrente: 'Recurrentes (2+ pedidos)',
}

const PROMO_INIT = {
  nombre: '', descripcion: '', tipo: 'porcentaje',
  valor: '', fecha_inicio: '', fecha_fin: '',
  producto_ids: [],
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  const { t } = useTheme()
  const mob = window.innerWidth < 768
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: mob ? 'flex-end' : 'center', justifyContent: 'center', padding: mob ? 0 : 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.surface, borderRadius: mob ? '20px 20px 0 0' : 16, width: '100%', maxWidth: mob ? 430 : 520, boxShadow: t.shadowLg, border: `1px solid ${t.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
        {mob && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '12px auto 4px' }} />}
        <div style={{ padding: mob ? '12px 20px 14px' : '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{title}</span>
          <button onClick={onClose} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: t.textMuted }}>✕</button>
        </div>
        <div style={{ padding: mob ? 16 : 20 }}>{children}</div>
      </div>
    </div>
  )
}

function FormRow({ label, children }) {
  const { t } = useTheme()
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: t.textSec, display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

export default function Promociones() {
  const { t }     = useTheme()
  const [promos,    setPromos]    = useState([])
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(PROMO_INIT)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)

  const [masivo,   setMasivo]   = useState({ mensaje: '', categoria: 'todos' })
  const [preview,  setPreview]  = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado,  setEnviado]  = useState(false)

  const inputStyle = {
    width: '100%', padding: '8px 11px', border: `1.5px solid ${t.border}`,
    borderRadius: 9, fontSize: 13, color: t.text, background: t.bg,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const textareaStyle = { ...inputStyle, height: 72, resize: 'vertical', display: 'block' }
  const btnPrimary    = { background: t.accent, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
  const btnSecondary  = { background: t.surfaceHover, color: t.textMuted, border: `1px solid ${t.border}`, padding: '7px 12px', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }

  const TIPO_BADGE = {
    porcentaje: { bg: t.blueBg,   color: t.blue },
    monto_fijo: { bg: t.greenBg,  color: t.greenDark },
    '2x1':      { bg: t.orangeBg, color: t.orange },
  }

  useEffect(() => {
    cargar()
    getProductos().then(r => setProductos(r.data)).catch(() => {})
  }, [])

  const cargar = async () => {
    setLoading(true)
    try { const { data } = await getPromociones(); setPromos(data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const abrirCrear = () => { setForm(PROMO_INIT); setEditId(null); setModal('crear') }

  const abrirEditar = (p) => {
    setForm({
      nombre:       p.nombre,
      descripcion:  p.descripcion || '',
      tipo:         p.tipo,
      valor:        String(p.valor),
      fecha_inicio: p.fecha_inicio ? p.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    p.fecha_fin    ? p.fecha_fin.slice(0, 10)    : '',
      producto_ids: p.producto_ids || [],
    })
    setEditId(p.id)
    setModal('editar')
  }

  const toggleProducto = (id) => {
    const ids = form.producto_ids
    setForm({ ...form, producto_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] })
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.valor) return
    setSaving(true)
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        descripcion:  form.descripcion,
        tipo:         form.tipo,
        valor:        parseFloat(form.valor),
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin:    form.fecha_fin    || null,
        producto_ids: form.producto_ids,
      }
      if (modal === 'crear') { await crearPromocion(payload) }
      else { await actualizarPromocion(editId, payload) }
      setModal(null)
      await cargar()
    } catch(e) { alert(e?.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const toggleActiva = async (p) => {
    try { await actualizarPromocion(p.id, { activa: !p.activa }); await cargar() }
    catch(e) { console.error(e) }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta promoción? Esta acción no se puede deshacer.')) return
    try { await eliminarPromocion(id); await cargar() }
    catch(e) { alert('Error al eliminar') }
  }

  const abrirMasivo = () => {
    setMasivo({ mensaje: '', categoria: 'todos' })
    setPreview(null)
    setEnviado(false)
    setModal('masivo')
  }

  const handlePreview = async () => {
    try { const { data } = await previewMasivo(masivo.categoria); setPreview(data.total) }
    catch(e) { console.error(e) }
  }

  const handleEnviar = async () => {
    if (!masivo.mensaje.trim()) return
    if (!window.confirm(`¿Enviar este mensaje a ${preview ?? '?'} clientes? Esta acción no se puede deshacer.`)) return
    setEnviando(true)
    try { await enviarMasivo({ mensaje: masivo.mensaje.trim(), categoria: masivo.categoria }); setEnviado(true) }
    catch(e) { alert(e?.response?.data?.detail || 'Error al enviar') }
    finally { setEnviando(false) }
  }

  const formatValor = (p) => {
    if (p.tipo === 'porcentaje') return `${p.valor}% off`
    if (p.tipo === 'monto_fijo') return `Q${p.valor} off`
    return '2×1'
  }

  const formatFecha = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const estaVigente = (p) => {
    if (!p.activa) return false
    const ok_inicio = !p.fecha_inicio || p.fecha_inicio.slice(0,10) <= hoy
    const ok_fin    = !p.fecha_fin    || p.fecha_fin.slice(0,10)    >= hoy
    return ok_inicio && ok_fin
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Promociones"
        subtitle={`${promos.length} promociones · ${promos.filter(estaVigente).length} vigentes`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={abrirMasivo}
              style={{ background: t.green, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              📤 Envío masivo
            </button>
            <button onClick={abrirCrear}
              style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
              + Nueva promo
            </button>
          </div>
        }
      />

      {/* ── MODAL CREAR / EDITAR ── */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal title={modal === 'crear' ? 'Nueva promoción' : 'Editar promoción'} onClose={() => setModal(null)}>
          <FormRow label="Nombre *">
            <input placeholder="Ej: Promo de verano 20%" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
          </FormRow>

          <FormRow label="Tipo de descuento *">
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TIPO_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setForm({ ...form, tipo: key })}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: form.tipo === key ? `2px solid ${t.accent}` : `1.5px solid ${t.border}`,
                    background: form.tipo === key ? t.accentBg : t.bg,
                    color: form.tipo === key ? t.accentText : t.textMuted,
                    fontFamily: 'inherit',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </FormRow>

          {form.tipo !== '2x1' && (
            <FormRow label={form.tipo === 'porcentaje' ? 'Porcentaje de descuento *' : 'Monto a descontar (Q) *'}>
              <input type="number" placeholder={form.tipo === 'porcentaje' ? '20' : '50'}
                value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} style={inputStyle} />
              {form.tipo === 'porcentaje' && (
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>Ingresá el porcentaje (ej: 20 = 20% de descuento)</div>
              )}
            </FormRow>
          )}

          <FormRow label="Descripción (aparece en WhatsApp)">
            <textarea style={textareaStyle} placeholder="Ej: Aprovechá el 20% de descuento en toda la línea escolar..."
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          </FormRow>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormRow label="Fecha inicio (opcional)">
              <input type="date" value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} style={inputStyle} />
            </FormRow>
            <FormRow label="Fecha fin (opcional)">
              <input type="date" value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })} style={inputStyle} />
            </FormRow>
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: -6, marginBottom: 12 }}>
            Sin fechas → la promo está activa hasta que la desactivés manualmente.
          </div>

          <FormRow label="Productos que aplica">
            <div style={{ background: t.bg, borderRadius: 9, border: `1.5px solid ${t.border}`, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                cursor: 'pointer', background: form.producto_ids.length === 0 ? t.accentBg : t.surface,
                borderBottom: `1px solid ${t.border}`,
              }}>
                <input type="checkbox"
                  checked={form.producto_ids.length === 0}
                  onChange={() => setForm({ ...form, producto_ids: [] })}
                  style={{ accentColor: t.accent, width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: form.producto_ids.length === 0 ? t.accentText : t.text }}>
                  Todo el catálogo
                </span>
              </label>
              {productos.filter(p => p.activo).map((p, i) => {
                const sel = form.producto_ids.includes(p.id)
                return (
                  <label key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
                    cursor: 'pointer', background: sel ? t.accentBg : i % 2 === 0 ? t.surface : t.bg,
                    borderBottom: i < productos.length - 1 ? `1px solid ${t.border}` : 'none',
                  }}>
                    <input type="checkbox"
                      checked={sel}
                      onChange={() => toggleProducto(p.id)}
                      style={{ accentColor: t.accent, width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: sel ? t.accentText : t.text, fontWeight: sel ? 700 : 400, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nombre}
                    </span>
                    {p.precio_venta && (
                      <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>Q{p.precio_venta}</span>
                    )}
                  </label>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
              {form.producto_ids.length === 0
                ? 'La promo aplica a todos los productos del catálogo.'
                : `Aplica a ${form.producto_ids.length} producto(s) seleccionado(s).`}
            </div>
          </FormRow>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setModal(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleGuardar} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
              {saving ? 'Guardando...' : modal === 'crear' ? 'Crear promoción' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ENVÍO MASIVO ── */}
      {modal === 'masivo' && (
        <Modal title="Envío masivo por WhatsApp" onClose={() => setModal(null)}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>Mensajes en camino</div>
              <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
                El sistema está enviando los mensajes en segundo plano. Esto puede tardar unos minutos.
              </div>
              <button onClick={() => setModal(null)} style={btnPrimary}>Cerrar</button>
            </div>
          ) : (
            <>
              <FormRow label="Destinatarios">
                <select value={masivo.categoria}
                  onChange={e => { setMasivo({ ...masivo, categoria: e.target.value }); setPreview(null) }}
                  style={inputStyle}>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <button onClick={handlePreview}
                    style={{ ...btnSecondary, fontSize: 11, padding: '5px 10px' }}>
                    Ver cuántos
                  </button>
                  {preview !== null && (
                    <span style={{ fontSize: 12, color: t.accentText, fontWeight: 700 }}>
                      {preview} clientes recibirán este mensaje
                    </span>
                  )}
                </div>
              </FormRow>

              <FormRow label="Mensaje *">
                <textarea
                  style={{ ...textareaStyle, height: 120 }}
                  placeholder={`Ej:\n¡Hola! 👋 Tenemos una promo especial para vos:\n🎉 20% de descuento en toda la línea de mochilas.`}
                  value={masivo.mensaje}
                  onChange={e => setMasivo({ ...masivo, mensaje: e.target.value })}
                />
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                  {masivo.mensaje.length} caracteres · Se enviará exactamente como está escrito
                </div>
              </FormRow>

              <div style={{ background: t.yellowBg, border: `1px solid ${t.yellow}44`, borderRadius: 9, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.yellow, marginBottom: 2 }}>⚠️ Atención</div>
                <div style={{ fontSize: 11, color: t.yellow, opacity: 0.85 }}>
                  El envío masivo es irreversible. Asegurate de que el mensaje sea correcto antes de enviar.
                  Meta puede penalizar números que envíen mensajes no solicitados.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setModal(null)} style={btnSecondary}>Cancelar</button>
                <button
                  onClick={handleEnviar}
                  disabled={enviando || !masivo.mensaje.trim()}
                  style={{ ...btnPrimary, flex: 1, background: t.green, opacity: !masivo.mensaje.trim() ? 0.5 : 1 }}>
                  {enviando ? 'Enviando...' : `📤 Enviar a ${preview ?? '?'} clientes`}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Lista ── */}
      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: 32 }}>Cargando...</div>}

        {!loading && promos.length === 0 && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: t.shadow }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>Sin promociones</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>
              Creá tu primera promo — el agente la mostrará automáticamente a los clientes
            </div>
            <button onClick={abrirCrear} style={btnPrimary}>+ Nueva promoción</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {promos.map(p => {
            const vigente = estaVigente(p)
            const badge   = TIPO_BADGE[p.tipo] || TIPO_BADGE.porcentaje
            return (
              <div key={p.id} style={{
                background: t.surface, border: `1px solid ${vigente ? t.border : t.borderLight}`,
                borderRadius: 14, padding: 16,
                opacity: p.activa ? 1 : 0.65,
                boxShadow: t.shadow,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{p.nombre}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: badge.color, background: badge.bg, padding: '1px 8px', borderRadius: 7 }}>
                        {formatValor(p)}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6,
                        background: vigente ? t.greenBg : t.surfaceHover,
                        color:      vigente ? t.greenDark : t.textMuted,
                      }}>
                        {vigente ? 'Vigente' : p.activa ? 'Fuera de fecha' : 'Inactiva'}
                      </span>
                    </div>

                    {p.descripcion && (
                      <div style={{ fontSize: 12, color: t.textSec, marginBottom: 4 }}>{p.descripcion}</div>
                    )}

                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: t.textMuted, flexWrap: 'wrap' }}>
                      <span>{TIPO_LABELS[p.tipo] || p.tipo}</span>
                      {p.fecha_inicio && <span>Desde: {formatFecha(p.fecha_inicio)}</span>}
                      {p.fecha_fin    && <span>Hasta: {formatFecha(p.fecha_fin)}</span>}
                      {!p.fecha_inicio && !p.fecha_fin && <span>Sin límite de fecha</span>}
                    </div>

                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.aplica_a_todo ? (
                        <span style={{ fontSize: 10, background: t.accentBg, color: t.accentText, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          Todo el catálogo
                        </span>
                      ) : (
                        (p.producto_ids || []).map(pid => {
                          const prod = productos.find(x => x.id === pid)
                          return prod ? (
                            <span key={pid} style={{ fontSize: 10, background: t.purpleBg, color: t.purple, padding: '2px 8px', borderRadius: 6 }}>
                              {prod.nombre}
                            </span>
                          ) : null
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button onClick={() => abrirEditar(p)} style={{ ...btnSecondary, fontSize: 11 }}>Editar</button>
                    <button onClick={() => toggleActiva(p)}
                      style={{
                        fontSize: 11, padding: '7px 10px', borderRadius: 9, border: '1px solid',
                        cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
                        background:   p.activa ? t.redBg   : t.greenBg,
                        color:        p.activa ? t.red     : t.greenDark,
                        borderColor:  p.activa ? `${t.red}44` : `${t.green}44`,
                      }}>
                      {p.activa ? 'Pausar' : 'Activar'}
                    </button>
                    <button onClick={() => handleEliminar(p.id)}
                      style={{ fontSize: 11, padding: '7px 10px', borderRadius: 9, border: `1px solid ${t.red}44`, background: t.redBg, color: t.red, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
