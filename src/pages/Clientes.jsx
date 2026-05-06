import { useState, useEffect } from 'react'
import { getClientes, actualizarCliente } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

const CAT_KEYS = ['interesado', 'prospecto', 'abandono', 'comprador', 'recurrente']

const CAT_STATIC = {
  interesado: { label: 'Interesado',  desc: 'Solo preguntó' },
  prospecto:  { label: 'Prospecto',   desc: 'Buscó productos' },
  abandono:   { label: 'Abandono',    desc: 'No completó el pago' },
  comprador:  { label: 'Comprador',   desc: 'Al menos 1 compra' },
  recurrente: { label: 'Recurrente',  desc: '2+ compras confirmadas' },
}

const FUENTE_LABEL = { whatsapp: 'WhatsApp', web: 'Web', manual: 'Manual' }

const FILTROS = ['todos', ...CAT_KEYS]

function Pagination({ page, pages, total, onPrev, onNext, t }) {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 0' }}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        style={{
          padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.border}`,
          background: t.surface, color: page <= 1 ? t.textMuted : t.textSec,
          cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}
      >
        ← Anterior
      </button>
      <span style={{ fontSize: 12, color: t.textMuted }}>
        Página {page} de {pages} · {total} en total
      </span>
      <button
        onClick={onNext}
        disabled={page >= pages}
        style={{
          padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.border}`,
          background: t.surface, color: page >= pages ? t.textMuted : t.textSec,
          cursor: page >= pages ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}
      >
        Siguiente →
      </button>
    </div>
  )
}

