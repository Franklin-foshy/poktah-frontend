import { useState, useEffect } from 'react'
import adminClient from '../../api/adminClient'

const CAMPO_LABELS = {
  nombre_display:         { label: 'Nombre', tipo: 'text' },
  precio_mensual:         { label: 'Precio mensual (Q)', tipo: 'number' },
  precio_anual:           { label: 'Precio anual (Q)', tipo: 'number' },
  max_mensajes_mes:       { label: 'Mensajes IA/mes (-1 = ilimitado)', tipo: 'number' },
  max_productos:          { label: 'Productos máx (-1 = ilimitado)', tipo: 'number' },
  max_usuarios:           { label: 'Usuarios máx (-1 = ilimitado)', tipo: 'number' },
  max_metodos_pago:       { label: 'Métodos de pago máx (-1 = ilimitado)', tipo: 'number' },
  tiene_catalogo_publica: { label: 'Catálogo público', tipo: 'bool' },
  tiene_promociones:      { label: 'Promociones y descuentos', tipo: 'bool' },
  tiene_prompt_personal:  { label: 'Prompt IA personalizado', tipo: 'bool' },
  tiene_seguimiento:      { label: 'Seguimiento post-venta', tipo: 'bool' },
  tiene_logs_razon:       { label: 'Logs de razonamiento IA', tipo: 'bool' },
  dias_retencion_logs:    { label: 'Retención de logs (días, 0 = sin acceso)', tipo: 'number' },
}

const SECCIONES = [
  {
    titulo: 'Precios',
    campos: ['nombre_display', 'precio_mensual', 'precio_anual'],
  },
  {
    titulo: 'Límites numéricos',
    campos: ['max_mensajes_mes', 'max_productos', 'max_usuarios', 'max_metodos_pago'],
  },
  {
    titulo: 'Features incluidas',
    campos: ['tiene_catalogo_publica', 'tiene_promociones', 'tiene_prompt_personal', 'tiene_seguimiento', 'tiene_logs_razon', 'dias_retencion_logs'],
  },
]

const PLAN_COLOR = {
  basico:     '#6B7280',
  pro:        '#6C63FF',
  enterprise: '#F59E0B',
}

export default function AdminPlanes() {
  const [planes,    setPlanes]    = useState([])
  const [editando,  setEditando]  = useState({})   // { planId: { campo: valor } }
  const [guardando, setGuardando] = useState({})   // { planId: bool }
  const [exito,     setExito]     = useState({})   // { planId: bool }
  const [error,     setError]     = useState({})   // { planId: string }
  const [cargando,  setCargando]  = useState(true)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await adminClient.get('/planes')
      setPlanes(data)
      // Inicializar estado de edición con valores actuales
      const init = {}
      data.forEach(p => { init[p.id] = { ...p } })
      setEditando(init)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const cambiar = (planId, campo, valor) => {
    setEditando(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [campo]: valor },
    }))
  }

  const guardar = async (planId) => {
    setGuardando(prev => ({ ...prev, [planId]: true }))
    setError(prev => ({ ...prev, [planId]: null }))
    try {
      await adminClient.put(`/planes/${planId}`, editando[planId])
      setExito(prev => ({ ...prev, [planId]: true }))
      setTimeout(() => setExito(prev => ({ ...prev, [planId]: false })), 2500)
      await cargar()
    } catch (e) {
      setError(prev => ({ ...prev, [planId]: e.response?.data?.detail || 'Error al guardar' }))
    } finally {
      setGuardando(prev => ({ ...prev, [planId]: false }))
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: 40, color: '#9CA3AF', fontSize: 14 }}>Cargando planes...</div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Gestión de Planes
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Editá los límites y precios de cada plan en tiempo real. Los cambios aplican inmediatamente.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {planes.map(plan => {
          const vals    = editando[plan.id] || plan
          const color   = PLAN_COLOR[plan.plan_key] || '#6B7280'
          const saving  = guardando[plan.id]
          const ok      = exito[plan.id]
          const err     = error[plan.id]

          return (
            <div key={plan.id} style={{
              background: '#1A1A2E',
              border: `1.5px solid ${ok ? '#22C55E44' : '#2D2D44'}`,
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.3s',
            }}>
              {/* Header plan */}
              <div style={{
                padding: '16px 20px',
                background: `${color}18`,
                borderBottom: `1px solid ${color}33`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', flex: 1 }}>
                  {plan.plan_key.charAt(0).toUpperCase() + plan.plan_key.slice(1)}
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {plan.plan_key}
                </div>
              </div>

              {/* Campos por sección */}
              <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {SECCIONES.map(sec => (
                  <div key={sec.titulo}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {sec.titulo}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sec.campos.map(campo => {
                        const meta = CAMPO_LABELS[campo]
                        const val  = vals[campo]
                        return (
                          <div key={campo}>
                            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                              {meta.label}
                            </div>
                            {meta.tipo === 'bool' ? (
                              <button
                                onClick={() => cambiar(plan.id, campo, !val)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  border: `1.5px solid ${val ? '#22C55E55' : '#374151'}`,
                                  background: val ? '#22C55E18' : '#111827',
                                  color: val ? '#22C55E' : '#6B7280',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  transition: 'all 0.15s',
                                  width: '100%',
                                  textAlign: 'left',
                                }}
                              >
                                {val ? '✓  Incluido' : '✗  No incluido'}
                              </button>
                            ) : (
                              <input
                                type={meta.tipo === 'number' ? 'number' : 'text'}
                                value={val ?? ''}
                                onChange={e => cambiar(
                                  plan.id, campo,
                                  meta.tipo === 'number' ? Number(e.target.value) : e.target.value
                                )}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  borderRadius: 8,
                                  border: '1.5px solid #2D2D44',
                                  background: '#111827',
                                  color: '#fff',
                                  fontSize: 13,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.15s',
                                }}
                                onFocus={e => e.target.style.borderColor = color}
                                onBlur={e => e.target.style.borderColor = '#2D2D44'}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer con guardar */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #2D2D44' }}>
                {err && (
                  <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>{err}</div>
                )}
                <button
                  onClick={() => guardar(plan.id)}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: ok ? '#22C55E' : saving ? '#2D2D44' : color,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                >
                  {ok ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {plan.updated_at && (
                  <div style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 6 }}>
                    Última edición: {new Date(plan.updated_at).toLocaleString('es-GT')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda -1 */}
      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        background: '#1A1A2E',
        border: '1px solid #2D2D44',
        borderRadius: 10,
        fontSize: 12,
        color: '#6B7280',
      }}>
        <strong style={{ color: '#9CA3AF' }}>Nota:</strong>{' '}
        Los campos numéricos con valor <strong style={{ color: '#F59E0B' }}>-1</strong> significan <strong style={{ color: '#F59E0B' }}>ilimitado</strong>. Los cambios aplican inmediatamente para nuevas acciones (los tenants existentes siguen su plan actual).
      </div>
    </div>
  )
}
