/**
 * services/cache.service.js
 * ------------------------------------------------------------------
 * Servicio de CACHÉ (Redis, patrón cache-aside). Toda operación es
 * tolerante a fallos: si Redis no está disponible devuelve null/false
 * y la aplicación continúa consultando MongoDB (modo degradado).
 */
import { obtenerClienteRedis, redisDisponible, estadoRedis } from '../config/redis.config.js'
import { PREFIJO_CACHE, TTL } from '../constants/cache.constants.js'
import { logger } from '../utils/logger.js'

/** Construye una clave con prefijo: crearClave('solicitudes', filtro) */
export const construirClave = (...partes) =>
  [PREFIJO_CACHE, ...partes.filter((parte) => parte !== undefined && parte !== null && parte !== '')].join(':')

/** Lectura de caché: devuelve el valor deserializado o null (MISS). */
export const obtenerDeCache = async (clave) => {
  if (!redisDisponible()) return null
  try {
    const valor = await obtenerClienteRedis().get(clave)
    return valor ? JSON.parse(valor) : null
  } catch (error) {
    logger.warn(`Error leyendo caché (${clave}): ${error.message}`)
    return null
  }
}

/** Escritura en caché con TTL en segundos. */
export const guardarEnCache = async (clave, valor, ttl = TTL.LISTADO_SOLICITUDES) => {
  if (!redisDisponible()) return false
  try {
    await obtenerClienteRedis().set(clave, JSON.stringify(valor), 'EX', ttl)
    logger.debug(`CACHE SET -> ${clave} (ttl ${ttl}s)`)
    return true
  } catch (error) {
    logger.warn(`Error escribiendo caché (${clave}): ${error.message}`)
    return false
  }
}

export const eliminarDeCache = async (clave) => {
  if (!redisDisponible()) return false
  try {
    await obtenerClienteRedis().del(clave)
    return true
  } catch {
    return false
  }
}

/**
 * Cache-aside genérico. Devuelve el valor y de dónde provino, para que
 * los servicios puedan informar HIT/MISS sin duplicar lógica.
 */
export const recordar = async (clave, ttl, productor) => {
  const cacheado = await obtenerDeCache(clave)
  if (cacheado !== null) {
    return { valor: cacheado, origen: 'REDIS', cache: 'HIT' }
  }

  const valor = await productor()
  await guardarEnCache(clave, valor, ttl)
  return { valor, origen: 'MONGODB', cache: 'MISS' }
}

/** Lista las claves que cumplen un patrón usando SCAN (no bloquea Redis). */
export const listarClaves = async (patron = `${PREFIJO_CACHE}*`) => {
  if (!redisDisponible()) return []
  const cliente = obtenerClienteRedis()
  const claves = []
  let cursor = '0'

  try {
    do {
      const [siguiente, lote] = await cliente.scan(cursor, 'MATCH', patron, 'COUNT', 100)
      cursor = siguiente
      claves.push(...lote)
    } while (cursor !== '0')
  } catch (error) {
    logger.warn(`Error listando claves de caché: ${error.message}`)
  }

  return claves
}

/** Invalida en bloque todas las claves que cumplan el patrón. */
export const invalidarPorPatron = async (patron) => {
  if (!redisDisponible()) return 0

  const claves = await listarClaves(patron)
  if (claves.length === 0) return 0

  try {
    await obtenerClienteRedis().del(...claves)
    logger.debug(`CACHE INVALIDATE -> ${claves.length} claves (${patron})`)
    return claves.length
  } catch (error) {
    logger.warn(`Error invalidando caché (${patron}): ${error.message}`)
    return 0
  }
}

/** Estadísticas del caché para el monitor del sistema. */
export const estadisticasCache = async () => {
  if (!redisDisponible()) {
    return { disponible: false, estado: estadoRedis(), claves: 0, memoriaUsada: null }
  }

  try {
    const cliente = obtenerClienteRedis()
    const [claves, infoMemoria] = await Promise.all([listarClaves(), cliente.info('memory')])
    const memoria = /used_memory_human:(\S+)/.exec(infoMemoria)?.[1] || null

    return { disponible: true, estado: estadoRedis(), claves: claves.length, memoriaUsada: memoria }
  } catch (error) {
    return { disponible: false, estado: estadoRedis(), claves: 0, memoriaUsada: null, error: error.message }
  }
}
