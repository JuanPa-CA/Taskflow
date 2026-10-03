import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

/**
 * Cola de solicitudes pendientes (HU-04).
 * El backend SOLO encola; el Worker es quien hace BRPOP/RPOP sobre esta
 * misma key (REDIS_QUEUE_KEY) para consumir. Si el Worker está detenido,
 * las solicitudes simplemente se acumulan en la lista de Redis.
 */
const QUEUE_KEY = env.REDIS_QUEUE_KEY;

/**
 * Encola el id de una solicitud ya guardada en MongoDB.
 * LPUSH inserta al inicio; el Worker debe consumir con BRPOP/RPOP
 * (FIFO: el primero en entrar es el primero en salir).
 */
export async function encolarSolicitud(solicitudId) {
  return redisClient.lpush(QUEUE_KEY, String(solicitudId));
}

/**
 * Cantidad de solicitudes esperando ser tomadas por el Worker.
 * Útil para el Dashboard/Monitor (HU-09).
 */
export async function longitudCola() {
  return redisClient.llen(QUEUE_KEY);
}

export async function desencolarSolicitud(solicitudId) {
  return redisClient.lrem(QUEUE_KEY, 0, String(solicitudId));
}

export default { encolarSolicitud, longitudCola, desencolarSolicitud, QUEUE_KEY };
