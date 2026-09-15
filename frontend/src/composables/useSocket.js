import { onMounted, onUnmounted } from 'vue'
import { socket, isSocketConnected } from '@/plugins/socket'
import { useRequestStore } from '@/store/requestStore'

export const useSocket = () => {
  const store = useRequestStore()

  const on = (event, callback) => {
    socket.on(event, callback)
  }

  const off = (event, callback) => {
    if (callback) {
      socket.off(event, callback)
    } else {
      socket.off(event)
    }
  }

  const emit = (event, data) => {
    socket.emit(event, data)
  }

  // Set up all architecture-defined Socket.IO listeners
  const initGlobalListeners = () => {
    socket.on('solicitud-creada', (data) => store.handleSolicitudCreada(data))
    socket.on('solicitud-encolada', (data) => store.handleSolicitudEncolada(data))
    socket.on('solicitud-procesando', (data) => store.handleSolicitudProcesando(data))
    socket.on('solicitud-respondida', (data) => store.handleSolicitudRespondida(data))
    socket.on('solicitud-error', (data) => store.handleSolicitudError(data))
    socket.on('monitor-actualizado', (data) => store.handleMonitorActualizado(data))
    socket.on('cola-actualizada', (data) => {
      if (data?.servicios) store.handleMonitorActualizado(data)
    })
  }

  return {
    socket,
    isConnected: isSocketConnected,
    on,
    off,
    emit,
    initGlobalListeners
  }
}