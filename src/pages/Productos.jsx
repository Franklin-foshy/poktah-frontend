import { useState, useEffect, useRef } from 'react'
import {
  getProductos, crearProducto, actualizarProducto, subirFoto,
  agregarVariante, actualizarVariante, eliminarVariante,
  getImagenesProducto, subirImagenProducto, eliminarImagenProducto,
  actualizarStockSimple, getCategorias, crearCategoria, eliminarCategoria,
} from '../api/client'
import PageHeader from '../components/PageHeader'
import ProtectedImage from '../components/ProtectedImage'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'

// ─── CSV helper ───────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const parseRow = row => {
    const fields = []; let cur = '', inQ = false
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { inQ = !inQ }
      else if (row[i] === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
      else { cur += row[i] }
    }
    fields.push(cur.trim())
    return fields
  }
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), (parseRow(line)[i] ?? '').trim()]))
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPO_LABELS = {
  simple:        'Simple',
  con_variantes: 'Variantes',
  servicio:      'Servicio',
}

const NUEVO_INIT = {
  nombre: '', tipo: 'con_variantes',
  precio_venta: '', precio_costo: '',
  categorias_ids: [], descripcion: '',
  variante_label1: 'Talla', variante_label2: 'Color',
}
const VARIANTE_INIT = {
  producto_id: null, label1: '', label2: '',
  valor1: '', valor2: '', stock: 0,
  precio_venta: 0, precio_costo: '',
}

