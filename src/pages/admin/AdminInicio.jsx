import { useState, useEffect } from 'react'
import { getAdminStats } from '../../api/adminClient'

const STAT_CARDS = [
  { key: 'total_negocios',   label: 'Negocios inscritos', icon: '🏢', color: '#6C63FF' },
  { key: 'negocios_activos', label: 'Activos',            icon: '✅', color: '#10B981' },
  { key: 'nuevos_este_mes',  label: 'Nuevos este mes',    icon: '🆕', color: '#3B82F6' },
  { key: 'total_clientes',   label: 'Clientes totales',   icon: '👥', color: '#F59E0B' },
  { key: 'total_pedidos',    label: 'Pedidos totales',    icon: '📦', color: '#8B5CF6' },
  { key: 'leads_nuevos',     label: 'Leads nuevos',       icon: '🎯', color: '#EF4444' },
]

export default function AdminInicio() {
  const [stats,    setStats]    = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [])

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Resumen</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Vista general de Poktah
        </div>
      </div>

      {cargando ? (
        <div style={{ color: '#6B7280', fontSize: 14 }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {STAT_CARDS.map(card => (
            <div key={card.key} style={{
              background: '#1A1A2E', border: '1px solid #2D2D44',
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>
                {stats?.[card.key] ?? 0}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
