import { useState, useEffect } from 'react'
import { getPrompt, actualizarPrompt, limpiarHistorial, getHistorialCliente } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

function Card({ children, style, t }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 16, boxShadow: t.shadow,
      ...style,
    }}>
      {children}
    </div>
  )
}

const SUGERENCIAS = [
  { label: 'Saludo amigable',   texto: 'Saluda siempre con entusiasmo y usá el nombre del cliente cuando lo sepas.' },
  { label: 'Manejo de precios', texto: 'Nunca des descuentos sin consultar al dueño del negocio.' },
  { label: 'Cierre de ventas',  texto: 'Cuando el cliente muestre interés, preguntá directamente si quiere apartar el producto.' },
  { label: 'Datos de entrega',  texto: 'Siempre pedí nombre completo y dirección exacta antes de confirmar el pedido.' },
  { label: 'Tono profesional',  texto: 'Mantené un tono amigable pero profesional. No uses jerga excesiva.' },
]

export default function Agente() {
  const isMobile  = useIsMobile()
  const { t }     = useTheme()
  const [prompt,      setPrompt]     = useState('')
  const [original,    setOrig]       = useState('')
  const [saving,      setSaving]     = useState(false)
  const [loading,     setLoad]       = useState(true)
  const [saved,       setSaved]      = useState(false)
  const [puedeEditar, setPuedeEditar] = useState(true)
  const [numLimpiar,  setNumLimpiar]  = useState('')
  const [limpiando,   setLimpiando]  = useState(false)
  const [msgLimpiar,  setMsgLimpiar] = useState('')
  const [numVer,      setNumVer]     = useState('')
  const [viendo,      setViendo]     = useState(false)
  const [historial,   setHistorial]  = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const { data } = await getPrompt()
      setPrompt(data.prompt || '')
      setOrig(data.prompt || '')
      setPuedeEditar(data.puede_editar !== false)
    } catch(e) { console.error(e) }
    finally { setLoad(false) }
  }

  const guardar = async () => {
    setSaving(true)
    try {
      await actualizarPrompt(prompt)
      setOrig(prompt)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleLimpiar = async () => {
    const num = numLimpiar.replace(/\D/g, '')
    if (!num) return
    setLimpiando(true)
    setMsgLimpiar('')
    try {
      await limpiarHistorial(num)
      setMsgLimpiar('✓ Historial limpiado')
      setNumLimpiar('')
    } catch(e) {
      setMsgLimpiar('Error al limpiar')
    } finally {
      setLimpiando(false)
      setTimeout(() => setMsgLimpiar(''), 3000)
    }
  }

  const handleVerHistorial = async () => {
    const num = numVer.replace(/\D/g, '')
    if (!num) return
    setViendo(true)
    setHistorial(null)
    try {
      const { data } = await getHistorialCliente(num)
      setHistorial(data)
    } catch(e) {
      setHistorial({ error: true })
    } finally { setViendo(false) }
  }

  const agregarSugerencia = (texto) => {
    setPrompt(prev => prev ? prev + '\n' + texto : texto)
  }

  const hayCambios = prompt !== original && puedeEditar

  const inp = {
    width: '100%', padding: '8px 10px', border: `1.5px solid ${t.border}`,
    borderRadius: 9, fontSize: 12, color: t.text,
    outline: 'none', boxSizing: 'border-box',
    background: t.bg, fontFamily: 'inherit',
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Agente IA"
        subtitle="Configurá el comportamiento de tu agente de ventas"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>✓ Guardado</span>}
            <button
              onClick={guardar}
              disabled={saving || !hayCambios || !puedeEditar}
              style={{
                background: hayCambios ? t.accent : t.surfaceHover,
                color:      hayCambios ? '#fff'   : t.textMuted,
                border:     hayCambios ? 'none'   : `1px solid ${t.border}`,
                padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                cursor: hayCambios ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        }
      />

      <div style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Fila 1: editor + sidebar sin inputs ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
          gap: 16,
          alignItems: 'start',
        }}>

          {/* Editor */}
          <div style={{ minWidth: 0 }}>
            {!puedeEditar && (
              <div style={{
                background: t.yellowBg, border: `1px solid ${t.yellow}44`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.yellow }}>Función no disponible en tu plan</div>
                  <div style={{ fontSize: 11, color: t.yellow, marginTop: 2, opacity: 0.8 }}>
                    El prompt personalizado está disponible en los planes Pro y Enterprise.
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadow }}>
              <div style={{
                padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Instrucciones del agente</span>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                    Definí cómo se comporta, qué puede y no puede hacer
                  </p>
                </div>
                {hayCambios && (
                  <span style={{ fontSize: 11, color: t.yellow, background: t.yellowBg, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                    Sin guardar
                  </span>
                )}
              </div>

              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: t.textMuted, fontSize: 13 }}>Cargando...</div>
              ) : (
                <textarea
                  value={prompt}
                  onChange={e => puedeEditar && setPrompt(e.target.value)}
                  readOnly={!puedeEditar}
                  style={{
                    width: '100%', minHeight: isMobile ? 240 : 420, padding: 16,
                    border: 'none', outline: 'none', resize: puedeEditar ? 'vertical' : 'none',
                    fontSize: 13, lineHeight: 1.7,
                    color:      puedeEditar ? t.text    : t.textMuted,
                    background: puedeEditar ? t.surface : t.bg,
                    boxSizing: 'border-box',
                    cursor:     puedeEditar ? 'text' : 'not-allowed',
                    fontFamily: 'inherit',
                  }}
                  placeholder={`Escribí las instrucciones para tu agente. Ejemplo:\n\nSos un agente de ventas. Tu nombre es Foxi.\nAtendés a clientes por WhatsApp de manera amigable.\nSiempre pedí nombre y dirección antes de confirmar un pedido.`}
                />
              )}

              <div style={{
                padding: '10px 16px', borderTop: `1px solid ${t.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>{prompt.length} caracteres</span>
                <button
                  onClick={() => setPrompt('')}
                  style={{ fontSize: 11, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{
              background: t.accentBg, border: `1px solid ${t.accent}33`,
              borderRadius: 12, padding: 14, marginTop: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.accentText, marginBottom: 8 }}>
                💡 Consejos para un mejor agente
              </div>
              <ul style={{ fontSize: 11, color: t.accentText, lineHeight: 1.8, paddingLeft: 16, margin: 0, opacity: 0.85 }}>
                <li>Indicá el nombre del negocio y del agente</li>
                <li>Definí el tono — formal, amigable, chapín</li>
                <li>Especificá qué puede y qué no puede hacer</li>
                <li>Mencioná si hay promociones o políticas especiales</li>
                <li>Indicá cómo manejar quejas o devoluciones</li>
              </ul>
            </div>
          </div>

          {/* Sidebar — solo contenido estático, sin inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Sugerencias */}
            <Card t={t}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                Instrucción rápida
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGERENCIAS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => agregarSugerencia(s.texto)}
                    style={{
                      background: t.bg, border: `1px solid ${t.border}`,
                      borderRadius: 9, padding: '9px 12px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentBg }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border;  e.currentTarget.style.background = t.bg }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 2 }}>+ {s.label}</div>
                    <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.4 }}>{s.texto.slice(0, 60)}...</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Estado */}
            <Card t={t}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>Estado del agente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.green }} />
                <span style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>Activo y respondiendo</span>
              </div>
              {[
                { label: 'Modelo',  value: 'Gemini Flash' },
                { label: 'Tools',   value: '6 herramientas' },
                { label: 'Memoria', value: 'En sesión' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: 11, color: t.textMuted }}>{r.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textSec }}>{r.value}</span>
                </div>
              ))}
            </Card>

            {/* Zona de cuidado */}
            <div style={{ background: t.redBg, border: `1px solid ${t.red}44`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.red, marginBottom: 8 }}>⚠ Zona de cuidado</div>
              <p style={{ fontSize: 11, color: t.red, lineHeight: 1.6, margin: '0 0 10px', opacity: 0.85 }}>
                Cambios en el prompt afectan inmediatamente las conversaciones activas.
              </p>
              <button
                onClick={() => setPrompt(original)}
                disabled={!hayCambios}
                style={{
                  width: '100%',
                  background: hayCambios ? t.redBg      : t.surfaceHover,
                  color:      hayCambios ? t.red         : t.textMuted,
                  border: `1px solid ${hayCambios ? t.red + '44' : t.border}`,
                  padding: '8px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  cursor: hayCambios ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                }}
              >
                Revertir cambios
              </button>
            </div>
          </div>
        </div>

        {/* ── Fila 2: herramientas con inputs — en la columna principal, flujo natural ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
        }}>

          {/* Ver conversación */}
          <Card t={t}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>Ver conversación</div>
            <p style={{ fontSize: 11, color: t.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
              Consultá el historial de mensajes de cualquier cliente.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={numVer}
                onChange={e => setNumVer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerHistorial()}
                placeholder="Ej: 50212345678"
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={handleVerHistorial}
                disabled={viendo || !numVer.replace(/\D/g, '')}
                style={{
                  padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  background: numVer.replace(/\D/g, '') ? t.blueBg      : t.surfaceHover,
                  color:      numVer.replace(/\D/g, '') ? t.blue         : t.textMuted,
                }}
              >
                {viendo ? '...' : 'Ver'}
              </button>
            </div>

            {historial && !historial.error && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 8 }}>
                  {historial.total} mensaje{historial.total !== 1 ? 's' : ''} — {historial.numero_cliente}
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {historial.mensajes.map(m => (
                    <div key={m.id} style={{ alignSelf: m.rol === 'user' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                      <div style={{
                        padding: '8px 12px', borderRadius: 12, fontSize: 11, lineHeight: 1.5,
                        background: m.rol === 'user' ? t.bg   : t.blueBg,
                        color:      m.rol === 'user' ? t.text : t.blue,
                        border: `1px solid ${t.border}`,
                      }}>
                        {m.contenido}
                      </div>
                      <div style={{ fontSize: 9, color: t.textMuted, marginTop: 2, textAlign: m.rol === 'user' ? 'left' : 'right' }}>
                        {m.rol === 'user' ? 'Cliente' : 'Agente'} · {m.created_at ? new Date(m.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {historial?.error && <div style={{ fontSize: 11, color: t.red, marginTop: 8 }}>Error al cargar el historial.</div>}
            {historial && historial.total === 0 && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>No hay mensajes para ese número.</div>}
          </Card>

          {/* Limpiar historial */}
          <Card t={t}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>Limpiar historial</div>
            <p style={{ fontSize: 11, color: t.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
              Borrá la conversación de un cliente para que el agente empiece desde cero.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={numLimpiar}
                onChange={e => setNumLimpiar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLimpiar()}
                placeholder="Ej: 50212345678"
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={handleLimpiar}
                disabled={limpiando || !numLimpiar.replace(/\D/g, '')}
                style={{
                  padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  background: numLimpiar.replace(/\D/g, '') ? t.yellowBg : t.surfaceHover,
                  color:      numLimpiar.replace(/\D/g, '') ? t.yellow   : t.textMuted,
                }}
              >
                {limpiando ? '...' : 'Limpiar'}
              </button>
            </div>
            {msgLimpiar && (
              <div style={{ fontSize: 12, marginTop: 10, fontWeight: 600, color: msgLimpiar.startsWith('✓') ? t.accent : t.red }}>
                {msgLimpiar}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
