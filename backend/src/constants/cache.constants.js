/**
 * constants/cache.constants.js
 * ------------------------------------------------------------------
 * Claves, prefijos y TTL (Time To Live) del caché Redis.
 * Estrategia CACHE-ASIDE: se consulta Redis antes de Mongo; en MISS
 * se consulta Mongo y se escribe el resultado en Redis con TTL.
 */
import { env } from '../config/env.config.js'

export const PREFIJO_CACHE = `${env.CACHE_PREFIX}:cache`

/**
 * Prefijo general del proyecto (sin el segmento `cache`). Se usa para
 * claves compartidas con el Worker que NO son caché (ej. su heartbeat).
 */
export const PREFIJO_PROYECTO = env.CACHE_PREFIX

/**
 * Patrones de clave usados por el cache-aside.
 * IMPORTANTE: todas las claves de caché viven bajo `<prefijo>:cache:*`
 * para que la invalidación por patrón NUNCA alcance otras estructuras de
 * Redis, en especial la cola FIFO `taskflow:solicitudes:cola`.
 */
export const CLAVE = Object.freeze({
  LISTADO_SOLICITUDES: `${PREFIJO_CACHE}:solicitudes:listado`,
  DETALLE_SOLICITUD: `${PREFIJO_CACHE}:solicitudes:detalle`, // reservada
  RESPUESTA_SOLICITUD: `${PREFIJO_CACHE}:solicitudes:respuesta`, // reservada
  INDICADORES: `${PREFIJO_CACHE}:indicadores`,
  CATEGORIAS: `${PREFIJO_CACHE}:categorias`,
  MONITOR: `${PREFIJO_CACHE}:monitor`, // reservada
  HEARTBEAT_WORKER: `${PREFIJO_PROYECTO}:worker:heartbeat`
})

/** Patrón que agrupa las claves de caché de solicitudes (para invalidar). */
export const PATRON_SOLICITUDES = `${PREFIJO_CACHE}:solicitudes*`
export const PATRON_INDICADORES = `${PREFIJO_CACHE}:indicadores*`
export const PATRON_CATEGORIAS = `${PREFIJO_CACHE}:categorias*`

/** Patrón de TODAS las claves de caché (nunca incluye la cola). */
export const PATRON_CACHE_COMPLETO = `${PREFIJO_CACHE}*`

export const TTL = Object.freeze({
  LISTADO_SOLICITUDES: env.CACHE_TTL_SOLICITUDES,
  DETALLE_SOLICITUD: Math.max(env.CACHE_TTL_SOLICITUDES, 120),
  INDICADORES: env.CACHE_TTL_INDICADORES,
  MONITOR: env.CACHE_TTL_MONITOR,
  CATEGORIAS: env.CACHE_TTL_CATEGORIAS,
  HEARTBEAT_WORKER: env.HEARTBEAT_WORKER_TTL
})
