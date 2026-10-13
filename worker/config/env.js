import dotenv from 'dotenv';

dotenv.config();

/**
 * Punto único de lectura de variables de entorno del Worker.
 * Si falta una variable obligatoria, el proceso se detiene al arrancar
 * (mejor fallar rápido en el boot que a mitad del procesamiento).
 */
const required = ['MONGO_URI', 'REDIS_HOST', 'REDIS_PORT'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[worker:config] Falta la variable de entorno obligatoria: ${key}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGO_URI: process.env.MONGO_URI,

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  // Misma key de cola que usa el backend (LPUSH). El Worker consume con BRPOP.
  REDIS_QUEUE_KEY: process.env.REDIS_QUEUE_KEY || 'taskflow:queue:solicitudes',

  // Canal de Redis Pub/Sub donde el Worker publica los cambios de estado.
  REDIS_EVENTS_CHANNEL: process.env.REDIS_EVENTS_CHANNEL || 'taskflow:eventos',

  // Clave Redis que el Worker actualiza cada 5 s como "heartbeat"
  // (el backend la consulta en GET /api/monitor). Debe coincidir con la del backend.
  REDIS_WORKER_HEARTBEAT_KEY: process.env.REDIS_WORKER_HEARTBEAT_KEY || 'taskflow:worker:heartbeat',
};

export default env;
