import { useState, useEffect } from 'react'
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useTheme } from '../context/ThemeContext'

export default function Usuarios() {
  const { t } = useTheme()
  const [usuarios,  setUsuarios]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState({ nombre: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState('')

  const ROL_CFG = {
    dueno:    { label: 'Dueño',    color: t.accent,   bg: t.accentBg },
    empleado: { label: 'Empleado', color: t.green,    bg: t.greenBg  },
  }

  const cargar = () => {
    setCargando(true)
    getUsuarios()
      .then(r => setUsuarios(r.data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const abrirModal = () => {
    setForm({ nombre: '', telefono: '' })
    setError('')
    setModal(true)
  }

  const cerrarModal = () => { setModal(false); setError('') }

  const handleCrear = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Nombre y teléfono son requeridos.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await crearUsuario({ nombre: form.nombre.trim(), telefono: form.telefono.trim() })
      setExito('Usuario creado. Ya puede iniciar sesión con su número.')
      cerrarModal()
      cargar()
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear el usuario.')
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (u) => {
    try {
      await actualizarUsuario(u.id, { activo: !u.activo })
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al actualizar')
    }
  }

  const handleEliminar = async (u) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await eliminarUsuario(u.id)
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${t.border}`, borderRadius: 9,
    padding: '9px 12px', fontSize: 13, outline: 'none',
    background: t.bg, color: t.text, fontFamily: 'inherit',
  }

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <PageHeader
        title="Usuarios"
        subtitle="Personas que pueden acceder al dashboard de tu negocio"
        action={
          <button
            onClick={abrirModal}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: t.accent, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: t.shadowAccent,
            }}
          >
            + Agregar
          </button>
        }
      />

      {/* Modal crear */}
      {modal && (
        <div
          onClick={cerrarModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: 16, padding: '26px 26px',
              zIndex: 1001, width: 380, maxWidth: '90vw',
              boxShadow: t.shadowLg, border: `1px solid ${t.border}`,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>
              Agregar empleado
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
              Ingresá sus datos. Podrá entrar al dashboard con su número de WhatsApp.
            </div>

            <form onSubmit={handleCrear}>
              {[
                { key: 'nombre',   label: 'Nombre completo',    placeholder: 'Ej: María López' },
                { key: 'telefono', label: 'Número de WhatsApp', placeholder: 'Ej: 50255551234' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textSec, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}

              {error && (
                <div style={{
                  background: t.redBg, border: `1px solid ${t.red}44`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: t.red, marginBottom: 14,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                    background: guardando ? t.accentMuted : t.accent,
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {guardando ? 'Guardando...' : 'Agregar empleado'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    padding: '10px 16px', borderRadius: 9,
                    border: `1px solid ${t.border}`, background: t.surfaceHover,
                    fontSize: 13, color: t.textMuted, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: 22, maxWidth: 680 }}>

        {/* Aviso de éxito */}
        {exito && (
          <div style={{
            background: t.greenBg, border: `1px solid ${t.green}44`, borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, fontSize: 13, color: t.greenDark,
          }}>
            {exito}
          </div>
        )}

        {/* Lista */}
        {cargando ? (
          <div style={{ color: t.textMuted, fontSize: 13, padding: 20, textAlign: 'center' }}>Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div style={{
            background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 14,
            padding: 48, textAlign: 'center', color: t.textMuted, fontSize: 13,
            boxShadow: t.shadow,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>No hay usuarios todavía</div>
            <div>Agregá empleados para que puedan acceder al panel.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {usuarios.map(u => {
              const rc = ROL_CFG[u.rol] || ROL_CFG.empleado
              const esDueno = u.rol === 'dueno'
              return (
                <div
                  key={u.id}
                  style={{
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: 14, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: u.activo ? 1 : 0.55,
                    boxShadow: t.shadow,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: rc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {esDueno ? '👑' : '👤'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
                      {u.nombre}
                      {!u.activo && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: t.textMuted, fontWeight: 400 }}>
                          inactivo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{u.telefono}</div>
                  </div>

                  {/* Rol badge */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: rc.bg, color: rc.color,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {rc.label}
                  </span>

                  {/* Acciones — solo para empleados */}
                  {!esDueno && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => toggleActivo(u)}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                        style={{
                          padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.border}`,
                          background: t.surfaceHover, cursor: 'pointer', fontSize: 12,
                          color: u.activo ? t.yellow : t.green, fontWeight: 600, fontFamily: 'inherit',
                        }}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleEliminar(u)}
                        title="Eliminar"
                        style={{
                          padding: '6px 10px', borderRadius: 8,
                          border: `1px solid ${t.red}44`, background: t.redBg,
                          cursor: 'pointer', fontSize: 12, color: t.red,
                          fontWeight: 600, fontFamily: 'inherit',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Info de plan */}
        <div style={{
          marginTop: 20, background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 12, padding: '12px 16px', fontSize: 12, color: t.textMuted,
        }}>
          Los empleados inician sesión con su número de WhatsApp vía OTP.
          El límite de usuarios depende de tu plan.
        </div>
      </div>
    </div>
  )
}
