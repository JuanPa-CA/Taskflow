import dotenv from 'dotenv';

dotenv.config();

/**
 * Punto único de lectura de variables de entorno.
 * Si falta una variable obligatoria, el proceso se detiene al arrancar
 * (mejor fallar rápido en el boot que a mitad de una petición).
 */
const required = ['MONGO_URI', 'REDIS_HOST', 'REDIS_PORT'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[config] Falta la variable de entorno obligatoria: ${key}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,

  MONGO_URI: process.env.MONGO_URI,

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  REDIS_QUEUE_KEY: process.env.REDIS_QUEUE_KEY || 'taskflow:queue:solicitudes',
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS) || 60,
  CACHE_KEY_ESTADISTICAS: 'taskflow:cache:estadisticas',
  CACHE_KEY_SOLICITUDES_LISTADO: 'taskflow:cache:solicitudes:listado',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
};

export default env;
