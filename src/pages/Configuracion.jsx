import { useState, useEffect, useRef } from 'react'
import { getConfiguracion, subirLogo, agregarMetodoPago, actualizarMetodoPago, eliminarMetodoPago, actualizarConfigNegocio, generarSlugCatalogo, actualizarCatalogo, actualizarCredencialesWA, actualizarContextoAgente, actualizarNotificaciones, testWhatsapp } from '../api/client'
import PageHeader from '../components/PageHeader'
import ProtectedImage from '../components/ProtectedImage'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'

const PLANTILLAS_CONTEXTO = [
  {
    tipo: '📷 Seguridad / Cámaras',
    texto: `Somos una empresa guatemalteca de seguridad electrónica con [X] años de experiencia.
Vendemos e instalamos cámaras de seguridad HIKVISION y Dahua en casas y negocios.
Nuestras cámaras SÍ se pueden ver en tiempo real desde el celular con la app Hik-Connect (Android e iOS).
La instalación tarda entre 2 y 4 horas según la cantidad de cámaras.
Ofrecemos garantía de 1 año en equipos y 3 meses en instalación.
Trabajamos en toda la ciudad de Guatemala (zona 1 a zona 18) y municipios cercanos.
Los técnicos coordinan la visita por WhatsApp antes de ir.`,
  },
  {
    tipo: '👗 Ropa / Moda',
    texto: `Somos una tienda de ropa con envíos a toda la república de Guatemala.
Manejamos tallas XS hasta XL (algunas prendas llegan a XXL).
Envíos dentro de Guatemala capital: 1-2 días hábiles.
Al interior del país por Guatex o Forza: 2-4 días hábiles.
Aceptamos cambios o devoluciones dentro de los 7 días si la ropa no fue usada y tiene empaque original.
Los precios incluyen IVA, no hay cobros ocultos.`,
  },
  {
    tipo: '🎂 Repostería / Pastelería',
    texto: `Somos una pastelería artesanal en Guatemala.
Los pedidos se hacen con mínimo 48 horas de anticipación (pasteles especiales: 72 horas).
Hacemos entregas en [zonas/municipios] o el cliente puede recoger en nuestro local en [dirección].
Los pasteles se conservan en refrigeración de 3 a 4 días.
Para bodas y eventos manejamos presupuesto personalizado según diseño y cantidad de porciones.
Los sabores disponibles están en nuestro catálogo. Podemos personalizar decoración con foto.`,
  },
  {
    tipo: '💆 Salud / Belleza',
    texto: `Somos un salón de belleza ubicado en [dirección], Guatemala.
Atendemos con cita previa de lunes a sábado de 9am a 7pm.
Servicios disponibles: cortes, tintes, alaciados, manicure, pedicure y tratamientos capilares.
Las citas se pueden cancelar o reprogramar con 2 horas de anticipación sin costo.
Usamos productos profesionales de marcas reconocidas.
El tiempo de cada servicio varía; al agendar te decimos cuánto esperar.`,
  },
  {
    tipo: '🔧 Ferretería / Construcción',
    texto: `Somos una ferretería en [ubicación], Guatemala, con más de [X] años en el mercado.
Vendemos materiales de construcción, herramientas, fontanería, electricidad y pintura.
Ofrecemos entrega a domicilio en [zonas] con pedidos mínimos de Q[monto].
Manejamos precios al por mayor para constructores y contratistas (pedir cotización).
Nuestro horario de atención es de lunes a sábado de 7am a 6pm y domingos de 8am a 1pm.
Los precios pueden variar según el mercado de materiales.`,
  },
  {
    tipo: '🍔 Comida / Restaurante',
    texto: `Somos un restaurante de [tipo de comida] en [ubicación], Guatemala.
Atendemos pedidos para recoger y entrega a domicilio en [zonas].
El tiempo de preparación es de [X] a [X] minutos aproximadamente.
Entrega a domicilio tiene costo de Q[X] según la zona.
Nuestro horario: [días y horas].
Para pedidos grandes o eventos contactar con anticipación para reservar.`,
  },
]

