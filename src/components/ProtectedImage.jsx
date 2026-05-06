import { useState, useEffect } from 'react'

const BACKEND  = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_BASE = BACKEND + '/api'

/**
 * Renderiza una imagen del servidor. Soporta tres formatos:
 *   1. URL absoluta (https://...) — R2/CDN, se muestra directo
 *   2. Ruta /api/public/... — archivo local público, se antepone el backend
 *   3. Ruta /api/files/... o data/... — requiere JWT, se hace fetch con auth
 */
export default function ProtectedImage({ serverPath, alt = '', style = {}, fallback = null }) {
  const [src,   setSrc]   = useState(null)
  const [error, setError] = useState(false)

  const isAbsolute  = serverPath && (serverPath.startsWith('http://') || serverPath.startsWith('https://'))
  const isPublicApi = serverPath && serverPath.startsWith('/api/public/')
  const isPublic    = isAbsolute || isPublicApi

  // URL que se pasa directamente al <img> para imágenes públicas
  const displayUrl = isAbsolute  ? serverPath
                   : isPublicApi ? `${BACKEND}${serverPath}`
                   : null

  useEffect(() => {
    if (!serverPath || isPublic) return
    let objectUrl = null

    // /api/files/... o legacy data/...
    const fetchUrl = serverPath.startsWith('/api/files/')
      ? `${BACKEND}${serverPath}`
      : `${API_BASE}/files/${serverPath.replace(/\\/g, '/').replace(/^data\//, '')}`

    const token = localStorage.getItem('foxint_token')
    fetch(fetchUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => { if (!res.ok) throw new Error(res.status); return res.blob() })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl) })
      .catch(() => setError(true))

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [serverPath]) // eslint-disable-line

  if (!serverPath) return fallback
  if (error)       return fallback
  if (isPublic)    return <img src={displayUrl} alt={alt} style={style} onError={() => setError(true)} />
  if (!src)        return <div style={{ background: '#F7F8FC', ...style }} />
  return <img src={src} alt={alt} style={style} />
}
