import { useState, useEffect } from 'react'
import adminClient from '../../api/adminClient'

const ESTADO_COLOR = {
  pendiente:   { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
  confirmado:  { bg: '#DCFCE7', color: '#166534', label: 'Confirmado' },
  fallido:     { bg: '#FEE2E2', color: '#991B1B', label: 'Fallido' },
}

const PLAN_COLOR = {
  pro:        { bg: '#F0EFFE', color: '#6C63FF' },
  enterprise: { bg: '#FEF3C7', color: '#F59E0B' },
}

export default function AdminPagos() {
  const [pagos,           setPagos]           = useState([])
  const [meta,            setMeta]            = useState({ total: 0, page: 1, pages: 1 })
  const [page,            setPage]            = useState(1)
  const [filtro,          setFiltro]          = useState('pendiente')
  const [pendientesCount, setPendientesCount] = useState(0)
  const [cargando,        setCargando]        = useState(true)
  const [modal,           setModal]           = useState(null)
  const [notas,           setNotas]           = useState('')
  const [enviando,        setEnviando]        = useState(false)
  const [msg,             setMsg]             = useState('')

  const cargar = (f = filtro, p = page) => {
    setCargando(true)
    const params = { page: p, size: 20, ...(f !== 'todos' ? { estado: f } : {}) }
    adminClient.get('/pagos-suscripcion', { params })
      .then(r => {
        setPagos(r.data.items)
        setMeta({ total: r.data.total, page: r.data.page, pages: r.data.pages })
      })
      .catch(console.error)
      .finally(() => setCargando(false))
  }

  const cargarPendientesCount = () => {
    adminClient.get('/pagos-suscripcion', { params: { estado: 'pendiente', size: 1 } })
      .then(r => setPendientesCount(r.data.total || 0))
      .catch(() => {})
  }

  useEffect(() => { cargar(filtro, page) }, [filtro, page])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargarPendientesCount() }, [])

  const cambiarFiltro = (f) => { setFiltro(f); setPage(1) }

  const filtrados = pagos

  const abrirModal = (pago) => { setModal(pago); setNotas(''); setMsg('') }
  const cerrarModal = () => { setModal(null); setMsg('') }

  const confirmar = async (accion) => {
    setEnviando(true)
    try {
      await adminClient.post(`/pagos-suscripcion/${modal.id}/confirmar`, {
        accion,
        notas: notas.trim() || undefined,
      })
      setMsg(accion === 'aprobar' ? 'Pago confirmado y plan activado.' : 'Pago rechazado.')
      cargar(filtro, page)
      cargarPendientesCount()
      setTimeout(() => { cerrarModal(); }, 1500)
    } catch {
      setMsg('Error al procesar. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
          Pagos de Suscripción
          {pendientesCount > 0 && (
            <span style={{
              marginLeft: 10, background: '#EF4444', color: '#fff',
              borderRadius: 20, fontSize: 12, padding: '2px 9px', fontWeight: 700,
            }}>
              {pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Revisá y confirmá los pagos de transferencia de los negocios.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { key: 'pendiente',  label: 'Pendientes' },
          { key: 'confirmado', label: 'Confirmados' },
          { key: 'fallido',    label: 'Fallidos' },
          { key: 'todos',      label: 'Todos' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => cambiarFiltro(f.key)}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filtro === f.key ? '#6C63FF' : '#2D2D44',
              color: filtro === f.key ? '#fff' : '#9CA3AF',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ color: '#6B7280', fontSize: 13 }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{
          background: '#1A1A2E', border: '1px solid #2D2D44',
          borderRadius: 12, padding: 40, textAlign: 'center',
          color: '#6B7280', fontSize: 13,
        }}>
          No hay pagos {filtro !== 'todos' ? `con estado "${filtro}"` : ''}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map(p => {
            const ec = ESTADO_COLOR[p.estado] || ESTADO_COLOR.pendiente
            const pc = PLAN_COLOR[p.plan] || { bg: '#F3F4F6', color: '#6B7280' }
            return (
              <div
                key={p.id}
                style={{
                  background: '#1A1A2E', border: `1px solid ${p.estado === 'pendiente' ? '#F59E0B44' : '#2D2D44'}`,
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}
              >
                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                    {p.negocio}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 9px', borderRadius: 20,
                      background: pc.bg, color: pc.color,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      Plan {p.plan.toUpperCase()} · {p.periodo}
                    </span>
                    <span style={{
                      padding: '2px 9px', borderRadius: 20,
                      background: ec.bg, color: ec.color,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {ec.label}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Q{p.monto}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>monto</div>
                </div>

                {/* Referencia */}
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Referencia</div>
                  <div style={{ fontSize: 12, color: '#D1D5DB', fontFamily: 'monospace' }}>
                    {p.referencia || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{p.created_at}</div>
                </div>

                {/* Acción */}
                {p.estado === 'pendiente' && (
                  <button
                    onClick={() => abrirModal(p)}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: 'none',
                      background: '#6C63FF', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Revisar
                  </button>
                )}
                {p.estado === 'confirmado' && (
                  <div style={{ fontSize: 11, color: '#6B7280' }}>
                    {p.confirmado_at}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {meta.pages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'20px 0' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding:'6px 16px', borderRadius:8, border:'1px solid #2D2D44', background:'#1A1A2E', color: page<=1?'#4B5563':'#9CA3AF', cursor: page<=1?'default':'pointer', fontSize:13 }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize:12, color:'#6B7280' }}>
            Página {meta.page} de {meta.pages} · {meta.total} en total
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
            disabled={page >= meta.pages}
            style={{ padding:'6px 16px', borderRadius:8, border:'1px solid #2D2D44', background:'#1A1A2E', color: page>=meta.pages?'#4B5563':'#9CA3AF', cursor: page>=meta.pages?'default':'pointer', fontSize:13 }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal confirmar */}
      {modal && (
        <>
          <div
            onClick={cerrarModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#1A1A2E', border: '1px solid #2D2D44',
            borderRadius: 16, padding: '28px 32px',
            zIndex: 501, width: 420, maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Revisar pago #{modal.id}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>
              {modal.negocio} — Plan {modal.plan.toUpperCase()} {modal.periodo} — Q{modal.monto}
            </div>

            <div style={{ background: '#0F0F1A', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              {[
                { label: 'Método',     value: modal.metodo },
                { label: 'Referencia', value: modal.referencia || '—' },
                { label: 'Enviado',    value: modal.created_at },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#6B7280' }}>{r.label}</span>
                  <span style={{ color: '#D1D5DB', fontFamily: r.label === 'Referencia' ? 'monospace' : 'inherit' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>
                Notas internas (opcional)
              </label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
                placeholder="Ej: transferencia verificada en BI"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0F0F1A', border: '1px solid #2D2D44',
                  borderRadius: 8, padding: '8px 12px',
                  color: '#fff', fontSize: 13, resize: 'none',
                }}
              />
            </div>

            {msg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: msg.includes('Error') ? '#7F1D1D22' : '#14532D22',
                color: msg.includes('Error') ? '#FCA5A5' : '#86EFAC',
                fontSize: 13,
              }}>
                {msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => confirmar('aprobar')}
                disabled={enviando}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: enviando ? '#374151' : '#16A34A',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer',
                }}
              >
                {enviando ? '...' : 'Confirmar y activar'}
              </button>
              <button
                onClick={() => confirmar('rechazar')}
                disabled={enviando}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #EF4444',
                  background: 'transparent', color: '#EF4444',
                  fontSize: 13, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer',
                }}
              >
                Rechazar
              </button>
            </div>

            <button
              onClick={cerrarModal}
              style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 8, border: '1px solid #2D2D44', background: 'transparent', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
