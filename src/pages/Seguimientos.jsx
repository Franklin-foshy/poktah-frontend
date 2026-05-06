import { useState, useEffect, useRef } from 'react'
import { getSeguimientos, getSeguimientoChat, enviarMensajeSeguimiento, getStats } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

const ESTADOS = [
  { value: '',           label: 'Todos' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'enviado',    label: 'Enviado' },
  { value: 'respondido', label: 'Respondido' },
]

const CARD_DEFS = [
  { key: 'pendiente',  label: 'Pendientes',  desc: 'Por enviar' },
  { key: 'enviado',    label: 'Enviados',    desc: 'Esperando respuesta' },
  { key: 'respondido', label: 'Respondidos', desc: 'Con feedback del cliente' },
]

function Badge({ label, bg, text }) {
  if (!label) return null
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: bg, color: text, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function ChatPanel({ chat, cargandoChat, mensaje, setMensaje, guia, setGuia, enviando, exito, handleEnviar, chatEndRef, t }) {
  return (
    <>
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 18px',
        background: t.bg, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {cargandoChat ? (
          <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: '40px 0' }}>
            Cargando conversación...
          </div>
        ) : !chat || chat.mensajes.length === 0 ? (
          <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: '40px 0', fontStyle: 'italic' }}>
            Sin mensajes en el historial aún.
          </div>
        ) : (
          <>
            {chat.mensajes.map((m, i) => {
              const esAgente = m.rol === 'model'
              const fechaAnterior = i > 0 ? chat.mensajes[i - 1].fecha : null
              return (
                <div key={i}>
                  {m.fecha !== fechaAnterior && (
                    <div style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, margin: '8px 0 4px' }}>
                      {m.fecha}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: esAgente ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '78%',
                      background: esAgente ? t.accent : t.surface,
                      color: esAgente ? '#fff' : t.text,
                      borderRadius: esAgente ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '9px 13px', fontSize: 13, lineHeight: 1.5,
                      boxShadow: t.shadow,
                      border: esAgente ? 'none' : `1px solid ${t.border}`,
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.contenido}</div>
                      <div style={{
                        fontSize: 10, marginTop: 4, textAlign: 'right',
                        color: esAgente ? 'rgba(255,255,255,0.6)' : t.textMuted,
                      }}>{m.hora}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      <div style={{ padding: '14px 18px', borderTop: `1px solid ${t.border}`, flexShrink: 0, background: t.surface }}>
        {exito && (
          <div style={{
            background: t.greenBg, color: t.greenDark, borderRadius: 8,
            padding: '7px 12px', fontSize: 12, fontWeight: 600, marginBottom: 10,
          }}>
            ✓ Mensaje enviado correctamente
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Mensaje sugerido — editá antes de enviar
        </div>
        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: `1.5px solid ${t.border}`, borderRadius: 10,
            padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
            resize: 'vertical', fontFamily: 'inherit',
            outline: 'none', color: t.text, background: t.bg,
          }}
          onFocus={e => e.target.style.borderColor = t.accent}
          onBlur={e => e.target.style.borderColor = t.border}
          placeholder="Escribí el mensaje..."
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Número de guía (opcional)
          </div>
          <input
            value={guia}
            onChange={e => setGuia(e.target.value)}
            placeholder="Ej: GT123456789"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${t.border}`, borderRadius: 9,
              padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
              outline: 'none', color: t.text, background: t.bg,
            }}
            onFocus={e => e.target.style.borderColor = t.accent}
            onBlur={e => e.target.style.borderColor = t.border}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => setMensaje(chat?.sugerido || '')}
            style={{
              padding: '8px 12px', background: t.surfaceHover,
              border: `1.5px solid ${t.border}`, borderRadius: 9,
              fontSize: 12, color: t.textSec, cursor: 'pointer', fontWeight: 500,
              whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
          >
            Restablecer
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !mensaje.trim()}
            style={{
              flex: 1, padding: '8px 14px',
              background: enviando || !mensaje.trim() ? t.border : '#25D366',
              color: enviando || !mensaje.trim() ? t.textMuted : '#fff',
              border: 'none', borderRadius: 9,
              fontSize: 13, fontWeight: 700,
              cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar por WhatsApp'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function Seguimientos() {
  const isMobile = useIsMobile()
  const { t }    = useTheme()

  const ESTADO_CFG = {
    pendiente:  { bg: t.yellowBg, text: t.yellow },
    enviado:    { bg: t.blueBg,   text: t.blue   },
    respondido: { bg: t.greenBg,  text: t.greenDark },
  }
  const CLASIF_CFG = {
    positivo: { bg: t.greenBg,  text: t.greenDark },
    neutral:  { bg: t.surfaceHover, text: t.textSec },
    negativo: { bg: t.redBg,    text: t.red },
  }

  const [seguimientos,  setSeguimientos]  = useState([])
  const [filtro,        setFiltro]        = useState('')
  const [cargando,      setCargando]      = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [chat,          setChat]          = useState(null)
  const [cargandoChat,  setCargandoChat]  = useState(false)
  const [mensaje,       setMensaje]       = useState('')
  const [guia,          setGuia]          = useState('')
  const [enviando,      setEnviando]      = useState(false)
  const [exito,         setExito]         = useState(false)
  const [planPermite,   setPlanPermite]   = useState(true)
  const chatEndRef = useRef(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await getSeguimientos(filtro || null)
      setSeguimientos(res.data)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => {
    getStats().then(r => setPlanPermite(r.data?.plan_seguimiento !== false)).catch(() => {})
  }, [])

  useEffect(() => { cargar() }, [filtro])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chat) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [chat])

  const abrirChat = async (seg) => {
    if (selected?.id === seg.id) return
    setSelected(seg)
    setChat(null)
    setExito(false)
    setGuia('')
    setCargandoChat(true)
    try {
      const res = await getSeguimientoChat(seg.id)
      setChat(res.data)
      setMensaje(res.data.sugerido || '')
    } catch (e) { console.error(e) }
    finally { setCargandoChat(false) }
  }

  const handleEnviar = async () => {
    if (!mensaje.trim() || enviando) return
    setEnviando(true)
    try {
      await enviarMensajeSeguimiento(selected.id, mensaje.trim(), guia.trim() || null)
      setExito(true)
      setMensaje('')
      setGuia('')
      cargar()
      const res = await getSeguimientoChat(selected.id)
      setChat(res.data)
    } catch (e) {
      alert('No se pudo enviar. Verificá la conexión con WhatsApp.')
    } finally { setEnviando(false) }
  }

  const conteos = CARD_DEFS.reduce((acc, c) => {
    acc[c.key] = seguimientos.filter(s => s.estado === c.key).length
    return acc
  }, {})

  // ── MOBILE: si hay seleccionado, muestra solo el chat ─────────────────────
  if (isMobile && selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: t.bg, fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
        <div style={{
          padding: '12px 16px', background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => { setSelected(null); setChat(null) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: t.accent, padding: 0 }}
          >
            ←
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: t.accentBg, color: t.accentText,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>
            {selected.cliente_nombre?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{selected.cliente_nombre}</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>{selected.pedido_codigo}</div>
          </div>
          {selected.clasificacion && (
            <div style={{ marginLeft: 'auto' }}>
              <Badge
                label={selected.clasificacion}
                bg={CLASIF_CFG[selected.clasificacion]?.bg}
                text={CLASIF_CFG[selected.clasificacion]?.text}
              />
            </div>
          )}
        </div>
        <ChatPanel
          chat={chat} cargandoChat={cargandoChat}
          mensaje={mensaje} setMensaje={setMensaje}
          guia={guia} setGuia={setGuia}
          enviando={enviando} exito={exito}
          handleEnviar={handleEnviar}
          chatEndRef={chatEndRef}
          t={t}
        />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Seguimiento post-venta"
        subtitle="Mensajes 24h después de entregar un pedido"
        action={
          <button onClick={cargar} style={{
            padding: '7px 16px', background: t.accent, color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            fontFamily: 'inherit',
          }}>
            Actualizar
          </button>
        }
      />

      <div style={{ padding: isMobile ? 14 : 20 }}>

        {!planPermite ? (
          <div style={{
            background: t.yellowBg, border: `1px solid ${t.yellow}44`,
            borderRadius: 14, padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.yellow, marginBottom: 6 }}>
              Seguimiento post-venta no disponible en tu plan
            </div>
            <div style={{ fontSize: 13, color: t.yellow, maxWidth: 400, margin: '0 auto' }}>
              Esta función está disponible en los planes <strong>Pro</strong> y <strong>Enterprise</strong>.
            </div>
          </div>
        ) : (
          <>
            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {CARD_DEFS.map(card => {
                const active = filtro === card.key
                const cfg    = ESTADO_CFG[card.key]
                return (
                  <div key={card.key} onClick={() => setFiltro(active ? '' : card.key)} style={{
                    background: active ? cfg.bg : t.surface,
                    border: `1.5px solid ${active ? cfg.text + '44' : t.border}`,
                    borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                    transition: 'all 0.15s', boxShadow: t.shadow,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: active ? cfg.text : t.text }}>
                      {conteos[card.key] ?? 0}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginTop: 2 }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{card.desc}</div>
                  </div>
                )
              })}
            </div>

            {/* Filtros */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, boxShadow: t.shadow }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ESTADOS.map(e => (
                  <button key={e.value} onClick={() => setFiltro(e.value)} style={{
                    padding: '5px 14px', borderRadius: 20, border: `1.5px solid`,
                    borderColor: filtro === e.value ? t.accent : t.border,
                    background:  filtro === e.value ? t.accentBg : t.surfaceHover,
                    color:       filtro === e.value ? t.accentText : t.textMuted,
                    cursor: 'pointer', fontSize: 12, fontWeight: filtro === e.value ? 700 : 400,
                    fontFamily: 'inherit',
                  }}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout desktop */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: selected && !isMobile ? '340px 1fr' : '1fr',
              gap: 14, alignItems: 'start',
            }}>
              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cargando ? (
                  <div style={{ textAlign: 'center', padding: 48, color: t.textMuted, fontSize: 14 }}>Cargando...</div>
                ) : seguimientos.length === 0 ? (
                  <div style={{
                    background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                    padding: 48, textAlign: 'center', color: t.textMuted, fontSize: 14,
                    boxShadow: t.shadow,
                  }}>
                    No hay seguimientos{filtro ? ` con estado "${filtro}"` : ''}.
                  </div>
                ) : seguimientos.map(s => {
                  const activo = selected?.id === s.id
                  return (
                    <div key={s.id} onClick={() => abrirChat(s)} style={{
                      background: activo ? t.accentBg : t.surface,
                      border: `1.5px solid ${activo ? t.accent + '44' : t.border}`,
                      borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                      transition: 'all 0.15s', boxShadow: t.shadow,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{s.cliente_nombre}</div>
                          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                            {s.pedido_codigo} · Q{(s.pedido_total || 0).toFixed(0)}
                          </div>
                          {s.respuesta && (
                            <div style={{ fontSize: 11, color: t.textSec, marginTop: 5, fontStyle: 'italic' }}>
                              "{s.respuesta.slice(0, 60)}{s.respuesta.length > 60 ? '…' : ''}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <Badge label={s.estado} bg={ESTADO_CFG[s.estado]?.bg} text={ESTADO_CFG[s.estado]?.text} />
                          {s.clasificacion && (
                            <Badge label={s.clasificacion} bg={CLASIF_CFG[s.clasificacion]?.bg} text={CLASIF_CFG[s.clasificacion]?.text} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Panel de chat — solo desktop */}
              {selected && !isMobile && (
                <div style={{
                  background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
                  display: 'flex', flexDirection: 'column',
                  height: 'calc(100vh - 220px)', minHeight: 480,
                  position: 'sticky', top: 20, boxShadow: t.shadowMd,
                }}>
                  <div style={{
                    padding: '14px 18px', borderBottom: `1px solid ${t.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: t.accentBg, color: t.accentText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700,
                      }}>
                        {selected.cliente_nombre?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{selected.cliente_nombre}</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>{selected.cliente_wa} · {selected.pedido_codigo}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {selected.clasificacion && (
                        <Badge label={selected.clasificacion} bg={CLASIF_CFG[selected.clasificacion]?.bg} text={CLASIF_CFG[selected.clasificacion]?.text} />
                      )}
                      <button onClick={() => { setSelected(null); setChat(null) }} style={{
                        background: t.surfaceHover, border: `1px solid ${t.border}`,
                        borderRadius: 8, width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, cursor: 'pointer', color: t.textMuted,
                      }}>✕</button>
                    </div>
                  </div>
                  <ChatPanel
                    chat={chat} cargandoChat={cargandoChat}
                    mensaje={mensaje} setMensaje={setMensaje}
                    enviando={enviando} exito={exito}
                    handleEnviar={handleEnviar}
                    chatEndRef={chatEndRef}
                    t={t}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
