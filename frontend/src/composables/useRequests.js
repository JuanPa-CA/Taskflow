import { ref } from 'vue'
import { useRequestStore } from '@/store/requestStore'
import { requestService } from '@/services/requestService'

export const useRequests = () => {
  const store = useRequestStore()
  const loading = ref(false)
  const error = ref(null)

  const getSolicitud = async (id) => {
    loading.value = true
    error.value = null
    try {
      const data = await requestService.getSolicitud(id)
      const obj = data.solicitud || data
      store.upsertSolicitud(obj)
      return obj
    } catch (err) {
      error.value = err.message || 'Error al obtener la solicitud'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    store,
    loading,
    error,
    getSolicitud,
    fetchSolicitudes: store.fetchSolicitudes,
    fetchServicios: store.fetchServicios,
    crearSolicitud: store.crearSolicitud
  }
}
