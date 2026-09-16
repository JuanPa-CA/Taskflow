/**
 * middlewares/cache.middleware.js
 * ------------------------------------------------------------------
 * Implementa el patrón CACHE-ASIDE a nivel HTTP para endpoints GET:
 *   1. Construye una clave de caché a partir de la URL y sus filtros.
 *   2. Si existe en Redis  -> responde con X-Cache: HIT  (no toca Mongo).
 *   3. Si no existe        -> responde con X-Cache: MISS y guarda en Redis
 *                             el cuerpo de la respuesta (sin bloquear).
 *
 * El header X-Cache es lo que el frontend muestra en el indicador
 * Redis vs MongoDB de la HU-08.
 */
import { construirClave, guardarEnCache, obtenerDeCache } from '../services/cache.service.js'
import { TTL } from '../constants/cache.constants.js'
import { logger } from '../utils/logger.js'

export const cachearRespuesta = ({ prefijo = 'general', ttl = TTL.LISTADO_SOLICITUDES, claveFn } = {}) => {
  return async (req, res, next) => {
    const clave = claveFn ? claveFn(req) : construirClave(prefijo, req.originalUrl)
    const cacheado = await obtenerDeCache(clave)

    res.set('X-Cache', cacheado ? 'HIT' : 'MISS')
    res.set('X-Cache-Source', cacheado ? 'REDIS' : 'MONGODB')
    res.set('X-Cache-Key', clave)

    if (cacheado) {
      logger.debug(`CACHE HIT -> ${clave}`)
      return res.status(200).json({ ...cacheado, cache: 'HIT' })
    }

    // Interceptamos res.json para almacenar el resultado en Redis.
    const jsonOriginal = res.json.bind(res)
    res.json = (cuerpo) => {
      if (res.statusCode < 400 && cuerpo && typeof cuerpo === 'object') {
        guardarEnCache(clave, cuerpo, ttl).catch((error) =>
          logger.warn(`No fue posible escribir en caché ${clave}: ${error.message}`)
        )
        return jsonOriginal({ ...cuerpo, cache: 'MISS' })
      }
      return jsonOriginal(cuerpo)
    }

    return next()
  }
}
