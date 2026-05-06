import { useEffect, useRef } from 'react'

const SSE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/events'

/**
 * Suscribe al stream SSE del backend y llama onEvent(tipo) cuando llega un evento.
 *
 * @param {string|string[]} eventTypes  - Nombre/s de evento SSE a escuchar (ej: 'pedido', 'pago')
 * @param {function}        onEvent     - Callback (tipo) => void
 *
 * La conexión se abre una vez y se mantiene viva. EventSource reconecta automáticamente
 * si la red cae. El ref interno garantiza que onEvent siempre usa el valor más reciente
 * aunque cambie entre renders.
 */
export function useSSE(eventTypes, onEvent) {
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    const token = localStorage.getItem('foxint_token')
    if (!token) return

    const url = `${SSE_URL}?token=${encodeURIComponent(token)}`
    const es  = new EventSource(url)

    const tipos = Array.isArray(eventTypes) ? eventTypes : [eventTypes]
    tipos.forEach(tipo => {
      es.addEventListener(tipo, () => cbRef.current(tipo))
    })

    return () => es.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