function getTipoBadge(tipo, t) {
  return {
    simple:        { bg: t.blueBg,   color: t.blue,   label: 'Simple'   },
    con_variantes: { bg: t.purpleBg, color: t.purple, label: 'Variantes'},
    servicio:      { bg: t.orangeBg, color: t.orange, label: 'Servicio' },
  }[tipo] || { bg: t.purpleBg, color: t.purple, label: tipo }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Productos() {
  const { t }    = useTheme()
  const isMobile = useIsMobile()

  const [productos,      setProductos]  = useState([])
  const [categorias,     setCategorias] = useState([])
  const [loading,        setLoad]       = useState(true)
  const [busqueda,       setBusqueda]   = useState('')
  const [filtroTipo,     setFiltroTipo] = useState('todos')
  const [filtroEstado,   setFiltroEst]  = useState('todos')
  const [modal,          setModal]      = useState(null)   // 'crear' | 'variante' | 'categorias'
  const [editando,       setEditando]   = useState(null)
  const [editData,       setEditData]   = useState({})
  const [subiendo,       setSubiendo]   = useState(null)
  const [expandido,      setExpandido]  = useState(null)
  const [nuevo,          setNuevo]      = useState(NUEVO_INIT)
  const [variante,       setVariante]   = useState(VARIANTE_INIT)
  const [saving,         setSaving]     = useState(false)
  const [cargando,       setCargando]   = useState(false)
  const [resultadoCarga, setResultado]  = useState(null)
  const [nuevoFotoPreview, setNuevoFotoPreview] = useState(null)
  const fileRef    = useRef({})
  const excelRef   = useRef(null)
  const newFotoRef = useRef(null)

  useEffect(() => {
    cargar()
    getCategorias().then(r => setCategorias(r.data)).catch(() => {})
  }, []) // eslint-disable-line

  const cargar = async () => {
    setLoad(true)
    try { const { data } = await getProductos(); setProductos(data) }
    catch(e) { console.error(e) }
    finally { setLoad(false) }
  }

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter(p => {
    const q = busqueda.toLowerCase()
    if (q && !p.nombre.toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false
    if (filtroTipo !== 'todos' && (p.tipo || 'con_variantes') !== filtroTipo) return false
    if (filtroEstado === 'activos' && !p.activo) return false
    if (filtroEstado === 'inactivos' && p.activo) return false
    return true
  })

  // ── Edición ───────────────────────────────────────────────────────────────
  const iniciarEdicion = (p) => {
    setEditando(p.id)
    setEditData({
      nombre: p.nombre, tipo: p.tipo || 'con_variantes',
      precio_venta: p.precio_venta ?? '', precio_costo: p.precio_costo ?? '',
      descripcion: p.descripcion || '', activo: p.activo,
      variante_label1: p.variante_label1 || '', variante_label2: p.variante_label2 || '',
      categorias_ids: (p.categorias || []).map(c => c.id),
    })
    setExpandido(null)
  }

  const guardarEdicion = async (id) => {
    setSaving(true)
    try {
      const pvEdit = parseFloat(editData.precio_venta)
      await actualizarProducto(id, {
        ...editData,
        precio_venta:   editData.tipo === 'con_variantes' ? null : (isNaN(pvEdit) ? null : pvEdit),
        precio_costo:   editData.precio_costo ? parseFloat(editData.precio_costo) : null,
        categorias_ids: editData.categorias_ids || [],
      })
      setEditando(null)
      await cargar()
    } catch(e) {
      alert(`Error al guardar: ${e?.response?.data?.detail || 'Intentá de nuevo'}`)
    } finally { setSaving(false) }
  }

  const toggleActivo = async (p) => {
    try { await actualizarProducto(p.id, { activo: !p.activo }); await cargar() }
    catch(e) { console.error(e) }
  }

  const handleFoto = async (id, file) => {
    if (!file) return
    setSubiendo(id)
    try { await subirFoto(id, file); await cargar() }
    catch(e) { console.error(e) }
    finally { setSubiendo(null) }
  }

  const cerrarModalCrear = () => {
    setModal(null)
    setNuevo(NUEVO_INIT)
    if (nuevoFotoPreview) { URL.revokeObjectURL(nuevoFotoPreview); setNuevoFotoPreview(null) }
  }

  const handleCrear = async () => {
    const pv = parseFloat(nuevo.precio_venta)
    if (!nuevo.nombre.trim()) return
    setSaving(true)
    try {
      const res = await crearProducto({
        nombre: nuevo.nombre.trim(), tipo: nuevo.tipo,
        precio_venta: isNaN(pv) ? null : pv,
        precio_costo: nuevo.precio_costo ? parseFloat(nuevo.precio_costo) : null,
        descripcion: nuevo.descripcion,
        variante_label1: nuevo.variante_label1, variante_label2: nuevo.variante_label2,
        categorias_ids: nuevo.categorias_ids || [],
      })
      if (nuevo.foto) {
        try { await subirFoto(res.data.id, nuevo.foto) } catch(e) {}
      }
      cerrarModalCrear()
      await cargar()
    } catch(e) {
      alert(`Error: ${e?.response?.data?.detail || 'Revisá los datos'}`)
    } finally { setSaving(false) }
  }

  const handleVariante = async () => {
    setSaving(true)
    try {
      await agregarVariante(variante.producto_id, {
        valor1: variante.valor1 || null, valor2: variante.valor2 || null,
        stock: parseInt(variante.stock) || 0,
        precio_venta: parseFloat(variante.precio_venta) || 0,
        precio_costo: variante.precio_costo ? parseFloat(variante.precio_costo) : null,
      })
      setModal(null); setVariante(VARIANTE_INIT); await cargar()
    } catch(e) {
      alert(`Error: ${e?.response?.data?.detail || 'No se pudo agregar'}`)
    } finally { setSaving(false) }
  }

  const handleExcel = async (file) => {
    if (!file) return
    setCargando(true); setResultado(null)
    try {
      const text  = await file.text()
      const filas = parseCsv(text)
      let creados = 0, errores = []
      for (const fila of filas) {
        try {
          const res = await crearProducto({
            nombre: String(fila.nombre || '').trim(), tipo: String(fila.tipo || 'con_variantes').trim(),
            precio_venta: parseFloat(fila.precio_venta || fila.precio || 0),
            precio_costo: fila.precio_costo ? parseFloat(fila.precio_costo) : null,
            descripcion: String(fila.descripcion || '').trim(),
          })
          const pid = res.data.id
          if (fila.tallas && fila.colores) {
            const tallas  = String(fila.tallas).split(',').map(x => x.trim())
            const colores = String(fila.colores).split(',').map(x => x.trim())
            const stock   = parseInt(fila.stock || 0)
            for (const talla of tallas)
              for (const color of colores)
                await agregarVariante(pid, { valor1: talla, valor2: color, stock, precio_venta: parseFloat(fila.precio_venta || fila.precio || 0) })
          }
          creados++
        } catch(e) { errores.push(fila.nombre || '?') }
      }
      setResultado({ creados, errores }); await cargar()
    } catch(e) {
      setResultado({ creados: 0, errores: ['Error leyendo el archivo'] })
    } finally { setCargando(false); if (excelRef.current) excelRef.current.value = '' }
  }

  // ── Estilos ───────────────────────────────────────────────────────────────
  const btnPrimary = {
    background: t.accent, color: '#fff', border: 'none',
    padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnSecondary = {
    background: t.surfaceHover, color: t.textSec, border: `1px solid ${t.border}`,
    padding: '7px 12px', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  }
  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${t.border}`,
    borderRadius: 9, fontSize: 13, color: t.text, background: t.surface,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>

      <PageHeader
        title="Productos"
        subtitle={`${productosFiltrados.length} de ${productos.length} productos`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept=".csv" ref={excelRef} style={{ display: 'none' }}
              onChange={e => handleExcel(e.target.files[0])} />
            {!isMobile && (
              <button onClick={() => excelRef.current?.click()} disabled={cargando}
                style={{ ...btnSecondary, fontSize: 12 }}>
                {cargando ? 'Importando...' : '📥 CSV'}
              </button>
            )}
            {resultadoCarga && (
              <span style={{ fontSize: 12, color: resultadoCarga.errores.length ? t.yellow : t.green }}>
                {resultadoCarga.creados} creados{resultadoCarga.errores.length ? ` · ${resultadoCarga.errores.length} err` : ''}
              </span>
            )}
            <button onClick={() => setModal('categorias')}
              style={{ ...btnSecondary, fontSize: 12 }}>
              Categorías
            </button>
            <button onClick={() => setModal('crear')} style={btnPrimary}>
              + Producto
            </button>
          </div>
        }
      />

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ──────────────────────────────────── */}
      <div style={{
        padding: isMobile ? '10px 12px' : '10px 20px',
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: t.textMuted }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            style={{ ...inputStyle, paddingLeft: 32, padding: '8px 12px 8px 32px' }}
          />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'activos', label: 'Activos' },
            { key: 'inactivos', label: 'Inactivos' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltroEst(f.key)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: filtroEstado === f.key ? t.accent : t.bg,
                color:      filtroEstado === f.key ? '#fff'   : t.textMuted,
              }}>
              {f.label}
            </button>
          ))}
          <div style={{ width: 1, background: t.border, margin: '2px 2px' }} />
          {[
            { key: 'todos', label: 'Todos los tipos' },
            { key: 'con_variantes', label: 'Variantes' },
            { key: 'simple', label: 'Simple' },
            { key: 'servicio', label: 'Servicio' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltroTipo(f.key)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: `1px solid ${t.border}`, fontFamily: 'inherit',
                background: filtroTipo === f.key ? t.surfaceHover : 'transparent',
                color:      filtroTipo === f.key ? t.text : t.textMuted,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MODALES ──────────────────────────────────────────────────────── */}
      {modal === 'crear' && (
        <Modal title="Nuevo producto" onClose={cerrarModalCrear}>
          {/* Foto del producto */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div
              onClick={() => newFotoRef.current?.click()}
              style={{
                width: 100, height: 100, borderRadius: 16,
                border: nuevoFotoPreview ? `2px solid ${t.accent}` : `2px dashed ${t.border}`,
                background: t.bg, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}
            >
              {nuevoFotoPreview
                ? <img src={nuevoFotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: t.textMuted, userSelect: 'none' }}>
                    <div style={{ fontSize: 30 }}>📷</div>
                    <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>Agregar foto</div>
                  </div>
              }
              {nuevoFotoPreview && (
                <div
                  onClick={e => {
                    e.stopPropagation()
                    URL.revokeObjectURL(nuevoFotoPreview)
                    setNuevoFotoPreview(null)
                    setNuevo(n => ({ ...n, foto: null }))
                  }}
                  style={{
                    position: 'absolute', top: 5, right: 5, width: 20, height: 20,
                    borderRadius: '50%', background: `${t.red}EE`, color: '#fff',
                    fontSize: 10, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}
                >✕</div>
              )}
            </div>
            <input type="file" accept="image/*" ref={newFotoRef} style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0]; if (!file) return
                if (nuevoFotoPreview) URL.revokeObjectURL(nuevoFotoPreview)
                setNuevoFotoPreview(URL.createObjectURL(file))
                setNuevo(n => ({ ...n, foto: file }))
                if (newFotoRef.current) newFotoRef.current.value = ''
              }} />
          </div>

          <FormField label="Nombre *">
            <input placeholder="Ej: Runner Pro" value={nuevo.nombre}
              onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} style={inputStyle} />
          </FormField>

          <FormField label="Tipo de producto">
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TIPO_LABELS).map(([key, label]) => {
                const tb = getTipoBadge(key, t)
                const sel = nuevo.tipo === key
                return (
                  <button key={key} onClick={() => setNuevo({ ...nuevo, tipo: key })}
                    style={{
                      flex: 1, padding: '9px 4px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      border: sel ? `2px solid ${tb.color}` : `1.5px solid ${t.border}`,
                      background: sel ? tb.bg : t.surfaceHover,
                      color: sel ? tb.color : t.textSec,
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
              {nuevo.tipo === 'simple' && 'Un producto, un precio. Ideal para ítems únicos.'}
              {nuevo.tipo === 'con_variantes' && 'Tiene tallas, colores u otros atributos con precios por variante.'}
              {nuevo.tipo === 'servicio' && 'Intangible, sin control de stock. Ej: instalación, diseño.'}
            </div>
          </FormField>

          {nuevo.tipo !== 'con_variantes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Precio de venta (Q) *">
                <input type="number" placeholder="450" value={nuevo.precio_venta}
                  onChange={e => setNuevo({ ...nuevo, precio_venta: e.target.value })} style={inputStyle} />
              </FormField>
              <FormField label="Costo (Q) — opcional">
                <input type="number" placeholder="250" value={nuevo.precio_costo}
                  onChange={e => setNuevo({ ...nuevo, precio_costo: e.target.value })} style={inputStyle} />
              </FormField>
            </div>
          )}

          <FormField label="Categorías">
            <MultiSelectCategorias categorias={categorias} seleccionadas={nuevo.categorias_ids}
              onChange={ids => setNuevo({ ...nuevo, categorias_ids: ids })} />
          </FormField>

          <FormField label="Descripción">
            <textarea style={{ ...inputStyle, height: 68, resize: 'vertical' }} placeholder="Descripción breve..."
              value={nuevo.descripcion} onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })} />
          </FormField>

          {nuevo.tipo === 'con_variantes' && (
            <div style={{ background: t.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Atributos de variantes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <FormField label="Atributo 1">
                  <input placeholder="Talla" value={nuevo.variante_label1}
                    onChange={e => setNuevo({ ...nuevo, variante_label1: e.target.value })} style={inputStyle} />
                </FormField>
                <FormField label="Atributo 2">
                  <input placeholder="Color" value={nuevo.variante_label2}
                    onChange={e => setNuevo({ ...nuevo, variante_label2: e.target.value })} style={inputStyle} />
                </FormField>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={cerrarModalCrear} style={btnSecondary}>Cancelar</button>
            <button onClick={handleCrear} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
              {saving ? 'Creando...' : 'Crear producto'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'variante' && (
        <Modal title={`Agregar opción — ${variante._nombre || ''}`} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {variante.label1 && (
              <FormField label={variante.label1}>
                <input placeholder={variante.label1} value={variante.valor1}
                  onChange={e => setVariante({ ...variante, valor1: e.target.value })} style={inputStyle} />
              </FormField>
            )}
            {variante.label2 && (
              <FormField label={variante.label2}>
                <input placeholder={variante.label2} value={variante.valor2}
                  onChange={e => setVariante({ ...variante, valor2: e.target.value })} style={inputStyle} />
              </FormField>
            )}
            <FormField label="Stock">
              <input type="number" value={variante.stock}
                onChange={e => setVariante({ ...variante, stock: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Precio de venta (Q)">
              <input type="number" placeholder="0" value={variante.precio_venta}
                onChange={e => setVariante({ ...variante, precio_venta: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Costo (Q)">
              <input type="number" placeholder="0" value={variante.precio_costo}
                onChange={e => setVariante({ ...variante, precio_costo: e.target.value })} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setModal(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleVariante} disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
              {saving ? 'Guardando...' : 'Agregar variante'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'categorias' && (
        <Modal title="Gestionar categorías" onClose={() => setModal(null)}>
          <GestorCategorias categorias={categorias} onChange={setCategorias} />
        </Modal>
      )}

      {/* ── LISTA DE PRODUCTOS ───────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? 12 : 20 }}>

        {loading && (
          <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: 48 }}>Cargando...</div>
        )}

        {!loading && productosFiltrados.length === 0 && (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
            padding: '56px 24px', textAlign: 'center', boxShadow: t.shadow,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>
              {busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos' ? 'Sin resultados' : 'Sin productos'}
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
              {busqueda ? `No encontramos "${busqueda}"` : 'Agregá tu primer producto al catálogo'}
            </div>
            {!busqueda && (
              <button onClick={() => setModal('crear')} style={btnPrimary}>+ Agregar producto</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 12 }}>
          {productosFiltrados.map(p => {
            const esEditando  = editando  === p.id
            const esExpandido = expandido === p.id
            const tipo        = p.tipo || 'con_variantes'
            const tb          = getTipoBadge(tipo, t)

            return (
              <div key={p.id} style={{
                background: t.surface,
                border: `1px solid ${p.activo ? t.border : t.borderLight}`,
                borderRadius: 14, overflow: 'hidden',
                boxShadow: t.shadow,
                opacity: p.activo ? 1 : 0.65,
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = t.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = t.shadow}
              >

                {/* ── Modo edición ── */}
                {esEditando ? (
                  <EditForm
                    editData={editData} setEditData={setEditData}
                    categorias={categorias} saving={saving}
                    onSave={() => guardarEdicion(p.id)}
                    onCancel={() => setEditando(null)}
                    t={t} inputStyle={inputStyle}
                  />
                ) : (
                  <>
                    {/* ── Vista normal ── */}
                    <div style={{
                      display: 'flex', gap: isMobile ? 12 : 16,
                      padding: isMobile ? '12px 12px 10px' : '14px 16px 12px',
                      alignItems: 'flex-start',
                    }}>

                      {/* Foto */}
                      <div
                        onClick={() => fileRef.current[p.id]?.click()}
                        style={{
                          width: isMobile ? 60 : 72, height: isMobile ? 60 : 72,
                          borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                          background: t.bg, border: `1px solid ${t.border}`,
                          cursor: 'pointer', position: 'relative',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ProtectedImage
                          serverPath={p.imagen_url} alt={p.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          fallback={<span style={{ fontSize: 24 }}>📦</span>}
                        />
                        {subiendo === p.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>...</span>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: 12,
                          background: 'rgba(0,0,0,0)', transition: 'background 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                        >
                          <span style={{ fontSize: 14, opacity: 0 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                          >📷</span>
                        </div>
                        <input type="file" accept="image/*" ref={el => fileRef.current[p.id] = el}
                          style={{ display: 'none' }} onChange={e => handleFoto(p.id, e.target.files[0])} />
                      </div>

                      {/* Info principal */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
                              <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: t.text }}>{p.nombre}</span>
                              {/* Badge tipo */}
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: tb.bg, color: tb.color }}>
                                {tb.label}
                              </span>
                              {/* Badge estado */}
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                background: p.activo ? t.greenBg : t.surfaceHover,
                                color:      p.activo ? t.greenDark : t.textMuted,
                              }}>
                                {p.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>

                            {/* Categorías */}
                            {(p.categorias || []).length > 0 && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                                {p.categorias.map(c => (
                                  <span key={c.id} style={{ fontSize: 10, color: t.textMuted, background: t.bg, border: `1px solid ${t.border}`, padding: '1px 7px', borderRadius: 20 }}>
                                    {c.nombre}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Descripción */}
                            {p.descripcion && (
                              <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap', maxWidth: 400 }}>
                                {p.descripcion}
                              </div>
                            )}
                          </div>

                          {/* Precio + stock (derecha en desktop) */}
                          {!isMobile && (
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: '-0.5px' }}>
                                {tipo === 'con_variantes' ? (
                                  <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>Ver variantes</span>
                                ) : `Q${p.precio_venta ?? '—'}`}
                              </div>
                              {p.precio_costo > 0 && tipo !== 'con_variantes' && (
                                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>costo Q{p.precio_costo}</div>
                              )}
                              <div style={{ marginTop: 6 }}>
                                <StockBadge tipo={tipo} stock={p.stock} t={t} productoId={p.id} onUpdated={cargar} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Precio + stock en mobile (debajo) */}
                        {isMobile && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                            {tipo !== 'con_variantes' && (
                              <span style={{ fontSize: 17, fontWeight: 800, color: t.text, letterSpacing: '-0.4px' }}>
                                Q{p.precio_venta ?? '—'}
                              </span>
                            )}
                            <StockBadge tipo={tipo} stock={p.stock} t={t} productoId={p.id} onUpdated={cargar} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Barra de acciones ── */}
                    <div style={{
                      display: 'flex', gap: 6, padding: isMobile ? '8px 12px 10px' : '8px 16px 12px',
                      borderTop: `1px solid ${t.borderLight}`, flexWrap: 'wrap',
                      background: t.surfaceHover,
                    }}>
                      <button onClick={() => iniciarEdicion(p)} style={{ ...btnSecondary, fontSize: 12 }}>
                        ✏ Editar
                      </button>
                      {tipo === 'con_variantes' && (
                        <button
                          onClick={() => {
                            setVariante({ ...VARIANTE_INIT, producto_id: p.id, label1: p.variante_label1, label2: p.variante_label2, _nombre: p.nombre })
                            setModal('variante')
                          }}
                          style={{ ...btnSecondary, fontSize: 12 }}>
                          + Opción
                        </button>
                      )}
                      <button
                        onClick={() => toggleActivo(p)}
                        style={{
                          ...btnSecondary, fontSize: 12,
                          background: p.activo ? t.redBg   : t.greenBg,
                          color:      p.activo ? t.red     : t.greenDark,
                          border:     `1px solid ${p.activo ? t.red + '44' : t.green + '44'}`,
                        }}>
                        {p.activo ? '⏸ Pausar' : '▶ Activar'}
                      </button>
                      <button
                        onClick={() => setExpandido(esExpandido ? null : p.id)}
                        style={{ ...btnSecondary, fontSize: 12, marginLeft: 'auto' }}>
                        {esExpandido ? '▲ Ocultar' : '▼ Fotos y variantes'}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Panel expandido ── */}
                {!esEditando && esExpandido && (
                  <ExpandidoConVariantes producto={p} onUpdated={cargar} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── StockBadge ───────────────────────────────────────────────────────────────

function StockBadge({ tipo, stock, t, productoId, onUpdated }) {
  if (tipo === 'servicio') {
    return (
      <span style={{ fontSize: 11, color: t.orange, background: t.orangeBg, padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
        Servicio
      </span>
    )
  }
  if (tipo === 'con_variantes') {
    const varCnt = typeof stock === 'number' ? null : null
    return (
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
        background: stock > 0 ? t.greenBg : t.redBg,
        color:      stock > 0 ? t.greenDark : t.red,
      }}>
        {stock > 0 ? `Stock: ${stock}` : 'Agotado'}
      </span>
    )
  }
  // simple — editable inline
  return <StockSimpleInline productoId={productoId} stockActual={stock ?? 0} onUpdated={onUpdated} />
}

// ─── EditForm ─────────────────────────────────────────────────────────────────

function EditForm({ editData, setEditData, categorias, saving, onSave, onCancel, t, inputStyle }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Editando producto
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: editData.tipo === 'con_variantes' ? '1fr' : '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Nombre</div>
          <input value={editData.nombre} onChange={e => setEditData({ ...editData, nombre: e.target.value })}
            style={inputStyle} placeholder="Nombre del producto" />
        </div>
        {editData.tipo !== 'con_variantes' && <>
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Precio venta (Q)</div>
            <input type="number" value={editData.precio_venta} onChange={e => setEditData({ ...editData, precio_venta: e.target.value })}
              style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Costo (Q)</div>
            <input type="number" value={editData.precio_costo} onChange={e => setEditData({ ...editData, precio_costo: e.target.value })}
              style={inputStyle} placeholder="Opcional" />
          </div>
        </>}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Descripción</div>
        <input value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })}
          style={inputStyle} placeholder="Descripción (opcional)" />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>Categorías</div>
        <MultiSelectCategorias categorias={categorias} seleccionadas={editData.categorias_ids || []}
          onChange={ids => setEditData({ ...editData, categorias_ids: ids })} compact />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Tipo</div>
          <select value={editData.tipo} onChange={e => setEditData({ ...editData, tipo: e.target.value })}
            style={{ ...inputStyle, padding: '8px 10px' }}>
            <option value="simple">Simple</option>
            <option value="con_variantes">Con variantes</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Atributo 1</div>
          <input placeholder="Talla..." value={editData.variante_label1}
            onChange={e => setEditData({ ...editData, variante_label1: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>Atributo 2</div>
          <input placeholder="Color..." value={editData.variante_label2}
            onChange={e => setEditData({ ...editData, variante_label2: e.target.value })} style={inputStyle} />
        </div>
        <label style={{ fontSize: 11, color: t.textSec, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', paddingBottom: 2, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={editData.activo} onChange={e => setEditData({ ...editData, activo: e.target.checked })}
            style={{ accentColor: t.accent }} />
          Activo
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 12, border: `1px solid ${t.border}`, background: t.surfaceHover, color: t.textSec, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', background: t.accent, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── GestorCategorias ─────────────────────────────────────────────────────────

function GestorCategorias({ categorias, onChange }) {
  const { t } = useTheme()
  const [nueva,   setNueva]   = useState('')
  const [creando, setCreando] = useState(false)
  const [error,   setError]   = useState('')

  const inputStyle = {
    flex: 1, padding: '9px 12px', border: `1.5px solid ${t.border}`,
    borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit',
    background: t.surface, color: t.text,
  }

  const handleCrear = async () => {
    const nombre = nueva.trim()
    if (!nombre) return
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError('Ya existe esa categoría.'); return
    }
    setCreando(true); setError('')
    try {
      const { data } = await crearCategoria(nombre)
      onChange(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNueva('')
    } catch(e) { setError('No se pudo crear.') }
    finally { setCreando(false) }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return
    try { await eliminarCategoria(id); onChange(prev => prev.filter(c => c.id !== id)) }
    catch(e) { console.error(e) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={nueva} onChange={e => { setNueva(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleCrear()}
          placeholder="Nueva categoría..." style={inputStyle} />
        <button onClick={handleCrear} disabled={!nueva.trim() || creando}
          style={{
            padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none',
            background: t.accent, color: '#fff', cursor: 'pointer', opacity: !nueva.trim() ? 0.5 : 1, fontFamily: 'inherit',
          }}>
          {creando ? '...' : '+ Crear'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: t.red, marginBottom: 8 }}>{error}</div>}

      {categorias.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: t.textMuted, fontSize: 13 }}>
          Sin categorías. Creá la primera arriba.
        </div>
      ) : (
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {categorias.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < categorias.length - 1 ? `1px solid ${t.border}` : 'none',
              background: t.surface,
            }}>
              <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{c.nombre}</span>
              <button onClick={() => handleEliminar(c.id)}
                style={{ fontSize: 12, padding: '3px 10px', borderRadius: 7, border: `1px solid ${t.red}44`, background: 'none', color: t.red, cursor: 'pointer', fontFamily: 'inherit' }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MultiSelectCategorias ────────────────────────────────────────────────────

function MultiSelectCategorias({ categorias, seleccionadas, onChange, compact = false }) {
  const { t } = useTheme()
  if (categorias.length === 0) return <div style={{ fontSize: 12, color: t.textMuted }}>Sin categorías.</div>

  const toggle = (id) => onChange(
    seleccionadas.includes(id) ? seleccionadas.filter(s => s !== id) : [...seleccionadas, id]
  )

  return (
    <div style={{ border: `1.5px solid ${t.border}`, borderRadius: 9, overflow: 'hidden', maxHeight: compact ? 110 : 150, overflowY: 'auto' }}>
      {categorias.map((c, i) => {
        const sel = seleccionadas.includes(c.id)
        return (
          <label key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: compact ? '6px 10px' : '8px 12px',
            cursor: 'pointer', userSelect: 'none',
            background: sel ? t.accentBg : i % 2 === 0 ? t.surface : t.bg,
            borderBottom: i < categorias.length - 1 ? `1px solid ${t.border}` : 'none',
          }}>
            <input type="checkbox" checked={sel} onChange={() => toggle(c.id)}
              style={{ accentColor: t.accent, width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontSize: compact ? 12 : 13, color: sel ? t.accentText : t.textSec, fontWeight: sel ? 600 : 400 }}>
              {c.nombre}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// ─── StockSimpleInline ────────────────────────────────────────────────────────

function StockSimpleInline({ productoId, stockActual, onUpdated }) {
  const { t } = useTheme()
  const [editando, setEditando] = useState(false)
  const [valor,    setValor]    = useState(String(stockActual))
  const [saving,   setSaving]   = useState(false)

  const guardar = async () => {
    setSaving(true)
    try { await actualizarStockSimple(productoId, { stock: parseInt(valor) || 0 }); setEditando(false); onUpdated() }
    catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (editando) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <input type="number" min="0" value={valor} onChange={e => setValor(e.target.value)}
          autoFocus onKeyDown={e => e.key === 'Enter' && guardar()}
          style={{ width: 65, padding: '3px 7px', border: `1.5px solid ${t.accent}`, borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: t.surface, color: t.text }} />
        <button onClick={guardar} disabled={saving}
          style={{ fontSize: 11, background: t.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '...' : 'OK'}
        </button>
        <button onClick={() => setEditando(false)}
          style={{ fontSize: 11, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}>✕</button>
      </div>
    )
  }

  return (
    <span onClick={() => { setValor(String(stockActual)); setEditando(true) }} title="Clic para editar"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        padding: '2px 9px', borderRadius: 20,
        background: stockActual > 0 ? t.greenBg : t.redBg,
        color:      stockActual > 0 ? t.greenDark : t.red,
      }}>
      {stockActual > 0 ? `Stock: ${stockActual}` : 'Agotado'} <span style={{ fontSize: 9, opacity: 0.5 }}>✏</span>
    </span>
  )
}

// ─── VarianteRow ──────────────────────────────────────────────────────────────

function VarianteRow({ v, l1, l2, gridCols, onUpdated, imagenVariante, productoId, onImagenCambiada }) {
  const { t } = useTheme()
  const [editando, setEditando] = useState(false)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const varFileRef = useRef()

  const miniInput = {
    width: '100%', padding: '5px 8px', border: `1.5px solid ${t.border}`,
    borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit',
    background: t.surface, color: t.text,
  }

  const iniciar = () => {
    setForm({ valor1: v.valor1 || '', valor2: v.valor2 || '', stock: String(v.stock), precio_venta: String(v.precio_venta || 0), precio_costo: String(v.precio_costo || '') })
    setEditando(true)
  }

  const guardar = async () => {
    setSaving(true)
    try {
      await actualizarVariante(v.id, { valor1: form.valor1 || null, valor2: form.valor2 || null, stock: parseInt(form.stock) || 0, precio_venta: parseFloat(form.precio_venta) || 0, precio_costo: form.precio_costo ? parseFloat(form.precio_costo) : null })
      setEditando(false); onUpdated()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const borrar = async () => {
    if (!window.confirm('¿Eliminar esta variante?')) return
    try { await eliminarVariante(v.id); onUpdated() } catch(e) { console.error(e) }
  }

  if (editando) {
    return (
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`, background: t.bg }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          {l1 && <div><div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>{l1}</div><input value={form.valor1} onChange={e => setForm({ ...form, valor1: e.target.value })} style={miniInput} /></div>}
          {l2 && <div><div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>{l2}</div><input value={form.valor2} onChange={e => setForm({ ...form, valor2: e.target.value })} style={miniInput} /></div>}
          <div><div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>Stock</div><input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={miniInput} /></div>
          <div><div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>Precio venta (Q)</div><input type="number" min="0" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} style={miniInput} /></div>
          <div><div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>Costo (Q)</div><input type="number" min="0" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} style={miniInput} placeholder="—" /></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={guardar} disabled={saving} style={{ fontSize: 11, background: t.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : 'Guardar'}</button>
          <button onClick={() => setEditando(false)} style={{ fontSize: 11, background: 'none', border: `1px solid ${t.border}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: t.textSec, fontFamily: 'inherit' }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '9px 14px', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
      {l1 && <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{v.valor1 || '—'}</span>}
      {l2 && <span style={{ fontSize: 12, color: t.textSec }}>{v.valor2 || '—'}</span>}
      <span onClick={iniciar} title="Clic para editar" style={{ fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '2px 8px', borderRadius: 20, display: 'inline-block', width: 'fit-content', background: v.stock > 0 ? t.greenBg : t.redBg, color: v.stock > 0 ? t.greenDark : t.red }}>
        {v.stock > 0 ? v.stock : 'Agotado'} <span style={{ fontSize: 9, opacity: 0.5 }}>✏</span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Q{v.precio_venta ?? '—'}</span>
      <span style={{ fontSize: 11, color: t.textMuted }}>{v.precio_costo ? `Q${v.precio_costo}` : '—'}</span>
      <span style={{ fontSize: 11, color: t.textMuted }}>{v.sku || '—'}</span>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
        <div onClick={() => varFileRef.current?.click()} title="Foto de variante"
          style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', overflow: 'hidden', flexShrink: 0, border: imagenVariante ? `1.5px solid ${t.accent}` : `1.5px dashed ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
          {subiendo ? <span style={{ fontSize: 9, color: t.textMuted }}>···</span>
            : imagenVariante ? <ProtectedImage serverPath={imagenVariante.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 12, color: t.textMuted }}>📷</span>}
        </div>
        <input type="file" accept="image/*" ref={varFileRef} style={{ display: 'none' }} onChange={async e => {
          const file = e.target.files[0]; if (!file) return
          setSubiendo(true)
          try { await subirImagenProducto(productoId, file, v.id); onImagenCambiada?.() }
          catch(err) { console.error(err) }
          finally { setSubiendo(false); if (varFileRef.current) varFileRef.current.value = '' }
        }} />
        <button onClick={iniciar} style={{ fontSize: 10, background: 'none', border: `1px solid ${t.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: t.textSec, fontFamily: 'inherit' }}>Editar</button>
        <button onClick={borrar} style={{ fontSize: 10, background: 'none', border: `1px solid ${t.red}44`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: t.red, fontFamily: 'inherit' }}>✕</button>
      </div>
    </div>
  )
}

// ─── ExpandidoConVariantes ────────────────────────────────────────────────────

function ExpandidoConVariantes({ producto, onUpdated }) {
  const { t } = useTheme()
  const [imagenes, setImagenes] = useState([])
  const tipo = producto.tipo || 'con_variantes'
  const l1   = producto.variante_label1 || ''
  const l2   = producto.variante_label2 || ''

  const recargar = () => getImagenesProducto(producto.id).then(r => setImagenes(r.data)).catch(() => {})
  useEffect(() => { recargar() }, [producto.id]) // eslint-disable-line

  const cols = ['Stock', 'Precio venta', 'Costo', 'SKU', '']
  if (l2) cols.unshift(l2)
  if (l1) cols.unshift(l1)
  const gridCols = `repeat(${cols.length}, 1fr)`

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, background: t.bg }}>
      {tipo === 'con_variantes' && (
        <div style={{ margin: '14px 14px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Opciones / variantes
          </div>
          {producto.variantes?.length > 0 ? (
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '8px 14px', background: t.surfaceHover, borderBottom: `1px solid ${t.border}` }}>
                {cols.map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase' }}>{h}</span>)}
              </div>
              {producto.variantes.map(v => (
                <VarianteRow key={v.id} v={v} l1={l1} l2={l2} gridCols={gridCols} onUpdated={onUpdated}
                  imagenVariante={imagenes.find(i => i.variante_id === v.id)}
                  productoId={producto.id} onImagenCambiada={recargar} />
              ))}
            </div>
          ) : (
            <div style={{ background: t.surfaceHover, borderRadius: 10, padding: '16px', textAlign: 'center', fontSize: 12, color: t.textMuted, border: `1px solid ${t.border}` }}>
              Sin variantes — usá "+ Opción" para agregar
            </div>
          )}
        </div>
      )}

      <GaleriaImagenes productoId={producto.id} variantes={producto.variantes || []} imagenes={imagenes} onRefresh={recargar} />
    </div>
  )
}

// ─── GaleriaImagenes ─────────────────────────────────────────────────────────

function GaleriaImagenes({ productoId, variantes, imagenes: extImg = null, onRefresh = null }) {
  const { t } = useTheme()
  const [imagenes,  setImagenes]  = useState([])
  const [subiendo,  setSubiendo]  = useState(false)
  const [principal, setPrincipal] = useState(false)
  const [varId,     setVarId]     = useState('')
  const imgRef = useRef()

  const cargarImagenes = async () => {
    try { const { data } = await getImagenesProducto(productoId); setImagenes(data) } catch(e) {}
  }
  useEffect(() => { if (!extImg) cargarImagenes() }, [productoId]) // eslint-disable-line

  const displayImagenes = extImg ?? imagenes

  const handleSubir = async (file) => {
    if (!file) return
    setSubiendo(true)
    try {
      await subirImagenProducto(productoId, file, varId ? parseInt(varId) : null, principal)
      if (onRefresh) onRefresh(); else await cargarImagenes()
      setPrincipal(false); setVarId('')
    } catch(e) { console.error(e) }
    finally { setSubiendo(false); if (imgRef.current) imgRef.current.value = '' }
  }

  const handleEliminar = async (imgId) => {
    try { await eliminarImagenProducto(imgId); if (onRefresh) onRefresh(); else await cargarImagenes() }
    catch(e) {}
  }

  return (
    <div style={{ padding: '14px 14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Galería de fotos
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {displayImagenes.map(img => {
          const varMatch = variantes.find(v => v.id === img.variante_id)
          return (
            <div key={img.id} style={{ position: 'relative', width: 70, flexShrink: 0 }}>
              <ProtectedImage serverPath={img.url} alt="producto"
                style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: varMatch ? '9px 9px 0 0' : 10, display: 'block', border: varMatch ? `2px solid ${t.accent}` : img.es_principal ? `2px solid ${t.green}` : `1px solid ${t.border}` }}
                fallback={<div style={{ width: 70, height: 70, background: t.bg, borderRadius: 10, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: t.textMuted }}>📷</div>}
              />
              {img.es_principal && !varMatch && (
                <div style={{ position: 'absolute', top: 3, left: 3, fontSize: 8, background: t.green, color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>MAIN</div>
              )}
              {varMatch && (
                <div style={{ fontSize: 8, background: t.accent, color: '#fff', padding: '2px 4px', borderRadius: '0 0 7px 7px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                  {[varMatch.valor1, varMatch.valor2].filter(Boolean).join(' ')}
                </div>
              )}
              <button onClick={() => handleEliminar(img.id)}
                style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: `${t.red}EE`, border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                ✕
              </button>
            </div>
          )
        })}
        <div onClick={() => imgRef.current?.click()}
          style={{ width: 70, height: 70, borderRadius: 10, border: `2px dashed ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: t.textMuted, flexShrink: 0, background: t.surfaceHover }}>
          {subiendo ? <span style={{ fontSize: 12, color: t.textMuted }}>...</span> : '+'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {variantes.length > 0 && (
          <select value={varId} onChange={e => setVarId(e.target.value)}
            style={{ padding: '5px 9px', border: `1px solid ${t.border}`, borderRadius: 7, fontSize: 11, color: t.textSec, background: t.surface, fontFamily: 'inherit' }}>
            <option value="">Para el producto</option>
            {variantes.map(v => <option key={v.id} value={v.id}>{v.valor1} {v.valor2}</option>)}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textSec, cursor: 'pointer' }}>
          <input type="checkbox" checked={principal} onChange={e => setPrincipal(e.target.checked)} style={{ accentColor: t.accent }} />
          Foto principal
        </label>
      </div>
      <input type="file" accept="image/*" ref={imgRef} style={{ display: 'none' }} onChange={e => handleSubir(e.target.files[0])} />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  const { t } = useTheme()
  const mob = window.innerWidth < 768
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: mob ? 'flex-end' : 'center', justifyContent: 'center', padding: mob ? 0 : 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.surface, borderRadius: mob ? '20px 20px 0 0' : 16, width: '100%', maxWidth: mob ? '100%' : 520, boxShadow: t.shadowLg, maxHeight: '92vh', overflowY: 'auto' }}>
        {mob && <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '14px auto 6px' }} />}
        <div style={{ padding: mob ? '10px 18px 12px' : '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: t.surface, zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: t.textMuted, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: mob ? '14px 18px 20px' : '18px 20px 20px' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({ label, children }) {
  const { t } = useTheme()
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: t.textSec, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}
