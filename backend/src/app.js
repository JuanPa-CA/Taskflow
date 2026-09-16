/**
 * app.js
 * ------------------------------------------------------------------
 * Configuración de la aplicación Express (sin escuchar puerto):
 * middlewares globales, rutas y manejo de errores.
 * Se separa de `server.js` para poder probar la app de forma aislada.
 */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env, esDesarrollo } from './config/env.config.js'
import routes from './routes/index.routes.js'
import { limitadorGeneral } from './middlewares/rateLimit.middleware.js'
import { rutaNoEncontrada } from './middlewares/notFound.middleware.js'
import { manejadorErrores } from './middlewares/errorHandler.middleware.js'
import { logger } from './utils/logger.js'

const app = express()

// --- Seguridad y utilidades base ---
app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Cache', 'X-Cache-Source', 'X-Cache-Key', 'X-Total-Count'],
    credentials: true
  })
)

// --- Parseo de cuerpo y logs de peticiones ---
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(esDesarrollo ? 'dev' : 'combined', { stream: { write: (mensaje) => logger.info(mensaje.trim()) } }))

// --- Límite general de peticiones ---
app.use(limitadorGeneral)

// --- Rutas de la API ---
app.use(routes)

// --- 404 y manejo centralizado de errores (siempre al final) ---
app.use(rutaNoEncontrada)
app.use(manejadorErrores)

export default app
