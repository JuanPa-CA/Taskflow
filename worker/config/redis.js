import Redis from 'ioredis';
import { env } from './env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cliente Redis compartido.
 *
 * - `redisClient`      → cliente "normal" para BRPOP (consumir la cola) y LLEN.
 * - `publisherClient`  → cliente DEDICADO solo a PUBLISH de eventos.
 *
 * Nota técnica de ioredis: un cliente bloqueado en BRPOP no puede ejecutar otros
 * comandos mientras espera, y un cliente en modo subscribe tampoco puede publicar;
 * por eso se separan las conexiones (misma idea que backend/config/pubsub.js).
 */
function crearClienteRedis(nombre) {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    // null => ioredis reintenta los comandos de forma indefinida ante caídas,
    // lo que evita que un BRPOP en curso se rompa por un reinicio de Redis.
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      // backoff simple, tope de 5s entre reintentos
      return Math.min(times * 200, 5000);
    },
  });

  client.on('connect', () => {
    console.log(`[worker:redis] ${nombre} conectado: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  });
  client.on('ready', () => {
    console.log(`[worker:redis] ${nombre} listo`);
  });
  client.on('error', (err) => {
    console.error(`[worker:redis] ${nombre} error: ${err.message}`);
  });
  client.on('close', () => {
    console.warn(`[worker:redis] ${nombre} conexión cerrada`);
  });

  return client;
}

export const redisClient = crearClienteRedis('cola');
export const publisherClient = crearClienteRedis('publicador');

/**
 * Verifica (con reintentos básicos) que un cliente Redis esté listo al arrancar.
 * ioredis ya reintenta la conexión por su cuenta (retryStrategy); aquí solo
 * esperamos con logs claros para demostrar el arranque en vivo.
 */
export async function esperarRedis(client, nombre = 'redis', maxIntentos = 10, delayMs = 2000) {
  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    if (client.status === 'ready') {
      console.log(`[worker:redis] ${nombre} verificado y listo`);
      return;
    }
    console.warn(`[worker:redis] ${nombre} no está listo (intento ${intento}/${maxIntentos}); reintentando en ${delayMs / 1000}s...`);
    await sleep(delayMs);
  }
  throw new Error(`Redis (${nombre}) no quedó disponible tras ${maxIntentos} intentos`);
}

export default { redisClient, publisherClient, esperarRedis };
