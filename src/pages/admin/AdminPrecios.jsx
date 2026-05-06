import { useState, useEffect } from 'react'
import { getAdminStats } from '../../api/adminClient'
import adminClient from '../../api/adminClient'

// Reusar el cliente directamente para estos endpoints específicos
const getPrecios    = () => adminClient.get('/precios')
const setPrecios    = (data) => adminClient.patch('/precios', data)
const getPagos      = () => adminClient.get('/pagos-suscripcion')
const confirmarPago = (id, notas) => adminClient.post(`/pagos-suscripcion/${id}/confirmar`, { notas })

const PLAN_LABEL = { basico: 'Básico', pro: 'Pro', enterprise: 'Enterprise' }
const PLAN_COLOR = { basico: '#6B7280', pro: '#6C63FF', enterprise: '#F59E0B' }

const ESTADO_CFG = {
  pendiente:  { color: '#F59E0B', bg: '#292108' },
  confirmado: { color: '#10B981', bg: '#052e16' },
  fallido:    { color: '#EF4444', bg: '#2D1515' },
}

export default function AdminPrecios() {
  const [precios,   setPrecios_]  = useState(null)
  const [pagos,     setPagos]     = useState([])
  const [editando,  setEditando]  = useState({})   // { basico_mensual: 299, ... }
  const [guardando, setGuardando] = useState(false)
  const [exito,     setExito]     = useState(false)
  const [tab,       setTab]       = useState('precios')

  useEffect(() => {
    getPrecios().then(r => {
      setPrecios_(r.data)
      // Inicializar editando con los valores actuales
      const vals = {}
      Object.entries(r.data).forEach(([plan, p]) => {
        vals[`${plan}_mensual`] = p.mensual
        vals[`${plan}_anual`]   = p.anual
      })
      setEditando(vals)
    }).catch(console.error)

    getPagos().then(r => setPagos(r.data)).catch(console.error)
  }, [])

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await setPrecios(editando)
      setExito(true)
      setTimeout(() => setExito(false), 2500)
      // Refrescar
      const r = await getPrecios()
      setPrecios_(r.data)
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  const handleConfirmar = async (id) => {
    const notas = window.prompt('Notas opcionales (referencia de pago, etc.):') ?? ''
    try {
      await confirmarPago(id, notas)
      const r = await getPagos()
      setPagos(r.data)
    } catch (e) { alert('Error al confirmar') }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Precios y Pagos</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Editá precios en tiempo real — se reflejan en la landing page automáticamente
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#0F0F1A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ key: 'precios', label: 'Precios' }, { key: 'pagos', label: 'Pagos / Transferencias' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t.key ? '#1A1A2E' : 'transparent',
            color:      tab === t.key ? '#fff'    : '#6B7280',
            fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pestaña precios ── */}
      {tab === 'precios' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {precios && Object.entries(precios).map(([plan, p]) => (
              <div key={plan} style={{
                background: '#1A1A2E', border: '1px solid #2D2D44',
                borderRadius: 14, padding: 22,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: PLAN_COLOR[plan], marginBottom: 16,
                }}>
                  {PLAN_LABEL[plan]}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Mensual (Q)', key: `${plan}_mensual` },
                    { label: 'Anual (Q)',   key: `${plan}_anual` },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>{f.label}</div>
                      <input
                        type="number"
                        value={editando[f.key] ?? ''}
                        onChange={e => setEditando(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#0F0F1A', border: '1px solid #2D2D44',
                          borderRadius: 9, padding: '9px 12px',
                          fontSize: 18, fontWeight: 700, color: '#fff',
                          outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = PLAN_COLOR[plan]}
                        onBlur={e => e.target.style.borderColor = '#2D2D44'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {exito && (
            <div style={{
              background: '#052e16', color: '#4ade80', borderRadius: 10,
              padding: '10px 16px', fontSize: 13, fontWeight: 600, marginBottom: 14,
            }}>
              Precios actualizados — ya se reflejan en la landing
            </div>
          )}

          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: guardando ? '#3D3D5C' : '#6C63FF',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar precios'}
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
            El precio anual se muestra dividido entre 12 en la landing (precio mensual equivalente).
          </div>
        </div>
      )}

      {/* ── Pestaña pagos ── */}
      {tab === 'pagos' && (
        <div>
          {pagos.length === 0 ? (
            <div style={{
              background: '#1A1A2E', border: '1px solid #2D2D44', borderRadius: 12,
              padding: 48, textAlign: 'center', color: '#6B7280', fontSize: 14,
            }}>
              No hay pagos registrados aún.
            </div>
          ) : (
            <div style={{ background: '#1A1A2E', border: '1px solid #2D2D44', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2D2D44' }}>
                    {['Negocio', 'Plan', 'Periodo', 'Monto', 'Método', 'Referencia', 'Estado', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p, i) => {
                    const cfg = ESTADO_CFG[p.estado] || ESTADO_CFG.pendiente
                    return (
                      <tr key={p.id} style={{
                        borderBottom: i < pagos.length - 1 ? '1px solid #2D2D44' : 'none',
                      }}>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#fff' }}>{p.negocio}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ color: PLAN_COLOR[p.plan] || '#fff', fontWeight: 600 }}>
                            {PLAN_LABEL[p.plan] || p.plan}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', color: '#9CA3AF' }}>{p.periodo}</td>
                        <td style={{ padding: '11px 16px', color: '#fff', fontWeight: 600 }}>Q{p.monto}</td>
                        <td style={{ padding: '11px 16px', color: '#9CA3AF' }}>{p.metodo}</td>
                        <td style={{ padding: '11px 16px', color: '#9CA3AF', fontSize: 12 }}>
                          {p.referencia || <span style={{ color: '#3D3D5C' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: cfg.bg, color: cfg.color,
                          }}>{p.estado}</span>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {p.estado === 'pendiente' && (
                            <button onClick={() => handleConfirmar(p.id)} style={{
                              padding: '5px 12px', borderRadius: 8, border: 'none',
                              background: '#052e16', color: '#4ade80',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                              Confirmar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
