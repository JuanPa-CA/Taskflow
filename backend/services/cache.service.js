import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

/**
 * Patrón cache-aside (HU-08).
 *
 * - CACHE HIT: la key existe en Redis -> se devuelve tal cual, sin tocar Mongo.
 * - CACHE MISS: no existe -> se ejecuta `fetchFn` (consulta a Mongo),
 *   se guarda el resultado en Redis con TTL y se devuelve.
 *
 * Devuelve también `origen` ("cache" | "mongo") para que el controller
 * pueda exponerlo y así demostrar CACHE HIT / CACHE MISS en la evidencia.
 */
export async function getOrSetCache(key, fetchFn, ttlSeconds = env.CACHE_TTL_SECONDS) {
  const cacheado = await redisClient.get(key);

  if (cacheado) {
    return { data: JSON.parse(cacheado), origen: 'cache' };
  }

  const data = await fetchFn();

  // EX = expiración en segundos (TTL exigido por el taller).
  await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);

  return { data, origen: 'mongo' };
}

/**
 * Invalida una key puntual (ej: al crear una solicitud, invalidar
 * el caché de estadísticas para que el próximo GET recalcule).
 */
export async function invalidateCache(key) {
  await redisClient.del(key);
}

/**
 * Invalida todas las keys que coincidan con un patrón
 * (ej: "taskflow:cache:solicitudes:listado:*" si el listado se cachea
 * por página/filtros). Usa SCAN en vez de KEYS para no bloquear Redis.
 */
export async function invalidateCacheByPattern(pattern) {
  const stream = redisClient.scanStream({ match: pattern, count: 100 });

  const keysToDelete = [];
  for await (const keys of stream) {
    keysToDelete.push(...keys);
  }

  if (keysToDelete.length > 0) {
    await redisClient.del(...keysToDelete);
  }
}

export default { getOrSetCache, invalidateCache, invalidateCacheByPattern };
