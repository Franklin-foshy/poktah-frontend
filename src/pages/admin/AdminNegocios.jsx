import { useState, useEffect } from 'react'
import { getNegocios, actualizarNegocio } from '../../api/adminClient'

const PLANES = ['basico', 'pro', 'enterprise']
const PLAN_CFG = {
  basico:     { color: '#6B7280', bg: '#1F2937' },
  pro:        { color: '#6C63FF', bg: '#1E1B4B' },
  enterprise: { color: '#F59E0B', bg: '#292108' },
}

export default function AdminNegocios() {
  const [negocios,  setNegocios]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [notas,     setNotas]     = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito,     setExito]     = useState(false)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await getNegocios()
      setNegocios(data)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const [phoneId,    setPhoneId]    = useState('')
  const [waToken,    setWaToken]    = useState('')
  const [exitoWa,    setExitoWa]    = useState(false)
  const [guardandoWa, setGuardandoWa] = useState(false)
  const [errorWa,    setErrorWa]    = useState('')

  const abrirDetalle = (n) => {
    setSelected(n)
    setNotas(n.notas_admin || '')
    setPhoneId(n.phone_number_id || '')
    setWaToken('')           // nunca pre-rellenar el token por seguridad
    setExito(false)
    setExitoWa(false)
    setErrorWa('')
  }

  const handleGuardarWhatsApp = async () => {
    if (!phoneId.trim()) return
    setGuardandoWa(true)
    setErrorWa('')
    try {
      const payload = { phone_number_id: phoneId.trim() }
      if (waToken.trim()) payload.whatsapp_token = waToken.trim()
      await actualizarNegocio(selected.id, payload)
      setNegocios(prev => prev.map(n => n.id === selected.id ? { ...n, phone_number_id: phoneId.trim() } : n))
      setSelected(prev => ({ ...prev, phone_number_id: phoneId.trim() }))
      setWaToken('')
      setExitoWa(true)
      setTimeout(() => setExitoWa(false), 2500)
    } catch (e) {
      setErrorWa(e?.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardandoWa(false)
    }
  }

  const handlePatch = async (id, data) => {
    try {
      await actualizarNegocio(id, data)
      setNegocios(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
      if (selected?.id === id) setSelected(prev => ({ ...prev, ...data }))
    } catch (e) { console.error(e) }
  }

  const handleGuardarNotas = async () => {
    setGuardando(true)
    try {
      await actualizarNegocio(selected.id, { notas_admin: notas })
      setNegocios(prev => prev.map(n => n.id === selected.id ? { ...n, notas_admin: notas } : n))
      setExito(true)
      setTimeout(() => setExito(false), 2000)
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 0, height: '100vh', overflow: 'hidden' }}>

      {/* Lista */}
      <div style={{ overflowY: 'auto', padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Negocios</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {negocios.length} negocio{negocios.length !== 1 ? 's' : ''} inscritos
          </div>
        </div>

        {cargando ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Cargando...</div>
        ) : (
          <div style={{ background: '#1A1A2E', border: '1px solid #2D2D44', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2D2D44' }}>
                  {['Negocio', 'Plan', 'Clientes', 'Pedidos', 'Estado', 'Inscrito'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: '#6B7280',
                      letterSpacing: '0.05em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {negocios.map((n, i) => {
                  const activo = selected?.id === n.id
                  const pcfg   = PLAN_CFG[n.plan] || PLAN_CFG.basico
                  return (
                    <tr
                      key={n.id}
                      onClick={() => abrirDetalle(n)}
                      style={{
                        borderBottom: i < negocios.length - 1 ? '1px solid #2D2D44' : 'none',
                        background: activo ? '#6C63FF11' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#2D2D44' }}
                      onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{n.nombre_negocio}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{n.phone_number_id}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600,
                          background: pcfg.bg, color: pcfg.color,
                        }}>
                          {n.plan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9CA3AF' }}>{n.total_clientes}</td>
                      <td style={{ padding: '12px 16px', color: '#9CA3AF' }}>{n.total_pedidos}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: n.activo ? '#052e16' : '#2D1515',
                          color:      n.activo ? '#10B981'  : '#EF4444',
                        }}>
                          {n.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>
                        {n.created_at}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel derecho */}
      {selected && (
        <div style={{
          background: '#1A1A2E', borderLeft: '1px solid #2D2D44',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 20px', borderBottom: '1px solid #2D2D44',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{selected.nombre_negocio}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Inscrito {selected.created_at}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 18, cursor: 'pointer' }}
            >✕</button>
          </div>

          <div style={{ padding: 20, flex: 1 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Clientes', value: selected.total_clientes },
                { label: 'Pedidos',  value: selected.total_pedidos },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#0F0F1A', borderRadius: 10, padding: '14px 16px',
                  border: '1px solid #2D2D44',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#6C63FF' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Plan */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Plan
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {PLANES.map(p => {
                  const cfg = PLAN_CFG[p]
                  const activo = selected.plan === p
                  return (
                    <button key={p} onClick={() => handlePatch(selected.id, { plan: p })} style={{
                      flex: 1, padding: '8px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: '1.5px solid',
                      borderColor: activo ? cfg.color : '#2D2D44',
                      background:  activo ? cfg.bg    : 'transparent',
                      color:       activo ? cfg.color : '#6B7280',
                    }}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Activar/Desactivar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Acceso
              </div>
              <button
                onClick={() => handlePatch(selected.id, { activo: !selected.activo })}
                style={{
                  width: '100%', padding: '9px',
                  borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: selected.activo ? '#EF4444' : '#10B981',
                  background:  selected.activo ? '#2D1515'  : '#052e16',
                  color:       selected.activo ? '#EF4444'  : '#10B981',
                }}
              >
                {selected.activo ? 'Desactivar acceso' : 'Activar acceso'}
              </button>
            </div>

            {/* Vencimiento */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Vence el
              </div>
              <input
                type="date"
                defaultValue={selected.suscripcion_hasta ? selected.suscripcion_hasta.split('/').reverse().join('-') : ''}
                onChange={e => handlePatch(selected.id, { suscripcion_hasta: e.target.value || null })}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0F0F1A', border: '1px solid #2D2D44',
                  borderRadius: 9, padding: '9px 12px', fontSize: 13,
                  color: '#fff', outline: 'none',
                }}
              />
            </div>

            {/* WhatsApp */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                WhatsApp (Meta)
              </div>
              <input
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                placeholder="Phone Number ID (ej: 123456789012345)"
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 8,
                  background: '#0F0F1A', border: '1px solid #2D2D44',
                  borderRadius: 9, padding: '9px 12px', fontSize: 13,
                  color: '#fff', outline: 'none', fontFamily: 'monospace',
                }}
              />
              <input
                value={waToken}
                onChange={e => setWaToken(e.target.value)}
                placeholder="Token de acceso (dejar vacío para no cambiar)"
                type="password"
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 8,
                  background: '#0F0F1A', border: '1px solid #2D2D44',
                  borderRadius: 9, padding: '9px 12px', fontSize: 13,
                  color: '#fff', outline: 'none',
                }}
              />
              {errorWa && (
                <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 6 }}>{errorWa}</div>
              )}
              <button
                onClick={handleGuardarWhatsApp}
                disabled={guardandoWa || !phoneId.trim()}
                style={{
                  width: '100%', padding: '9px',
                  background: exitoWa ? '#052e16' : '#6C63FF',
                  color: exitoWa ? '#10B981' : '#fff',
                  border: 'none', borderRadius: 9, fontSize: 13,
                  fontWeight: 600, cursor: guardandoWa || !phoneId.trim() ? 'not-allowed' : 'pointer',
                  opacity: !phoneId.trim() ? 0.5 : 1,
                }}
              >
                {exitoWa ? 'Guardado' : guardandoWa ? 'Guardando...' : 'Guardar WhatsApp'}
              </button>
            </div>

            {/* Notas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Notas internas
              </div>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={4}
                placeholder="Notas sobre este negocio..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0F0F1A', border: '1px solid #2D2D44',
                  borderRadius: 9, padding: '10px 12px', fontSize: 13,
                  color: '#fff', resize: 'vertical', fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleGuardarNotas}
                disabled={guardando}
                style={{
                  marginTop: 8, width: '100%', padding: '9px',
                  background: exito ? '#052e16' : '#6C63FF',
                  color: exito ? '#10B981' : '#fff',
                  border: 'none', borderRadius: 9, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {exito ? 'Guardado' : guardando ? 'Guardando...' : 'Guardar notas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
