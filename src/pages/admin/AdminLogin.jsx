import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../api/adminClient'

export default function AdminLogin() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await adminLogin(email, password)
      localStorage.setItem('poktah_admin_token', data.token)
      navigate('/admin')
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0F0F1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#1A1A2E', border: '1px solid #2D2D44',
        borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Poktah
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Panel de administración</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0F0F1A', border: '1px solid #2D2D44',
                borderRadius: 10, padding: '11px 14px', fontSize: 14,
                color: '#fff', outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0F0F1A', border: '1px solid #2D2D44',
                borderRadius: 10, padding: '11px 14px', fontSize: 14,
                color: '#fff', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#2D1515', color: '#F87171', borderRadius: 8,
              padding: '8px 12px', fontSize: 13, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#3D3D5C' : '#6C63FF',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
