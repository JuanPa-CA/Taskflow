/**
 * sockets/pubsub.socket.js
 * ------------------------------------------------------------------
 * Puente Redis Pub/Sub -> Socket.IO.
 *
 * El Worker (servicio aparte) NO se conecta por WebSocket: cuando
 * procesa una solicitud publica un mensaje en el canal
 * `taskflow:eventos` con la forma:
 *
 *   { "evento": "solicitud-respondida",
 *     "data": { "id": "...", "respuesta": "...", "estado": "RESPONDIDA" } }
 *
 * El backend escucha ese canal y lo retransmite a todos los clientes
 * WebSocket conectados. Así el Worker nunca necesita conocer Socket.IO.
 */
import { obtenerSuscriptorRedis } from '../config/redis.config.js'
import { env } from '../config/env.config.js'
import { reenviarEventoWorker } from '../services/socket.service.js'
import { logger } from '../utils/logger.js'

const manejarMensaje = (canal, mensaje) => {
  if (canal !== env.CANAL_EVENTOS) return

  try {
    const { evento, data } = JSON.parse(mensaje)
    if (!evento) {
      logger.warn('Mensaje Pub/Sub sin campo "evento"')
      return
    }
    reenviarEventoWorker(evento, data ?? {})
  } catch (error) {
    logger.warn(`Mensaje Pub/Sub inválido en ${canal}: ${error.message}`)
  }
}

const activarSuscripcion = async (suscriptor) => {
  try {
    await suscriptor.subscribe(env.CANAL_EVENTOS)
    logger.info(`Backend suscrito al canal de eventos: ${env.CANAL_EVENTOS}`)
  } catch (error) {
    logger.warn(`No fue posible suscribirse a ${env.CANAL_EVENTOS}: ${error.message}`)
  }
}

export const suscribirEventosWorker = async () => {
  const suscriptor = obtenerSuscriptorRedis()

  suscriptor.on('message', manejarMensaje)
  // Tras una reconexión, ioredis vuelve a suscribir; se refuerza explícitamente.
  suscriptor.on('ready', () => activarSuscripcion(suscriptor))

  if (suscriptor.status === 'ready') {
    return activarSuscripcion(suscriptor)
  }

  if (suscriptor.status === 'wait' || suscriptor.status === 'end') {
    try {
      // Igual que en el cliente principal, se limita la espera para no
      // bloquear el arranque cuando Redis no está disponible.
      await Promise.race([
        suscriptor.connect(),
        new Promise((_resolve, reject) => {
          const temporizador = setTimeout(() => reject(new Error('Pub/Sub sin respuesta')), env.REDIS_CONNECT_TIMEOUT_MS)
          temporizador.unref?.()
        })
      ])
      return activarSuscripcion(suscriptor)
    } catch (error) {
      logger.warn(`Pub/Sub no disponible (los eventos del Worker no se retransmitirán): ${error.message}`)
      return null
    }
  }

  return null
}
