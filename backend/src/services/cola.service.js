/**
 * services/cola.service.js
 * ------------------------------------------------------------------
 * Cola FIFO de solicitudes pendientes en Redis (lista nativa).
 *
 * Convención del contrato con el Worker:
 *   - El backend encola con RPUSH (agrega al final de la lista).
 *   - El Worker consume con BLPOP (toma el primero de la lista).
 *   - El Worker, al terminar, publica los eventos en `taskflow:eventos`
 *     y refresca la clave de heartbeat.
 */
import { obtenerClienteRedis, redisDisponible } from '../config/redis.config.js'
import { env } from '../config/env.config.js'
import { CLAVE } from '../constants/cache.constants.js'
import { TTL } from '../constants/cache.constants.js'
import { logger } from '../utils/logger.js'

export const NOMBRE_COLA = env.COLA_SOLICITUDES

/** Payload que recibe el Worker: solo lo mínimo para procesar. */
const construirCarga = (solicitud) => ({
  solicitudId: String(solicitud._id ?? solicitud.id),
  codigo: solicitud.codigo ?? null,
  categoria: solicitud.categoria,
  prioridad: solicitud.prioridad,
  titulo: solicitud.titulo,
  intentos: solicitud.intentos ?? 0,
  encoladaEn: new Date().toISOString()
})

export const encolarSolicitud = async (solicitud) => {
  if (!redisDisponible()) {
    logger.warn('Redis no disponible: la solicitud queda PENDIENTE sin encolar')
    return { encolada: false, motivo: 'REDIS_NO_DISPONIBLE', longitud: null, payload: null }
  }

  try {
    const carga = construirCarga(solicitud)
    const payload = JSON.stringify(carga)
    const longitud = await obtenerClienteRedis().rpush(NOMBRE_COLA, payload)
    logger.info(`Solicitud ${carga.solicitudId} encolada en ${NOMBRE_COLA} (posición ${longitud})`)
    return { encolada: true, motivo: null, longitud, payload: carga }
  } catch (error) {
    logger.error(`Error encolando solicitud: ${error.message}`)
    return { encolada: false, motivo: error.message, longitud: null, payload: null }
  }
}

/** Número de solicitudes pendientes en la cola (usado por /monitor). */
export const longitudCola = async () => {
  if (!redisDisponible()) return null
  try {
    return await obtenerClienteRedis().llen(NOMBRE_COLA)
  } catch {
    return null
  }
}

/** Inspección de la cola sin consumirla (solo diagnóstico). */
export const obtenerPendientes = async (inicio = 0, fin = -1) => {
  if (!redisDisponible()) return []
  try {
    const elementos = await obtenerClienteRedis().lrange(NOMBRE_COLA, inicio, fin)
    return elementos.map((item) => {
      try {
        return JSON.parse(item)
      } catch {
        return { payloadInvalido: item }
      }
    })
  } catch {
    return []
  }
}

/** Elimina una solicitud puntual de la cola (por si se cancela). */
export const desencolarSolicitud = async (solicitudId) => {
  if (!redisDisponible()) return 0
  const pendientes = await obtenerPendientes()
  const objetivo = pendientes.find((item) => item.solicitudId === String(solicitudId))
  if (!objetivo) return 0
  try {
    return await obtenerClienteRedis().lrem(NOMBRE_COLA, 0, JSON.stringify(objetivo))
  } catch {
    return 0
  }
}

export const limpiarCola = async () => {
  if (!redisDisponible()) return 0
  try {
    return await obtenerClienteRedis().del(NOMBRE_COLA)
  } catch {
    return 0
  }
}

/** El Worker renueva este latido cada pocos segundos. */
export const registrarLatidoWorker = async (datos = {}) => {
  if (!redisDisponible()) return false
  try {
    await obtenerClienteRedis().set(
      CLAVE.HEARTBEAT_WORKER,
      JSON.stringify({ estado: 'Activo', fecha: new Date().toISOString(), ...datos }),
      'EX',
      TTL.HEARTBEAT_WORKER
    )
    return true
  } catch {
    return false
  }
}

/** Lee el latido del Worker para saber si está vivo. */
export const obtenerLatidoWorker = async () => {
  if (!redisDisponible()) return null
  try {
    const valor = await obtenerClienteRedis().get(CLAVE.HEARTBEAT_WORKER)
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}
