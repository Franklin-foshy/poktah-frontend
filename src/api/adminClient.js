import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/admin'

const adminClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

adminClient.interceptors.request.use(config => {
  const token = localStorage.getItem('poktah_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminClient.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('poktah_admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export const adminLogin       = (email, password) => adminClient.post('/login', { email, password })
export const adminMe          = () => adminClient.get('/me')
export const getAdminStats    = () => adminClient.get('/stats')

export default adminClient

export const getNegocios      = () => adminClient.get('/negocios')
export const getDetallNegocio = (id) => adminClient.get(`/negocios/${id}`)
export const actualizarNegocio = (id, data) => adminClient.patch(`/negocios/${id}`, data)

export const getAdminLeads    = (estado = null) => adminClient.get('/leads', { params: estado ? { estado } : {} })
export const actualizarEstadoLeadAdmin = (id, estado) => adminClient.patch(`/leads/${id}/estado`, { estado })
export const eliminarLeadAdmin = (id) => adminClient.delete(`/leads/${id}`)
export const activarLeadComoNegocio = (id, data) => adminClient.post(`/leads/${id}/activar`, data)

// ─── PAGOS SUSCRIPCIÓN ────────────────────────────────────────────────────────
export const getPagosSuscripcion    = () => adminClient.get('/pagos-suscripcion')
export const confirmarPagoSuscripcion = (id, data) => adminClient.post(`/pagos-suscripcion/${id}/confirmar`, data)

// ─── USUARIOS POR TENANT ──────────────────────────────────────────────────────
export const getUsuariosTenant    = (tenantId) => adminClient.get(`/negocios/${tenantId}/usuarios`)
export const crearUsuarioTenant   = (tenantId, data) => adminClient.post(`/negocios/${tenantId}/usuarios`, data)
export const actualizarUsuarioAdmin = (usuarioId, data) => adminClient.patch(`/usuarios/${usuarioId}`, data)
export const eliminarUsuarioAdmin   = (usuarioId) => adminClient.delete(`/usuarios/${usuarioId}`)
