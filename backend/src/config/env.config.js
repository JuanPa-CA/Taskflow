/**
 * config/env.config.js
 * ------------------------------------------------------------------
 * Capa de CONFIGURACIÓN: carga las variables de entorno (.env) y las
 * expone tipadas y centralizadas. Ningún otro módulo debe usar
 * `process.env` directamente.
 */
import dotenv from 'dotenv'

dotenv.config()

const aNumero = (valor, porDefecto) => {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : porDefecto
}

const aLista = (valor, porDefecto = []) => {
  if (!valor) return porDefecto
  return String(valor)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Servidor HTTP
  PORT: aNumero(process.env.PORT, 3000),
  HOST: process.env.HOST || '0.0.0.0',

  // Persistencia
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow',

  // Redis (caché + cola)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: aNumero(process.env.REDIS_PORT, 6379),
  REDIS_DB: aNumero(process.env.REDIS_DB, 0),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,
  REDIS_CONNECT_TIMEOUT_MS: aNumero(process.env.REDIS_CONNECT_TIMEOUT_MS, 4000),

  // Cola y eventos (contrato compartido con el Worker)
  COLA_SOLICITUDES: process.env.COLA_SOLICITUDES || 'taskflow:solicitudes:cola',
  CANAL_EVENTOS: process.env.CANAL_EVENTOS || 'taskflow:eventos',

  // Caché
  CACHE_PREFIX: process.env.CACHE_PREFIX || 'taskflow',
  CACHE_TTL_SOLICITUDES: aNumero(process.env.CACHE_TTL_SOLICITUDES, 60),
  CACHE_TTL_INDICADORES: aNumero(process.env.CACHE_TTL_INDICADORES, 30),
  CACHE_TTL_MONITOR: aNumero(process.env.CACHE_TTL_MONITOR, 5),
  CACHE_TTL_CATEGORIAS: aNumero(process.env.CACHE_TTL_CATEGORIAS, 300),
  HEARTBEAT_WORKER_TTL: aNumero(process.env.HEARTBEAT_WORKER_TTL, 30),

  // CORS
  CORS_ORIGIN: aLista(process.env.CORS_ORIGIN, ['http://localhost:5173', 'http://localhost']),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: aNumero(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  RATE_LIMIT_MAX: aNumero(process.env.RATE_LIMIT_MAX, 300),
  RATE_LIMIT_MAX_ESCRITURA: aNumero(process.env.RATE_LIMIT_MAX_ESCRITURA, 60),

  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug'
})

export const esProduccion = env.NODE_ENV === 'production'
export const esDesarrollo = env.NODE_ENV === 'development'
