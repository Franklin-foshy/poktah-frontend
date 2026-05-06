import { useState, useEffect } from 'react'
import { getAdminLeads, actualizarEstadoLeadAdmin, eliminarLeadAdmin, activarLeadComoNegocio } from '../../api/adminClient'

const ESTADOS = [
  { value: '',           label: 'Todos' },
  { value: 'nuevo',      label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'demo',       label: 'Demo' },
  { value: 'cerrado',    label: 'Cerrado' },
  { value: 'perdido',    label: 'Perdido' },
]

const ESTADO_CFG = {
  nuevo:      { color: '#3B82F6', bg: '#0c1a2e' },
  contactado: { color: '#F59E0B', bg: '#292108' },
  demo:       { color: '#8B5CF6', bg: '#1e1b2e' },
  cerrado:    { color: '#10B981', bg: '#052e16' },
  perdido:    { color: '#EF4444', bg: '#2D1515' },
}

export default function AdminLeads() {
  const [leads,    setLeads]    = useState([])
  const [filtro,   setFiltro]   = useState('')
  const [cargando, setCargando] = useState(true)
  const [selected, setSelected] = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await getAdminLeads(filtro || null)
      setLeads(data)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [filtro])

  const handleEstado = async (id, estado) => {
    try {
      await actualizarEstadoLeadAdmin(id, estado)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, estado } : l))
      if (selected?.id === id) setSelected(prev => ({ ...prev, estado }))
    } catch (e) { console.error(e) }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este prospecto?')) return
    try {
      await eliminarLeadAdmin(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) { console.error(e) }
  }

  // ── Activar lead como negocio ──────────────────────────────────────────────
  const [modalActivar, setModalActivar] = useState(false)
  const [formWa, setFormWa] = useState({ phone_number_id: '', whatsapp_token: '', plan: 'basico', dias: '30', slug: '' })
  const [activando,    setActivando]    = useState(false)
  const [activadoData, setActivadoData] = useState(null)
  const [activadoMsg,  setActivadoMsg]  = useState('')
  const [errorActivar, setErrorActivar] = useState('')

  const abrirModalActivar = () => {
    setFormWa({ phone_number_id: '', whatsapp_token: '', plan: 'basico', dias: '30', slug: '' })
    setActivadoData(null)
    setActivadoMsg('')
    setErrorActivar('')
    setModalActivar(true)
  }

  const handleActivar = async () => {
    if (!formWa.phone_number_id.trim() || !formWa.whatsapp_token.trim()) {
      setErrorActivar('Phone Number ID y Token son obligatorios')
      return
    }
    setActivando(true)
    setErrorActivar('')
    try {
      const payload = {
        phone_number_id: formWa.phone_number_id.trim(),
        whatsapp_token:  formWa.whatsapp_token.trim(),
        plan:            formWa.plan,
        dias:            parseInt(formWa.dias),
      }
      if (formWa.slug.trim()) payload.slug = formWa.slug.trim()
      const { data } = await activarLeadComoNegocio(selected.id, payload)
      setActivadoMsg(data.mensaje)
      setActivadoData(data)
      setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, estado: 'cerrado' } : l))
      setSelected(prev => ({ ...prev, estado: 'cerrado' }))
    } catch (e) {
      setErrorActivar(e?.response?.data?.detail || 'Error al activar')
    } finally {
      setActivando(false)
    }
  }

  const conteos = ESTADOS.slice(1).reduce((acc, e) => {
    acc[e.value] = leads.filter(l => l.estado === e.value).length
    return acc
  }, {})

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', height: '100vh', overflow: 'hidden' }}>

      {/* Lista */}
      <div style={{ overflowY: 'auto', padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Prospectos Poktah</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Negocios interesados en la plataforma
          </div>
        </div>

        {/* Contadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
          {ESTADOS.slice(1).map(e => {
            const cfg = ESTADO_CFG[e.value]
            const active = filtro === e.value
            return (
              <button key={e.value} onClick={() => setFiltro(active ? '' : e.value)} style={{
                background: active ? cfg.bg : '#1A1A2E',
                border: `1.5px solid ${active ? cfg.color : '#2D2D44'}`,
                borderRadius: 10, padding: '10px', cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: active ? cfg.color : '#fff' }}>
                  {conteos[e.value] || 0}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{e.label}</div>
              </button>
            )
          })}
        </div>

        {/* Filtros pill */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {ESTADOS.map(e => (
            <button key={e.value} onClick={() => setFiltro(e.value)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: filtro === e.value ? '#6C63FF' : '#2D2D44',
              background:  filtro === e.value ? '#6C63FF22' : 'transparent',
              color:       filtro === e.value ? '#6C63FF' : '#6B7280',
              cursor: 'pointer', fontSize: 12, fontWeight: filtro === e.value ? 600 : 400,
            }}>
              {e.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Cargando...</div>
        ) : leads.length === 0 ? (
          <div style={{
            background: '#1A1A2E', border: '1px solid #2D2D44', borderRadius: 12,
            padding: 48, textAlign: 'center', color: '#6B7280', fontSize: 14,
          }}>
            No hay prospectos{filtro ? ` con estado "${filtro}"` : ''}.
          </div>
        ) : (
          <div style={{ background: '#1A1A2E', border: '1px solid #2D2D44', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2D2D44' }}>
                  {['Negocio', 'Giro', 'WhatsApp', 'Ciudad', 'Estado', 'Registrado'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => {
                  const cfg    = ESTADO_CFG[l.estado] || {}
                  const activo = selected?.id === l.id
                  return (
                    <tr key={l.id} onClick={() => setSelected(l)} style={{
                      borderBottom: i < leads.length - 1 ? '1px solid #2D2D44' : 'none',
                      background: activo ? '#6C63FF11' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#2D2D44' }}
                      onMouseLeave={e => { if (!activo) e.currentTarget.style.background = activo ? '#6C63FF11' : 'transparent' }}
                    >
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: '#fff' }}>{l.nombre_negocio}</td>
                      <td style={{ padding: '11px 16px', color: '#9CA3AF' }}>{l.giro || '—'}</td>
                      <td style={{ padding: '11px 16px', color: '#9CA3AF' }}>{l.whatsapp}</td>
                      <td style={{ padding: '11px 16px', color: '#9CA3AF' }}>{l.ciudad || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: cfg.bg, color: cfg.color,
                        }}>{l.estado}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280', fontSize: 12 }}>{l.created_at}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel detalle */}
      {selected && (
        <div style={{
          background: '#1A1A2E', borderLeft: '1px solid #2D2D44',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '18px 20px', borderBottom: '1px solid #2D2D44',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{selected.nombre_negocio}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: 20 }}>
            {/* Datos */}
            {[
              { label: 'Giro',          value: selected.giro },
              { label: 'WhatsApp',      value: selected.whatsapp },
              { label: 'Email',         value: selected.email },
              { label: 'Ciudad',        value: selected.ciudad },
              { label: 'Pedidos/mes',   value: selected.pedidos_mes },
              { label: 'Registrado',    value: selected.created_at },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: '1px solid #2D2D44',
              }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{f.label}</span>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}

            {selected.descripcion && (
              <div style={{ background: '#0F0F1A', borderRadius: 10, padding: 12, marginTop: 14 }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Descripción</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>{selected.descripcion}</div>
              </div>
            )}

            {/* Cambiar estado */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Estado
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {ESTADOS.slice(1).map(e => {
                  const cfg    = ESTADO_CFG[e.value]
                  const activo = selected.estado === e.value
                  return (
                    <button key={e.value} onClick={() => handleEstado(selected.id, e.value)} style={{
                      padding: '8px 6px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: '1.5px solid',
                      borderColor: activo ? cfg.color : '#2D2D44',
                      background:  activo ? cfg.bg    : 'transparent',
                      color:       activo ? cfg.color : '#6B7280',
                    }}>
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Activar como negocio */}
            {selected.estado !== 'cerrado' && (
              <button
                onClick={abrirModalActivar}
                style={{
                  width: '100%', marginTop: 20, padding: '11px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: '#6C63FF', color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >
                Activar como negocio →
              </button>
            )}
            {selected.estado === 'cerrado' && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#052e16', border: '1px solid #166534', fontSize: 12, color: '#4ade80', textAlign: 'center', fontWeight: 600 }}>
                Negocio activado
              </div>
            )}

            {/* Acciones secundarias */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a
                href={`https://wa.me/${selected.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: '#14532d', color: '#4ade80', textDecoration: 'none',
                  textAlign: 'center', display: 'block', border: '1px solid #166534',
                }}
              >
                WhatsApp
              </a>
              <button onClick={() => handleEliminar(selected.id)} style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 12,
                background: '#2D1515', color: '#EF4444', border: '1px solid #7f1d1d',
                cursor: 'pointer', fontWeight: 600,
              }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ACTIVAR NEGOCIO ─────────────────────────────────────────────── */}
      {modalActivar && selected && (
        <>
          <div
            onClick={() => { if (!activando) setModalActivar(false) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 600 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#1A1A2E', border: '1px solid #2D2D44',
            borderRadius: 16, padding: '28px 32px',
            zIndex: 601, width: 460, maxWidth: '92vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Activar negocio
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              {selected.nombre_negocio} · {selected.whatsapp}
            </div>

            {activadoMsg ? (
              <div style={{ padding: '16px', borderRadius: 10, background: '#052e16', border: '1px solid #166534', color: '#4ade80', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                {activadoMsg}
                <div style={{ marginTop: 8, fontSize: 11, color: '#86efac' }}>
                  El dueño puede iniciar sesión con su número de WhatsApp.
                </div>
                {activadoData?.catalogo_url && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #166534' }}>
                    <div style={{ fontSize: 11, color: '#86efac', marginBottom: 4, fontWeight: 700 }}>🛍️ URL del catálogo público:</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6ee7b7', wordBreak: 'break-all' }}>{activadoData.catalogo_url}</span>
                      <button onClick={() => navigator.clipboard.writeText(activadoData.catalogo_url)}
                        style={{ flexShrink: 0, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#86efac', fontSize: 11, cursor: 'pointer' }}>
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                    PHONE NUMBER ID (de Meta Business)
                  </label>
                  <input
                    value={formWa.phone_number_id}
                    onChange={e => setFormWa(f => ({ ...f, phone_number_id: e.target.value }))}
                    placeholder="ej: 123456789012345"
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0F0F1A', border: '1px solid #2D2D44', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                    TOKEN DE ACCESO (WhatsApp Cloud API)
                  </label>
                  <input
                    type="password"
                    value={formWa.whatsapp_token}
                    onChange={e => setFormWa(f => ({ ...f, whatsapp_token: e.target.value }))}
                    placeholder="EAAxxxxxxxx..."
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0F0F1A', border: '1px solid #2D2D44', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>
                    SLUG DEL CATÁLOGO (opcional — se auto-genera si se deja vacío)
                  </label>
                  <input
                    value={formWa.slug}
                    onChange={e => setFormWa(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="ej: salon-diana-zona10"
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0F0F1A', border: '1px solid #2D2D44', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>PLAN</label>
                    <select
                      value={formWa.plan}
                      onChange={e => setFormWa(f => ({ ...f, plan: e.target.value }))}
                      style={{ width: '100%', background: '#0F0F1A', border: '1px solid #2D2D44', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                    >
                      <option value="basico">Básico</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>DÍAS DE SUSCRIPCIÓN</label>
                    <select
                      value={formWa.dias}
                      onChange={e => setFormWa(f => ({ ...f, dias: e.target.value }))}
                      style={{ width: '100%', background: '#0F0F1A', border: '1px solid #2D2D44', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                    >
                      <option value="7">7 días (prueba rápida)</option>
                      <option value="15">15 días (prueba)</option>
                      <option value="30">30 días (prueba extendida)</option>
                      <option value="90">90 días</option>
                      <option value="365">365 días (anual)</option>
                    </select>
                  </div>
                </div>

                {errorActivar && (
                  <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>{errorActivar}</div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {!activadoMsg && (
                <button
                  onClick={handleActivar}
                  disabled={activando}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 9, border: 'none',
                    background: activando ? '#374151' : '#6C63FF',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: activando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {activando ? 'Activando...' : 'Confirmar y activar'}
                </button>
              )}
              <button
                onClick={() => setModalActivar(false)}
                style={{
                  flex: activadoMsg ? 2 : 1, padding: '11px', borderRadius: 9,
                  border: '1px solid #2D2D44', background: 'transparent',
                  color: '#6B7280', fontSize: 13, cursor: 'pointer',
                }}
              >
                {activadoMsg ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
