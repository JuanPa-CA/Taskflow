/**
 * middlewares/rateLimit.middleware.js
 * ------------------------------------------------------------------
 * Protección básica contra abuso: un límite general para toda la API
 * y uno más estricto para las operaciones de escritura (POST/PUT/DELETE),
 * donde se crea o modifica información.
 */
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.config.js'

const responderLimite = (mensaje) => ({
  ok: false,
  mensaje,
  fecha: new Date().toISOString()
})

export const limitadorGeneral = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: responderLimite('Demasiadas peticiones. Intente de nuevo en unos segundos.')
})

export const limitadorEscritura = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_ESCRITURA,
  standardHeaders: true,
  legacyHeaders: false,
  message: responderLimite('Demasiadas solicitudes de escritura. Espere un momento antes de reintentar.')
})
