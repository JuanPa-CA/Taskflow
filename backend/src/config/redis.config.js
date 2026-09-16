/**
 * config/redis.config.js
 * ------------------------------------------------------------------
 * Conexiones a Redis con ioredis:
 *  - cliente principal: caché (cache-aside) y cola FIFO de solicitudes.
 *  - cliente suscriptor: Pub/Sub para reenviar los eventos que publica
 *    el Worker hacia Socket.IO.
 *
 * Si Redis cae, el backend sigue respondiendo (modo degradado): los
 * servicios de caché/cola detectan la caída con `redisDisponible()`.
 */
import Redis from 'ioredis'
import { env } from './env.config.js'
import { logger } from '../utils/logger.js'

const opcionesBase = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: true,
  // Reintentos con espera creciente (máx. 30 s) para no saturar los logs
  // cuando Redis está caído; al volver, la conexión se restablece sola.
  retryStrategy: (intento) => Math.min(intento * 1000, 30000)
}

/** Mensaje legible para los errores de ioredis (algunos llegan vacíos). */
const describirError = (error) => error?.message || error?.code || error?.name || 'error desconocido'

/** Evita que el arranque quede colgado si Redis no responde. */
const conTimeout = (promesa, ms, mensaje) =>
  Promise.race([
    promesa,
    new Promise((_resolve, reject) => {
      const temporizador = setTimeout(() => reject(new Error(mensaje)), ms)
      temporizador.unref?.()
    })
  ])

if (env.REDIS_PASSWORD) opcionesBase.password = env.REDIS_PASSWORD

let clientePrincipal = null
let clienteSuscriptor = null

const crearCliente = (rol) => {
  const cliente = new Redis(opcionesBase)

  cliente.on('connect', () => logger.info(`Redis (${rol}) conectado a ${env.REDIS_HOST}:${env.REDIS_PORT}`))
  cliente.on('ready', () => logger.debug(`Redis (${rol}) listo para operar`))
  cliente.on('end', () => logger.warn(`Redis (${rol}) cerró la conexión`))
  cliente.on('error', (error) => logger.warn(`Redis (${rol}) error: ${describirError(error)}`))

  return cliente
}

/** Cliente de caché/cola (se crea una sola vez por proceso). */
export const obtenerClienteRedis = () => {
  if (!clientePrincipal) clientePrincipal = crearCliente('cache/cola')
  return clientePrincipal
}

/** Cliente dedicado a Pub/Sub (no puede compartirse con comandos normales). */
export const obtenerSuscriptorRedis = () => {
  if (!clienteSuscriptor) clienteSuscriptor = crearCliente('pub/sub')
  return clienteSuscriptor
}

export const conectarRedis = async () => {
  try {
    const cliente = obtenerClienteRedis()
    if (cliente.status === 'wait' || cliente.status === 'end') {
      // ioredis reintenta indefinidamente; se limita la espera para no
      // bloquear el arranque cuando Redis no está disponible.
      await conTimeout(
        cliente.connect(),
        env.REDIS_CONNECT_TIMEOUT_MS,
        `Redis no respondió en ${env.REDIS_CONNECT_TIMEOUT_MS} ms`
      )
    }
    await conTimeout(cliente.ping(), env.REDIS_CONNECT_TIMEOUT_MS, 'PING a Redis sin respuesta')
    logger.info('Redis operativo: caché y cola listas')
    return true
  } catch (error) {
    logger.warn(`Redis no disponible (modo degradado): ${error.message}`)
    return false
  }
}

/** `true` si el cliente principal está listo para recibir comandos. */
export const redisDisponible = () => Boolean(clientePrincipal && clientePrincipal.status === 'ready')

/** Estado legible usado por /monitor. */
export const estadoRedis = () => (clientePrincipal ? clientePrincipal.status : 'sin-conexion')

export const pingRedis = async () => {
  if (!redisDisponible()) return false
  try {
    return (await clientePrincipal.ping()) === 'PONG'
  } catch {
    return false
  }
}

export const desconectarRedis = async () => {
  const cierres = [clientePrincipal, clienteSuscriptor]
    .filter(Boolean)
    .map(async (cliente) => {
      try {
        await cliente.quit()
      } catch {
        cliente.disconnect()
      }
    })

  await Promise.allSettled(cierres)
  clientePrincipal = null
  clienteSuscriptor = null
  logger.info('Conexiones a Redis cerradas')
}
