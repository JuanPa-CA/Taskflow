import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { requestService } from '@/services/requestService'

export const useRequestStore = defineStore('requestStore', () => {
  const solicitudes = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = ref({
    categoria: '',
    prioridad: '',
    estado: '',
    search: ''
  })

  const servicios = ref({
    express: { status: 'Desconectado', ok: false },
    mongodb: { status: 'Desconectado', ok: false },
    redis: { status: 'Desconectado', ok: false },
    worker: { status: 'Desconectado', ok: false }
  })

  const metricas = ref({
    enCola: 0,
    procesando: 0,
    respondidas: 0,
    errores: 0
  })

  // Toasts de notificaciones en tiempo real
  const toasts = ref([])
  const addToast = (tipo, mensaje, duracion = 4500) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, tipo, mensaje })
    setTimeout(() => {
      removeToast(id)
    }, duracion)
  }
  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Información de Caché Redis vs MongoDB (HU-08)
  const cacheInfo = ref({
    source: null,
    hit: false,
    timeMs: null,
    fecha: null
  })
  const cacheHistory = ref([])

  const eventLogs = ref([])

  const addLog = (tipo, mensaje) => {
    eventLogs.value.unshift({
      id: Date.now() + Math.random(),
      hora: new Date().toLocaleTimeString('es-CO'),
      tipo,
      mensaje
    })
    if (eventLogs.value.length > 50) {
      eventLogs.value.pop()
    }
  }

  // Computed counts
  const totalSolicitudes = computed(() => solicitudes.value.length)
  const pendientesCount = computed(() => solicitudes.value.filter(s => s.estado === 'PENDIENTE').length)
  const enColaCount = computed(() => solicitudes.value.filter(s => s.estado === 'EN COLA').length)
  const procesandoCount = computed(() => solicitudes.value.filter(s => s.estado === 'PROCESANDO').length)
  const respondidasCount = computed(() => solicitudes.value.filter(s => s.estado === 'RESPONDIDA').length)
  const erroresCount = computed(() => solicitudes.value.filter(s => s.estado === 'ERROR').length)

  // Filtered requests
  const solicitudesFiltradas = computed(() => {
    return solicitudes.value.filter(item => {
      const matchCategoria = !filtros.value.categoria || item.categoria === filtros.value.categoria
      const matchPrioridad = !filtros.value.prioridad || item.prioridad === filtros.value.prioridad
      const matchEstado = !filtros.value.estado || item.estado === filtros.value.estado
      
      const search = (filtros.value.search || '').toLowerCase().trim()
      const matchSearch = !search || 
        (item.titulo && item.titulo.toLowerCase().includes(search)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(search)) ||
        (item._id && item._id.toString().toLowerCase().includes(search)) ||
        (item.id && item.id.toString().toLowerCase().includes(search))

      return matchCategoria && matchPrioridad && matchEstado && matchSearch
    })
  })

  // Actions
  const fetchSolicitudes = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await requestService.getSolicitudes(filtros.value)
      const data = res?.data !== undefined ? res.data : res
      solicitudes.value = Array.isArray(data) ? data : (data.solicitudes || [])
      
      if (res?.cacheInfo) {
        cacheInfo.value = res.cacheInfo
        cacheHistory.value.unshift(res.cacheInfo)
        if (cacheHistory.value.length > 10) cacheHistory.value.pop()
      }
    } catch (err) {
      error.value = err.message || 'Error al conectar con la API'
    } finally {
      loading.value = false
    }
  }

  const marcarServiciosDesconectados = () => {
    servicios.value = {
      express: { status: 'Desconectado', ok: false },
      mongodb: { status: 'Desconectado', ok: false },
      redis: { status: 'Desconectado', ok: false },
      worker: { status: 'Desconectado', ok: false }
    }
  }

  const fetchServicios = async () => {
    try {
      const status = await requestService.getMonitorStatus()
      if (status?.servicios) {
        servicios.value = { ...servicios.value, ...status.servicios }
      } else {
        marcarServiciosDesconectados()
      }
      if (status?.metricas) {
        metricas.value = { ...metricas.value, ...status.metricas }
      }
    } catch {
      marcarServiciosDesconectados()
    }
  }

  // Prueba explícita para HU-08 (Demostración de Cache Hit vs Cache Miss)
  const testCacheQuery = async () => {
    return await fetchSolicitudes()
  }

  const crearSolicitud = async (nueva) => {
    loading.value = true
    error.value = null
    try {
      const creada = await requestService.crearSolicitud(nueva)
      const obj = creada.solicitud || creada
      upsertSolicitud(obj)
      addLog('creada', `Solicitud creada: "${obj.titulo}" (ID: ${obj._id || obj.id})`)
      addToast('success', `Solicitud #${(obj._id || obj.id || '').toString().slice(-6)} registrada con éxito`)
      return obj
    } catch (err) {
      error.value = err.message
      addToast('error', `Error al registrar solicitud: ${err.message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  const upsertSolicitud = (item) => {
    if (!item) return
    const id = item._id || item.id
    const index = solicitudes.value.findIndex(s => (s._id || s.id) === id)
    if (index !== -1) {
      solicitudes.value[index] = { ...solicitudes.value[index], ...item }
    } else {
      solicitudes.value.unshift(item)
    }
  }

  // Socket.IO event handlers
  const handleSolicitudCreada = (data) => {
    const item = data?.solicitud || data
    if (item) {
      upsertSolicitud(item)
      addLog('creada', `[Socket] Solicitud creada: "${item.titulo}"`)
      addToast('info', `Nueva solicitud recibida: "${item.titulo}"`)
    }
  }

  const handleSolicitudEncolada = (data) => {
    const id = data?.id || data?._id || data?.solicitudId
    if (id) {
      const item = solicitudes.value.find(s => (s._id || s.id) === id)
      if (item) {
        item.estado = 'EN COLA'
        if (data.solicitud) Object.assign(item, data.solicitud)
      } else if (data.solicitud) {
        upsertSolicitud(data.solicitud)
      }
      addLog('cola', `[Socket] Solicitud #${id} ingresó a la cola Redis`)
      addToast('info', `Solicitud #${id.toString().slice(-6)} encolada en Redis`)
    }
  }

  const handleSolicitudProcesando = (data) => {
    const id = data?.id || data?._id || data?.solicitudId
    if (id) {
      const item = solicitudes.value.find(s => (s._id || s.id) === id)
      if (item) {
        item.estado = 'PROCESANDO'
        if (data.solicitud) Object.assign(item, data.solicitud)
      } else if (data.solicitud) {
        upsertSolicitud(data.solicitud)
      }
      addLog('procesando', `[Socket] Worker inició el procesamiento de solicitud #${id}`)
      addToast('info', `Worker procesando solicitud #${id.toString().slice(-6)}`)
    }
  }

  const handleSolicitudRespondida = (data) => {
    const id = data?.id || data?._id || data?.solicitudId
    if (id) {
      const item = solicitudes.value.find(s => (s._id || s.id) === id)
      if (item) {
        item.estado = 'RESPONDIDA'
        item.respuesta = data.respuesta || data.solicitud?.respuesta || item.respuesta
        item.fechaProcesamiento = data.fechaProcesamiento || new Date().toISOString()
        if (data.solicitud) Object.assign(item, data.solicitud)
      } else if (data.solicitud) {
        upsertSolicitud(data.solicitud)
      }
      addLog('respondida', `[Socket] Solicitud #${id} procesada con respuesta exitosa`)
      addToast('success', `¡Solicitud #${id.toString().slice(-6)} respondida con éxito!`)
    }
  }

  const handleSolicitudError = (data) => {
    const id = data?.id || data?._id || data?.solicitudId
    if (id) {
      const item = solicitudes.value.find(s => (s._id || s.id) === id)
      if (item) {
        item.estado = 'ERROR'
        item.mensajeError = data.mensajeError || data.error || 'Error durante el procesamiento'
        if (data.solicitud) Object.assign(item, data.solicitud)
      } else if (data.solicitud) {
        upsertSolicitud(data.solicitud)
      }
      addLog('error', `[Socket] Error procesando solicitud #${id}: ${data.mensajeError || data.error || ''}`)
      addToast('error', `Error en solicitud #${id.toString().slice(-6)}`)
    }
  }

  const handleMonitorActualizado = (data) => {
    if (data?.servicios) {
      servicios.value = { ...servicios.value, ...data.servicios }
    }
    if (data?.metricas) {
      metricas.value = { ...metricas.value, ...data.metricas }
    }
  }

  const setFiltros = (nuevos) => {
    filtros.value = { ...filtros.value, ...nuevos }
  }

  const resetFiltros = () => {
    filtros.value = {
      categoria: '',
      prioridad: '',
      estado: '',
      search: ''
    }
  }

  const setServicioStatus = (servicio, status, ok = true) => {
    servicios.value[servicio] = { status, ok }
  }

  return {
    solicitudes,
    loading,
    error,
    filtros,
    servicios,
    metricas,
    toasts,
    addToast,
    removeToast,
    cacheInfo,
    cacheHistory,
    testCacheQuery,
    eventLogs,
    totalSolicitudes,
    pendientesCount,
    enColaCount,
    procesandoCount,
    respondidasCount,
    erroresCount,
    solicitudesFiltradas,
    fetchSolicitudes,
    fetchServicios,
    crearSolicitud,
    upsertSolicitud,
    handleSolicitudCreada,
    handleSolicitudEncolada,
    handleSolicitudProcesando,
    handleSolicitudRespondida,
    handleSolicitudError,
    handleMonitorActualizado,
    setFiltros,
    resetFiltros,
    setServicioStatus,
    addLog
  }
})