export default function Clientes() {
  const isMobile = useIsMobile()
  const { t }    = useTheme()

  const CAT_CONFIG = {
    interesado: { ...CAT_STATIC.interesado, bg: t.blueBg,    text: t.blue   },
    prospecto:  { ...CAT_STATIC.prospecto,  bg: t.accentBg,  text: t.accent },
    abandono:   { ...CAT_STATIC.abandono,   bg: t.yellowBg,  text: t.yellow },
    comprador:  { ...CAT_STATIC.comprador,  bg: t.greenBg,   text: t.greenDark },
    recurrente: { ...CAT_STATIC.recurrente, bg: t.accentBg,  text: t.accentText },
  }

  const [clientes,  setClientes] = useState([])
  const [meta,      setMeta]     = useState({ total: 0, page: 1, pages: 1 })
  const [page,      setPage]     = useState(1)
  const [loading,   setLoad]     = useState(true)
  const [busqueda,  setBusqueda] = useState('')
  const [filtro,    setFiltro]   = useState('todos')
  const [selected,  setSelected] = useState(null)
  const [editTag,   setEditTag]  = useState('')
  const [editNota,  setEditNota] = useState('')
  const [savingTag, setSaving]   = useState(false)

  useEffect(() => { cargar(filtro, page) }, [filtro, page])  // eslint-disable-line react-hooks/exhaustive-deps

  const cargar = async (f = filtro, p = page) => {
    setLoad(true)
    try {
      const { data } = await getClientes(f === 'todos' ? null : f, p)
      setClientes(data.items)
      setMeta({ total: data.total, page: data.page, pages: data.pages })
    } catch(e) { console.error(e) }
    finally { setLoad(false) }
  }

  const cambiarFiltro = (f) => { setFiltro(f); setPage(1) }

  const abrirDetalle = (c) => {
    setSelected(c)
    setEditTag(c.etiquetas || '')
    setEditNota(c.notas_internas || '')
  }

  const guardar = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await actualizarCliente(selected.id, {
        etiquetas:      editTag,
        notas_internas: editNota,
      })
      setClientes(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, etiquetas: editTag, notas_internas: editNota }
          : c
      ))
      setSelected(prev => ({ ...prev, etiquetas: editTag, notas_internas: editNota }))
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const stats = Object.fromEntries(
    CAT_KEYS.map(k => [k, clientes.filter(c => c.categoria === k).length])
  )

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    return (
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').includes(busqueda)
    )
  })

  const inputStyle = {
    flex: 1, padding: '8px 10px', border: `1.5px solid ${t.border}`,
    borderRadius: 8, fontSize: 12, color: t.text,
    outline: 'none', background: t.bg, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Clientes"
        subtitle={`${meta.total} clientes registrados`}
      />

      {/* Modal detalle */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
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
              width: '100%', maxWidth: isMobile ? 430 : 440,
              boxShadow: t.shadowLg, border: `1px solid ${t.border}`,
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '12px auto 4px' }} />}
            <div style={{
              padding: isMobile ? '12px 20px 14px' : '16px 20px', borderBottom: `1px solid ${t.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Detalle del cliente</span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: t.textMuted }}
              >✕</button>
            </div>

            <div style={{ padding: isMobile ? 16 : 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: t.accentBg, color: t.accentText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, flexShrink: 0,
                }}>
                  {selected.nombre?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{selected.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: t.textMuted }}>+{selected.whatsapp}</div>
                    {(() => {
                      const cfg = CAT_CONFIG[selected.categoria]
                      return cfg ? (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.text }}>
                          {cfg.label}
                        </span>
                      ) : null
                    })()}
                    {selected.fuente && selected.fuente !== 'whatsapp' && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.surfaceHover, color: t.textMuted, border: `1px solid ${t.border}` }}>
                        {FUENTE_LABEL[selected.fuente] || selected.fuente}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos básicos */}
              {[
                { label: 'Dirección',       value: selected.direccion || 'No registrada' },
                { label: 'Pedidos',         value: `${selected.pedidos} pedido(s)` },
                { label: 'Conversaciones',  value: `${selected.total_conversaciones || 1}` },
                { label: 'Primer contacto', value: selected.primer_contacto_at || '—' },
                { label: 'Último contacto', value: selected.ultimo_contacto_at  || '—' },
              ].map(r => (
                <div key={r.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '9px 0', borderBottom: `1px solid ${t.border}`,
                }}>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{r.value}</span>
                </div>
              ))}

              {/* Etiquetas */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Etiquetas
                </div>
                <input
                  value={editTag}
                  onChange={e => setEditTag(e.target.value)}
                  placeholder="vip, promo mayo, zona-1..."
                  style={inputStyle}
                />
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>Separadas por comas</div>
              </div>

              {/* Notas internas */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Notas internas
                </div>
                <textarea
                  value={editNota}
                  onChange={e => setEditNota(e.target.value)}
                  placeholder="Solo visible para vos. Ej: prefiere pagos en efectivo, zona 3..."
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 10px', border: `1.5px solid ${t.border}`,
                    borderRadius: 8, fontSize: 12, color: t.text,
                    outline: 'none', background: t.bg, resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                onClick={guardar}
                disabled={savingTag}
                style={{
                  width: '100%', marginTop: 12, padding: '10px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: savingTag ? 'not-allowed' : 'pointer',
                  background: t.accent, color: '#fff',
                  opacity: savingTag ? 0.7 : 1, fontFamily: 'inherit',
                }}
              >
                {savingTag ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <a
                href={`https://wa.me/${selected.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center', marginTop: 10,
                  background: '#25D366', color: '#fff', padding: '10px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                💬 Abrir en WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? 14 : 20 }}>

        {/* Tarjetas de categoría */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          {CAT_KEYS.map(key => {
            const cfg    = CAT_CONFIG[key]
            const active = filtro === key
            return (
              <div
                key={key}
                onClick={() => cambiarFiltro(active ? 'todos' : key)}
                style={{
                  background: active ? cfg.bg : t.surface,
                  border: `1.5px solid ${active ? cfg.text + '44' : t.border}`,
                  borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                  transition: 'all 0.15s', boxShadow: t.shadow,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: cfg.text }}>{stats[key] || 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.text, marginTop: 2 }}>{cfg.label}</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{cfg.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Búsqueda + filtros */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: t.shadow }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              style={{
                flex: 1, minWidth: 180, padding: '8px 12px',
                border: `1.5px solid ${t.border}`, borderRadius: 9,
                fontSize: 13, color: t.text, outline: 'none', background: t.bg, fontFamily: 'inherit',
              }}
              placeholder="Buscar por nombre o número..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FILTROS.map(f => (
                <button
                  key={f}
                  onClick={() => cambiarFiltro(f)}
                  style={{
                    padding: '5px 10px', borderRadius: 20, fontSize: 11,
                    fontWeight: f === filtro ? 700 : 400, border: 'none', cursor: 'pointer',
                    background: filtro === f ? t.accent : t.surfaceHover,
                    color:      filtro === f ? '#fff'   : t.textMuted,
                    fontFamily: 'inherit',
                  }}
                >
                  {f === 'todos' ? 'Todos' : CAT_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: 32 }}>Cargando...</div>}

        {!loading && clientes.length === 0 && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: t.shadow }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>Sin clientes aún</div>
            <div style={{ fontSize: 13, color: t.textMuted }}>Los clientes aparecen cuando escriben por WhatsApp</div>
          </div>
        )}

        <Pagination
          page={meta.page} pages={meta.pages} total={meta.total}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(meta.pages, p + 1))}
          t={t}
        />

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
          {filtrados.map(c => {
            const cfg = CAT_CONFIG[c.categoria] || CAT_CONFIG.interesado
            return (
              <div
                key={c.id}
                onClick={() => abrirDetalle(c)}
                style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 14, padding: 16, cursor: 'pointer',
                  transition: 'all 0.15s', boxShadow: t.shadow,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = t.accent
                  e.currentTarget.style.boxShadow = t.shadowMd
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.border
                  e.currentTarget.style.boxShadow = t.shadow
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: t.accentBg, color: t.accentText,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}>
                    {c.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>+{c.whatsapp}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.text }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: t.accentBg, color: t.accentText }}>
                    {c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}
                  </span>
                </div>
                {c.etiquetas && (
                  <div style={{ marginTop: 8, fontSize: 10, color: t.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🏷 {c.etiquetas}
                  </div>
                )}
                {c.ultimo_contacto_at && (
                  <div style={{ marginTop: 6, fontSize: 10, color: t.textMuted }}>
                    Último: {c.ultimo_contacto_at}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
