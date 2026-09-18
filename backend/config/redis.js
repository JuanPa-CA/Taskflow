import Redis from 'ioredis';
import { env } from './env.js';

/**
 * Cliente Redis compartido (caché + cola de solicitudes pendientes).
 * Se conecta por nombre de servicio de Docker Compose, ej: redisserver:6379.
 *
 * Nota: el Worker abre su propia conexión (proceso/contenedor aparte);
 * este cliente es solo para el API.
 */
export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // backoff simple, tope de 5s entre reintentos
    return Math.min(times * 200, 5000);
  },
});

redisClient.on('connect', () => {
  console.log('[redis] conectado:', env.REDIS_HOST + ':' + env.REDIS_PORT);
});

redisClient.on('error', (err) => {
  console.error('[redis] error de conexión:', err.message);
});

export default redisClient;
