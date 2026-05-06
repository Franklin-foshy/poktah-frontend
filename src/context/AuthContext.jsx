import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token    = localStorage.getItem('foxint_token')
      const userData = localStorage.getItem('foxint_user')
      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    } catch {
      localStorage.removeItem('foxint_token')
      localStorage.removeItem('foxint_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (tokenData) => {
    const userData = {
      tenant_id:      tokenData.tenant_id,
      nombre:         tokenData.nombre,
      rol:            tokenData.rol        || 'dueno',
      usuario_id:     tokenData.usuario_id,
      usuario_nombre: tokenData.usuario_nombre,
    }
    localStorage.setItem('foxint_token', tokenData.access_token)
    localStorage.setItem('foxint_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('foxint_token')
    localStorage.removeItem('foxint_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)