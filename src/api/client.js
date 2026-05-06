import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Agregar token JWT a cada request automáticamente
client.interceptors.request.use(config => {
  const token = localStorage.getItem('foxint_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expira, redirigir al login
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('foxint_token')
      localStorage.removeItem('foxint_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const requestOTP  = (telefono) => client.post('/auth/request-otp', { telefono })
export const verifyOTP   = (telefono, codigo) => client.post('/auth/verify-otp', { telefono, codigo })
export const getMe       = () => client.get('/auth/me')

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const getStats    = (periodo = 'hoy') => client.get('/dashboard/stats', { params: { periodo } })

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
export const getPedidos  = (estado = null, page = 1, size = 20) => client.get('/pedidos', { params: { ...(estado ? { estado } : {}), page, size } })
export const cambiarEstadoPedido = (id, estado, notificar = false, mensaje = null) =>
  client.patch(`/pedidos/${id}/estado`, { nuevo_estado: estado, notificar, mensaje })

export const getDetallePedido   = (id)           => client.get(`/pedidos/${id}/detalle`)
export const actualizarGuia     = (id, codigo)   => client.patch(`/pedidos/${id}/guia`, { codigo_guia: codigo })

// ─── PAGOS ────────────────────────────────────────────────────────────────────
export const getPagosPendientes = () => client.get('/pagos/pendientes')
export const confirmarPago = (pago_id, accion, notificar = false) => client.post('/pagos/confirmar', { pago_id, accion, notificar })

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export const getProductos   = () => client.get('/productos')
export const crearProducto  = (data) => client.post('/productos', data)
export const actualizarProducto = (id, data) => client.patch(`/productos/${id}`, data)
export const subirFoto      = (id, file) => {
  const form = new FormData()
  form.append('foto', file)
  return client.post(`/productos/${id}/foto`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const agregarVariante         = (id, data) => client.post(`/productos/${id}/variantes`, data)
export const actualizarVariante      = (id, data) => client.patch(`/variantes/${id}`, data)
export const eliminarVariante        = (id)       => client.delete(`/variantes/${id}`)
export const actualizarStockSimple   = (id, data) => client.patch(`/productos/${id}/stock`, data)

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
export const getClientes          = (categoria = null, page = 1, size = 24) => client.get('/clientes', { params: { ...(categoria ? { categoria } : {}), page, size } })
export const actualizarCliente    = (id, data) => client.patch(`/clientes/${id}`, data)

// ─── CATEGORÍAS DE PRODUCTO ───────────────────────────────────────────────────
export const getCategorias      = ()           => client.get('/categorias')
export const crearCategoria     = (nombre)     => client.post('/categorias', { nombre })
export const eliminarCategoria  = (id)         => client.delete(`/categorias/${id}`)

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
export const getConfiguracion         = () => client.get('/configuracion')
export const actualizarNombreNegocio  = (nombre) => client.patch('/configuracion/negocio', { nombre_negocio: nombre })
export const actualizarConfigNegocio  = (data)   => client.patch('/configuracion/negocio', data)
export const subirLogo            = (file) => { const f = new FormData(); f.append('logo', file); return client.post('/configuracion/logo', f, { headers: { 'Content-Type': 'multipart/form-data' } }) }
export const generarSlugCatalogo  = () => client.post('/configuracion/generar-slug')
export const actualizarCatalogo        = (data) => client.patch('/configuracion/catalogo', data)
export const actualizarCredencialesWA  = (data) => client.patch('/configuracion/whatsapp', data)
export const actualizarContextoAgente  = (data) => client.patch('/configuracion/agente', data)
export const actualizarNotificaciones  = (data) => client.patch('/configuracion/notificaciones', data)
export const testWhatsapp              = (numero) => client.post('/configuracion/test-whatsapp', { numero })
export const agregarMetodoPago    = (data) => client.post('/configuracion/metodos-pago', data)
export const actualizarMetodoPago = (id, data) => client.patch(`/configuracion/metodos-pago/${id}`, data)
export const eliminarMetodoPago   = (id) => client.delete(`/configuracion/metodos-pago/${id}`)

// ─── IMÁGENES ─────────────────────────────────────────────────────────────────
export const getImagenesProducto  = (id) => client.get(`/productos/${id}/imagenes`)
export const subirImagenProducto  = (id, file, variante_id = null, es_principal = false) => {
  const f = new FormData()
  f.append('foto', file)
  const params = { es_principal }
  if (variante_id) params.variante_id = variante_id
  return client.post(`/productos/${id}/imagenes`, f, { headers: { 'Content-Type': 'multipart/form-data' }, params })
}
export const eliminarImagenProducto = (imgId) => client.delete(`/productos/imagenes/${imgId}`)

// ─── SEGUIMIENTOS ────────────────────────────────────────────────────────────
export const getSeguimientos       = (estado = null) => client.get('/seguimientos', { params: estado ? { estado } : {} })
export const getSeguimientoChat    = (id) => client.get(`/seguimientos/${id}/chat`)
export const enviarMensajeSeguimiento = (id, mensaje, guia = null) => client.post(`/seguimientos/${id}/enviar`, { mensaje, ...(guia ? { guia } : {}) })

// ─── SUSCRIPCIÓN ──────────────────────────────────────────────────────────────
export const getSuscripcionInfo  = () => client.get('/suscripcion/info')
export const solicitarUpgrade    = (plan, periodo, referencia) =>
  client.post('/suscripcion/upgrade', { plan, periodo, referencia })
export const getCuentaBancaria   = () => client.get('/public/cuenta-bancaria')

// ─── USUARIOS DEL NEGOCIO ─────────────────────────────────────────────────────
export const getUsuarios      = ()           => client.get('/usuarios')
export const crearUsuario     = (data)       => client.post('/usuarios', data)
export const actualizarUsuario = (id, data)  => client.patch(`/usuarios/${id}`, data)
export const eliminarUsuario  = (id)         => client.delete(`/usuarios/${id}`)

// ─── PROMOCIONES ─────────────────────────────────────────────────────────────
export const getPromociones        = ()           => client.get('/promociones')
export const crearPromocion        = (data)       => client.post('/promociones', data)
export const actualizarPromocion   = (id, data)   => client.patch(`/promociones/${id}`, data)
export const eliminarPromocion     = (id)         => client.delete(`/promociones/${id}`)
export const previewMasivo         = (categoria)  => client.get('/promociones/masivo/preview', { params: { categoria } })
export const enviarMasivo          = (data)       => client.post('/promociones/masivo/enviar', data)

// ─── AGENTE ───────────────────────────────────────────────────────────────────
export const getPrompt          = () => client.get('/agente/prompt')
export const actualizarPrompt   = (prompt) => client.post('/agente/prompt', { prompt })
export const limpiarHistorial   = (numero) => client.delete(`/agente/historial/${encodeURIComponent(numero)}`)
export const getHistorialCliente = (numero) => client.get(`/agente/historial/${encodeURIComponent(numero)}`)