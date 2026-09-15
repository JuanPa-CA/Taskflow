import { io } from 'socket.io-client'
import { ref } from 'vue'

export const isSocketConnected = ref(false)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('[Socket.IO] Conectado al servidor:', socket.id)
  isSocketConnected.value = true
})

socket.on('disconnect', (reason) => {
  console.warn('[Socket.IO] Desconectado del servidor:', reason)
  isSocketConnected.value = false
})

socket.on('connect_error', (err) => {
  console.warn('[Socket.IO] Error de conexión:', err.message)
  isSocketConnected.value = false
})

export default {
  install(app) {
    app.config.globalProperties.$socket = socket
    app.provide('socket', socket)
  }
}