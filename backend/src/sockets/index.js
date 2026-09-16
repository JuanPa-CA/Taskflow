/**
 * sockets/index.js
 * ------------------------------------------------------------------
 * Inicializa el servidor Socket.IO sobre el servidor HTTP de Express,
 * registra los eventos que el cliente (Vue) puede emitir y arranca el
 * puente Redis Pub/Sub para reenviar los eventos generados por el Worker
 * (solicitud-procesando, solicitud-respondida, solicitud-error).
 */
import { Server } from 'socket.io'
import { crearOpcionesSocket } from '../config/socket.config.js'
import { EVENTO, EVENTO_CLIENTE, SALA } from '../constants/eventos.constants.js'
import { emitirMonitorActualizado, registrarServidorSocket } from '../services/socket.service.js'
import { obtenerEstadoMonitor } from '../services/monitor.service.js'
import { suscribirEventosWorker } from './pubsub.socket.js'
import { logger } from '../utils/logger.js'

const enviarMonitor = async (socket) => {
  try {
    socket.emit(EVENTO.MONITOR_ACTUALIZADO, await obtenerEstadoMonitor())
  } catch (error) {
    logger.warn(`No fue posible enviar el estado del monitor: ${error.message}`)
  }
}

export const inicializarSockets = (httpServer) => {
  const io = new Server(httpServer, crearOpcionesSocket())
  registrarServidorSocket(io)

  io.on('connection', (socket) => {
    logger.info(`Cliente Socket.IO conectado: ${socket.id}`)
    socket.join(SALA.TODAS)

    // Estado inicial del monitor: el dashboard se pinta sin esperar el primer cambio.
    enviarMonitor(socket)

    socket.on(EVENTO_CLIENTE.UNIRSE_SALA, (sala) => {
      if (Object.values(SALA).includes(sala)) {
        socket.join(sala)
        logger.debug(`Socket ${socket.id} se unió a la sala ${sala}`)
      }
    })

    socket.on(EVENTO_CLIENTE.SALIR_SALA, (sala) => {
      if (Object.values(SALA).includes(sala)) socket.leave(sala)
    })

    socket.on(EVENTO_CLIENTE.SOLICITAR_MONITOR, () => enviarMonitor(socket))

    socket.on('disconnect', (motivo) => {
      logger.info(`Cliente Socket.IO desconectado: ${socket.id} (${motivo})`)
    })
  })

  // Eventos emitidos por el Worker a través del canal Redis.
  suscribirEventosWorker()

  logger.info('Servidor Socket.IO inicializado')
  return io
}

export const cerrarSockets = async (io) => {
  if (!io) return
  await new Promise((resolve) => io.close(resolve))
  logger.info('Servidor Socket.IO cerrado')
}
