import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AdminLayout   from './AdminLayout'
import AdminInicio   from './AdminInicio'
import AdminNegocios from './AdminNegocios'
import AdminLeads    from './AdminLeads'
import AdminPlanes   from './AdminPlanes'
import AdminPrecios  from './AdminPrecios'
import AdminPagos    from './AdminPagos'

function RequireAdmin({ children }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('poktah_admin_token')
  useEffect(() => {
    if (!token) navigate('/admin/login', { replace: true })
  }, [token])
  if (!token) return null
  return children
}

export default function Admin() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <RequireAdmin>
            <AdminLayout>
              <Routes>
                <Route index           element={<AdminInicio />} />
                <Route path="negocios" element={<AdminNegocios />} />
                <Route path="leads"    element={<AdminLeads />} />
                <Route path="planes"   element={<AdminPlanes />} />
                <Route path="precios"  element={<AdminPrecios />} />
                <Route path="pagos"    element={<AdminPagos />} />
                <Route path="*"        element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          </RequireAdmin>
        }
      />
    </Routes>
  )
}
