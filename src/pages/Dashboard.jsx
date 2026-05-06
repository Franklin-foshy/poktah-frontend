import { Routes, Route } from 'react-router-dom'
import Layout  from '../components/Layout'
import Inicio  from './Inicio'
import Pedidos from './Pedidos'
import Pagos   from './Pagos'
import Productos from './Productos'
import Clientes  from './Clientes'
import Seguimientos from './Seguimientos'
import Agente    from './Agente'
import Configuracion from './Configuracion'
import Suscripcion   from './Suscripcion'
import Usuarios      from './Usuarios'
import Promociones   from './Promociones'

export default function Dashboard() {
  return (
    <Layout>
      <Routes>
        <Route index               element={<Inicio />} />
        <Route path="pedidos"      element={<Pedidos />} />
        <Route path="pagos"        element={<Pagos />} />
        <Route path="productos"    element={<Productos />} />
        <Route path="clientes"     element={<Clientes />} />
        <Route path="seguimientos" element={<Seguimientos />} />
        <Route path="agente"       element={<Agente />} />
        <Route path="promociones"  element={<Promociones />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="suscripcion"  element={<Suscripcion />} />
        <Route path="usuarios"     element={<Usuarios />} />
      </Routes>
    </Layout>
  )
}