const TIPOS_PAGO = [
  { value: 'transferencia',  label: 'Transferencia bancaria' },
  { value: 'bi_transfer',    label: 'BI Transfer' },
  { value: 'banrural_movil', label: 'Banrural Móvil' },
  { value: 'cuik_qr',        label: 'Cuik QR' },
  { value: 'otro',           label: 'Otro' },
]

const VACIO_METODO = { tipo: 'transferencia', nombre_banco: '', numero_cuenta: '', nombre_titular: '', tipo_cuenta: 'ahorro', instrucciones: '' }

export default function Configuracion() {
  const isMobile = useIsMobile()
  const { t }    = useTheme()
  const [config,       setConfig]       = useState(null)
  const [loading,      setLoad]         = useState(true)
  const [subiendo,     setSubiendo]     = useState(false)
  const [modal,        setModal]        = useState(false)
  const [form,         setForm]         = useState(VACIO_METODO)
  const [saving,       setSaving]       = useState(false)
  const [nombreEdit,   setNombreEdit]   = useState('')
  const [prefijoEdit,  setPrefijoEdit]  = useState('')
  const [savingNombre,   setSavingNombre]   = useState(false)
  const [nombreOk,       setNombreOk]       = useState(false)
  const [generandoSlug,  setGenerandoSlug]  = useState(false)
  const [waEdit,         setWaEdit]         = useState('')
  const [colorEdit,      setColorEdit]      = useState('#22C55E')
  const [savingCatalogo, setSavingCatalogo] = useState(false)
  const [catalogoOk,     setCatalogoOk]     = useState(false)
  const [waToken,          setWaToken]          = useState('')
  const [waPhoneId,        setWaPhoneId]        = useState('')
  const [savingWA,         setSavingWA]         = useState(false)
  const [waOk,             setWaOk]             = useState(false)
  const [waError,          setWaError]          = useState('')
  const [testNumero,       setTestNumero]       = useState('')
  const [testando,         setTestando]         = useState(false)
  const [testResult,       setTestResult]       = useState(null)
  const [contextoEdit,     setContextoEdit]     = useState('')
  const [savingContexto,   setSavingContexto]   = useState(false)
  const [contextoOk,       setContextoOk]       = useState(false)
  const [plantillaActiva,  setPlantillaActiva]  = useState(null)
  const [notifWa,          setNotifWa]          = useState('')
  const [savingNotif,      setSavingNotif]      = useState(false)
  const [notifOk,          setNotifOk]          = useState(false)
  const logoRef = useRef()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoad(true)
    try {
      const { data } = await getConfiguracion()
      const catalogo_url = data.catalogo_slug
        ? `${window.location.origin}/tienda/${data.catalogo_slug}`
        : null
      setConfig({ ...data, catalogo_url })
      setNombreEdit(data.nombre_negocio || '')
      setPrefijoEdit(data.pedido_prefijo || 'PED')
      setWaEdit(data.whatsapp_negocio || '')
      setColorEdit(data.color_catalogo || '#22C55E')
      setContextoEdit(data.contexto_negocio || '')
      setNotifWa(data.notif_whatsapp || '')
    } catch(e) { console.error(e) }
    finally { setLoad(false) }
  }

  const handleGuardarNombre = async () => {
    if (!nombreEdit.trim()) return
    setSavingNombre(true)
    setNombreOk(false)
    try {
      const prefijo = prefijoEdit.trim().toUpperCase() || 'PED'
      await actualizarConfigNegocio({ nombre_negocio: nombreEdit.trim(), pedido_prefijo: prefijo })
      setConfig(prev => ({ ...prev, nombre_negocio: nombreEdit.trim(), pedido_prefijo: prefijo }))
      setPrefijoEdit(prefijo)
      setNombreOk(true)
      setTimeout(() => setNombreOk(false), 3000)
    } catch(e) {
      console.error(e)
      alert(`Error al guardar: ${e?.response?.data?.detail || 'Intentá de nuevo'}`)
    }
    finally { setSavingNombre(false) }
  }

  const handleLogo = async (file) => {
    if (!file) return
    setSubiendo(true)
    try {
      await subirLogo(file)
      await cargar()
    } catch(e) { console.error(e) }
    finally { setSubiendo(false) }
  }

  const abrirNuevo = () => { setForm(VACIO_METODO); setModal('nuevo') }
  const abrirEditar = (m) => {
    setForm({ tipo: m.tipo, nombre_banco: m.nombre_banco || '', numero_cuenta: m.numero_cuenta || '',
              nombre_titular: m.nombre_titular || '', tipo_cuenta: m.tipo_cuenta || 'ahorro', instrucciones: m.instrucciones || '' })
    setModal({ id: m.id })
  }

  const handleGuardar = async () => {
    if (!form.nombre_banco || !form.numero_cuenta || !form.nombre_titular) return
    setSaving(true)
    try {
      if (modal === 'nuevo') {
        await agregarMetodoPago(form)
      } else {
        await actualizarMetodoPago(modal.id, form)
      }
      setModal(false)
      setForm(VACIO_METODO)
      await cargar()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este método de pago?')) return
    try {
      await eliminarMetodoPago(id)
      await cargar()
    } catch(e) { console.error(e) }
  }

  const handleGuardarWA = async () => {
    if (!waToken.trim() && !waPhoneId.trim()) return
    setSavingWA(true)
    setWaOk(false)
    setWaError('')
    try {
      const body = {}
      if (waToken.trim())  body.whatsapp_token  = waToken.trim()
      if (waPhoneId.trim()) body.phone_number_id = waPhoneId.trim()
      await actualizarCredencialesWA(body)
      setWaToken('')
      setWaOk(true)
      setTimeout(() => setWaOk(false), 4000)
    } catch(e) {
      setWaError(e?.response?.data?.detail || 'Error al guardar. Verificá los datos.')
    }
    finally { setSavingWA(false) }
  }

  const handleTestWA = async () => {
    if (!testNumero.trim()) return
    setTestando(true)
    setTestResult(null)
    try {
      const { data } = await testWhatsapp(testNumero.trim())
      setTestResult(data)
    } catch(e) {
      setTestResult({ ok: false, error: e?.response?.data?.error || e?.response?.data?.detail || 'Error inesperado' })
    } finally { setTestando(false) }
  }

  const handleGuardarContexto = async () => {
    setSavingContexto(true)
    setContextoOk(false)
    try {
      await actualizarContextoAgente({ contexto_negocio: contextoEdit.trim() })
      setContextoOk(true)
      setTimeout(() => setContextoOk(false), 3000)
    } catch(e) {
      alert(`Error al guardar: ${e?.response?.data?.detail || 'Intentá de nuevo'}`)
    } finally { setSavingContexto(false) }
  }

  const handleGuardarNotif = async () => {
    setSavingNotif(true)
    setNotifOk(false)
    try {
      await actualizarNotificaciones({ notif_whatsapp: notifWa.trim() })
      setConfig(prev => ({ ...prev, notif_whatsapp: notifWa.trim() }))
      setNotifOk(true)
      setTimeout(() => setNotifOk(false), 3000)
    } catch(e) {
      alert(`Error al guardar: ${e?.response?.data?.detail || 'Intentá de nuevo'}`)
    } finally { setSavingNotif(false) }
  }

  const handleGuardarCatalogo = async () => {
    setSavingCatalogo(true)
    setCatalogoOk(false)
    try {
      await actualizarCatalogo({ whatsapp_negocio: waEdit, color_catalogo: colorEdit })
      setCatalogoOk(true)
      setTimeout(() => setCatalogoOk(false), 3000)
    } catch(e) { alert('Error al guardar') }
    finally { setSavingCatalogo(false) }
  }

  const labelStyle = { fontSize: 11, fontWeight: 600, color: t.textSec, display: 'block', marginBottom: 4 }
  const inputStyle = {
    width: '100%', padding: '8px 11px', border: `1.5px solid ${t.border}`,
    borderRadius: 9, fontSize: 13, color: t.text, background: t.bg,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const btnPrimary = {
    background: t.accent, color: '#fff', border: 'none',
    padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnSecondary = {
    background: t.surfaceHover, color: t.textSec, border: `1px solid ${t.border}`,
    padding: '7px 12px', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.textMuted, fontSize: 13 }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader title="Configuración" subtitle="Logo y cuentas de pago de tu tienda" />

      {/* MODAL agregar/editar método */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: isMobile ? '20px 20px 0 0' : 16,
              width: '100%', maxWidth: isMobile ? 430 : 480,
              boxShadow: t.shadowLg, border: `1px solid ${t.border}`,
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '12px auto 4px' }} />}
            <div style={{ padding: isMobile ? '12px 20px 14px' : '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{modal === 'nuevo' ? 'Agregar cuenta de pago' : 'Editar cuenta de pago'}</span>
              <button onClick={() => setModal(false)} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: t.textMuted }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Tipo de pago</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                  {TIPOS_PAGO.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Banco / Servicio *</label>
                  <input value={form.nombre_banco} onChange={e => setForm({ ...form, nombre_banco: e.target.value })} placeholder="Ej: Banrural" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de cuenta</label>
                  <select value={form.tipo_cuenta} onChange={e => setForm({ ...form, tipo_cuenta: e.target.value })} style={inputStyle}>
                    <option value="ahorro">Ahorro</option>
                    <option value="monetaria">Monetaria</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Número de cuenta *</label>
                <input value={form.numero_cuenta} onChange={e => setForm({ ...form, numero_cuenta: e.target.value })} placeholder="0000-0000-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nombre del titular *</label>
                <input value={form.nombre_titular} onChange={e => setForm({ ...form, nombre_titular: e.target.value })} placeholder="Juan López" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Instrucciones adicionales</label>
                <textarea value={form.instrucciones} onChange={e => setForm({ ...form, instrucciones: e.target.value })} placeholder="Ej: Enviar comprobante por WhatsApp" style={{ ...inputStyle, height: 64, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setModal(false)} style={btnSecondary}>Cancelar</button>
                <button onClick={handleGuardar} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
                  {saving ? 'Guardando...' : (modal === 'nuevo' ? 'Agregar cuenta' : 'Guardar cambios')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 16 }}>

        {/* Nombre del negocio + Prefijo */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Nombre del negocio</div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
            Es el nombre que el agente usará para presentarse con tus clientes por WhatsApp.
          </p>
          <input
            value={nombreEdit}
            onChange={e => { setNombreEdit(e.target.value); setNombreOk(false) }}
            onKeyDown={e => e.key === 'Enter' && handleGuardarNombre()}
            placeholder="Nombre de tu tienda..."
            maxLength={100}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <div style={{ height: 1, background: t.border, margin: '0 0 16px' }} />

          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Prefijo de código de pedido</div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
            Prefijo que aparece en cada código de pedido.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input
              value={prefijoEdit}
              onChange={e => { setPrefijoEdit(e.target.value.toUpperCase()); setNombreOk(false) }}
              onKeyDown={e => e.key === 'Enter' && handleGuardarNombre()}
              placeholder="PED"
              maxLength={20}
              style={{ ...inputStyle, width: 110, fontFamily: 'monospace', letterSpacing: '0.06em' }}
            />
            <span style={{ fontSize: 12, color: t.textSec, background: t.bg, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.border}`, fontFamily: 'monospace' }}>
              {(prefijoEdit || 'PED').toUpperCase()}-12345
            </span>
          </div>

          {config && (
            <>
              <div style={{ height: 1, background: t.border, margin: '0 0 16px' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Tu catálogo público</div>
              {config.plan_catalogo ? (
                <>
                  <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                    Compartí este link en TikTok, Instagram o WhatsApp para que tus clientes puedan ver y pedir tus productos.
                  </p>
                  {config.catalogo_url ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{
                        flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 8,
                        border: `1px solid ${t.border}`, background: t.bg,
                        fontSize: 12, color: t.accentText, fontFamily: 'monospace',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {config.catalogo_url}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(config.catalogo_url)}
                        style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, fontSize: 12, fontWeight: 600, color: t.textSec, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                      >
                        Copiar
                      </button>
                      <a href={config.catalogo_url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${t.accent}33`, background: t.accentBg, fontSize: 12, fontWeight: 600, color: t.accentText, textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        Ver tienda →
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: t.textMuted }}>Tu catálogo aún no tiene una dirección web.</span>
                      <button
                        onClick={async () => {
                          setGenerandoSlug(true)
                          try {
                            const { data } = await generarSlugCatalogo()
                            const catalogo_url = `${window.location.origin}/tienda/${data.slug}`
                            setConfig(prev => ({ ...prev, slug: data.slug, catalogo_slug: data.slug, catalogo_url, plan_catalogo: true }))
                          } catch(e) { alert('Error al generar el catálogo') }
                          finally { setGenerandoSlug(false) }
                        }}
                        disabled={generandoSlug}
                        style={{ ...btnPrimary, opacity: generandoSlug ? 0.6 : 1 }}
                      >
                        {generandoSlug ? 'Generando...' : 'Activar catálogo'}
                      </button>
                    </div>
                  )}

                  {/* Config del catálogo */}
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Número WhatsApp del agente IA</label>
                      <p style={{ fontSize: 11, color: t.textMuted, margin: '0 0 6px' }}>
                        El número donde el agente IA responde (sin + ni espacios, ej: 50236106865)
                      </p>
                      <input
                        value={waEdit}
                        onChange={e => setWaEdit(e.target.value)}
                        placeholder="502XXXXXXXX"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Color principal del catálogo</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="color" value={colorEdit} onChange={e => setColorEdit(e.target.value)}
                          style={{ width: 42, height: 36, borderRadius: 8, border: `1px solid ${t.border}`, cursor: 'pointer', padding: 2 }} />
                        <span style={{ fontSize: 12, color: t.textSec, fontFamily: 'monospace' }}>{colorEdit}</span>
                      </div>
                    </div>
                    <button onClick={handleGuardarCatalogo} disabled={savingCatalogo}
                      style={{ ...btnPrimary, width: 'fit-content', opacity: savingCatalogo ? 0.6 : 1 }}>
                      {savingCatalogo ? 'Guardando...' : 'Guardar configuración del catálogo'}
                    </button>
                    {catalogoOk && <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>✓ Guardado</span>}
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 10, border: `1.5px dashed ${t.border}`, background: t.bg,
                }}>
                  <span style={{ fontSize: 22 }}>🔒</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 3 }}>
                      Catálogo web disponible en Plan Pro
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
                      Con el Plan Pro tus clientes pueden ver tus productos en una tienda web y pedirte directo por WhatsApp.
                    </div>
                  </div>
                  <a href="/dashboard/suscripcion"
                    style={{ padding: '8px 14px', borderRadius: 8, background: t.accent, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Ver planes →
                  </a>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: config?.catalogo_url ? 16 : 0 }}>
            <button
              onClick={handleGuardarNombre}
              disabled={savingNombre || !nombreEdit.trim()}
              style={{ ...btnPrimary, opacity: !nombreEdit.trim() ? 0.5 : 1 }}
            >
              {savingNombre ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {nombreOk && (
              <span style={{ fontSize: 13, color: t.accent, fontWeight: 700 }}>
                ✓ Guardado correctamente
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 16, alignItems: 'start' }}>

          {/* Logo */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Logo de la tienda</div>
            <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
              Aparece en el panel. Formatos: JPG, PNG, SVG. Recomendado: 200×200px.
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                onClick={() => logoRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: 14,
                  background: t.bg, border: `2px dashed ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                }}
              >
                {config?.logo_url ? (
                  <ProtectedImage
                    serverPath={config.logo_url}
                    alt="logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={<span style={{ fontSize: 28 }}>🏪</span>}
                  />
                ) : (
                  <span style={{ fontSize: 28 }}>🏪</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>{config?.nombre_negocio}</div>
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={subiendo}
                  style={btnPrimary}
                >
                  {subiendo ? 'Subiendo...' : 'Cambiar logo'}
                </button>
              </div>
            </div>
            <input type="file" accept="image/*" ref={logoRef} style={{ display: 'none' }} onChange={e => handleLogo(e.target.files[0])} />
          </div>

          {/* Cuentas de pago */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Cuentas de pago</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>El agente las usa para indicar dónde depositar</div>
              </div>
              <button onClick={abrirNuevo} style={btnPrimary}>+ Agregar</button>
            </div>

            {(!config?.metodos_pago || config.metodos_pago.length === 0) && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: t.textMuted, fontSize: 12 }}>
                Sin cuentas configuradas. Agregá una para recibir pagos.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config?.metodos_pago?.map(m => (
                <div key={m.id} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{m.nombre_banco}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.accentBg, color: t.accentText, fontWeight: 600 }}>
                          {TIPOS_PAGO.find(tp => tp.value === m.tipo)?.label || m.tipo}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.surfaceHover, color: t.textMuted, border: `1px solid ${t.border}` }}>
                          {m.tipo_cuenta}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: t.textSec, marginBottom: 2 }}>No. {m.numero_cuenta}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>Titular: {m.nombre_titular}</div>
                      {m.instrucciones && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{m.instrucciones}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => abrirEditar(m)}
                        style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 8, padding: '5px 8px', color: t.accentText, cursor: 'pointer', fontSize: 13 }}
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => handleEliminar(m.id)}
                        style={{ background: t.redBg, border: `1px solid ${t.red}33`, borderRadius: 8, padding: '5px 8px', color: t.red, cursor: 'pointer', fontSize: 13 }}
                        title="Eliminar"
                      >🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Conocimiento del agente */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Conocimiento del agente</div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 14px', lineHeight: 1.6 }}>
            Escribí aquí todo lo que el agente debe saber sobre tu negocio: qué vendés, cómo trabajás, tiempos de entrega, garantías, zonas de cobertura, preguntas frecuentes, etc.
            <br />El agente usará esto para responder preguntas de tus clientes sin improvisar.
          </p>

          {/* Cómo funciona */}
          <div style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.accentText, marginBottom: 6 }}>¿Cómo implementarlo?</div>
            <ol style={{ fontSize: 12, color: t.accentText, margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Elegí una plantilla según tu rubro y hacé clic en ella.</li>
              <li>Reemplazá los <strong>[corchetes]</strong> con la info real de tu negocio.</li>
              <li>Agregá cualquier pregunta frecuente que te hacen los clientes.</li>
              <li>Guardá los cambios — el agente lo usa desde el siguiente mensaje.</li>
            </ol>
          </div>

          {/* Plantillas */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Plantillas por rubro
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLANTILLAS_CONTEXTO.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setContextoEdit(p.texto)
                    setPlantillaActiva(i)
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: plantillaActiva === i ? t.accent : t.bg,
                    color:      plantillaActiva === i ? '#fff'    : t.textSec,
                    border: `1.5px solid ${plantillaActiva === i ? t.accent : t.border}`,
                  }}
                >
                  {p.tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={contextoEdit}
            onChange={e => { setContextoEdit(e.target.value); setPlantillaActiva(null) }}
            placeholder={`Ejemplo:\nSomos una tienda de ropa en Guatemala.\nEnvíos a toda la república en 2-4 días.\nAceptamos cambios dentro de los 7 días...`}
            style={{
              ...inputStyle,
              height: 220,
              resize: 'vertical',
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
            maxLength={3000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>{contextoEdit.length}/3000 caracteres</span>
            {contextoEdit !== (config?.contexto_negocio || '') && (
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>● Sin guardar</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleGuardarContexto}
              disabled={savingContexto}
              style={{ ...btnPrimary, opacity: savingContexto ? 0.6 : 1 }}
            >
              {savingContexto ? 'Guardando...' : 'Guardar conocimiento'}
            </button>
            {contextoOk && <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>✓ Guardado</span>}
          </div>
        </div>

        {/* Número de notificaciones */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Número para notificaciones</div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 14px', lineHeight: 1.6 }}>
            Cuando el agente cierre una venta, recibas un comprobante o el stock esté bajo, te avisamos a este número por WhatsApp.
            Si lo dejás vacío, las alertas van al número con el que iniciás sesión.
          </p>

          <div style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.accentText, marginBottom: 4 }}>¿Qué notificaciones recibís?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { ico: '🛒', txt: 'Nuevo pedido cerrado por el agente' },
                { ico: '💳', txt: 'Comprobante de pago recibido — listo para confirmar' },
                { ico: '📦', txt: 'Pedido contra entrega confirmado — para preparar envío' },
                { ico: '⚠️', txt: 'Stock bajo (≤5 unidades) o producto agotado' },
              ].map(n => (
                <div key={n.ico} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>{n.ico}</span>
                  <span style={{ fontSize: 12, color: t.accentText }}>{n.txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Número WhatsApp (sin + ni espacios)</label>
              <input
                value={notifWa}
                onChange={e => { setNotifWa(e.target.value.replace(/[^0-9]/g, '')); setNotifOk(false) }}
                placeholder="502XXXXXXXX"
                maxLength={20}
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.04em' }}
              />
            </div>
            <button
              onClick={handleGuardarNotif}
              disabled={savingNotif}
              style={{ ...btnPrimary, opacity: savingNotif ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              {savingNotif ? 'Guardando...' : 'Guardar número'}
            </button>
          </div>

          {notifOk && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: t.accent, fontWeight: 700 }}>✓ Número guardado correctamente</span>
            </div>
          )}

          {config?.notif_whatsapp && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>Notificaciones activas →</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'monospace' }}>
                +{config.notif_whatsapp}
              </span>
              <button
                onClick={() => { setNotifWa(''); handleGuardarNotif() }}
                style={{ fontSize: 11, color: t.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Credenciales de WhatsApp */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: t.shadow }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Credenciales de WhatsApp</div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 14px', lineHeight: 1.6 }}>
            Actualizá tu token de Meta cuando el anterior expire. Obtenelo desde{' '}
            <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer"
              style={{ color: t.accentText, fontWeight: 600 }}>business.facebook.com</a>
            {' '}→ Configuración → Usuarios del sistema → Token permanente.
          </p>

          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B33', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
              Dejá en blanco los campos que no querás modificar. El token no se muestra por seguridad — si lo actualizás, escribilo completo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Phone Number ID</label>
              <p style={{ fontSize: 11, color: t.textMuted, margin: '0 0 6px' }}>
                Lo encontrás en Meta Developers → Tu App → WhatsApp → Getting Started
              </p>
              <input
                value={waPhoneId}
                onChange={e => setWaPhoneId(e.target.value)}
                placeholder="Ej: 123456789012345"
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.04em' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Token de acceso permanente</label>
              <input
                type="password"
                value={waToken}
                onChange={e => setWaToken(e.target.value)}
                placeholder="EAAx... (pegar el token completo)"
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                autoComplete="new-password"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleGuardarWA}
                disabled={savingWA || (!waToken.trim() && !waPhoneId.trim())}
                style={{ ...btnPrimary, opacity: (!waToken.trim() && !waPhoneId.trim()) ? 0.5 : 1 }}
              >
                {savingWA ? 'Guardando...' : 'Actualizar credenciales'}
              </button>
              {waOk && <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>✓ Credenciales actualizadas correctamente</span>}
              {waError && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{waError}</span>}
            </div>

            {/* Probar conexión */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>Probar conexión de WhatsApp</div>
              <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                Enviá un mensaje de prueba para verificar que las credenciales están funcionando correctamente.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={testNumero}
                  onChange={e => { setTestNumero(e.target.value); setTestResult(null) }}
                  placeholder="Ej: 50251234567 (sin +)"
                  style={{ ...inputStyle, maxWidth: 220 }}
                />
                <button
                  onClick={handleTestWA}
                  disabled={testando || !testNumero.trim()}
                  style={{ ...btnSecondary, opacity: testando || !testNumero.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                >
                  {testando ? 'Enviando...' : '📤 Enviar prueba'}
                </button>
              </div>
              {testResult && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 10,
                  background: testResult.ok ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testResult.ok ? '#86EFAC' : '#FCA5A5'}`,
                }}>
                  {testResult.ok ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                      ✅ {testResult.message}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
                        ❌ Error al enviar
                      </div>
                      <div style={{ fontSize: 12, color: '#7F1D1D', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                        {testResult.error}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
