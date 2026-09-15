import { apiClient } from '@/plugins/axios'

export const requestService = {
  async getSolicitudes(filtros = {}) {
    const params = {}
    if (filtros.categoria) params.categoria = filtros.categoria
    if (filtros.prioridad) params.prioridad = filtros.prioridad
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.search) params.search = filtros.search

    const startTime = performance.now()
    const response = await apiClient.get('/solicitudes', { params })
    const timeMs = Math.round(performance.now() - startTime)

    const rawCache = response.headers?.['x-cache'] || response.data?.cache
    const isHit = rawCache === 'HIT' || (typeof rawCache === 'string' && rawCache.toUpperCase().includes('HIT'))

    return {
      data: response.data,
      cacheInfo: {
        hit: isHit,
        source: isHit ? 'REDIS (CACHE HIT)' : 'MONGODB (CACHE MISS)',
        timeMs,
        fecha: new Date().toLocaleTimeString('es-CO')
      }
    }
  },

  async getSolicitud(id) {
    const response = await apiClient.get(`/solicitudes/${id}`)
    return response.data
  },

  async crearSolicitud(datos) {
    const response = await apiClient.post('/solicitudes', datos)
    return response.data
  },

  async actualizarSolicitud(id, datos) {
    const response = await apiClient.put(`/solicitudes/${id}`, datos)
    return response.data
  },

  async eliminarSolicitud(id) {
    const response = await apiClient.delete(`/solicitudes/${id}`)
    return response.data
  },

  async getMonitorStatus() {
    try {
      const response = await apiClient.get('/monitor')
      return response.data
    } catch {
      // Fallback if backend does not have /monitor endpoint yet
      return null
    }
  }
}