/**
 * middlewares/notFound.middleware.js
 * ------------------------------------------------------------------
 * Responde 404 con la lista de endpoints disponibles cuando la ruta
 * solicitada no existe (último middleware antes del manejador de errores).
 */
import { logger } from '../utils/logger.js'

export const ENDPOINTS_DISPONIBLES = Object.freeze([
  'GET    /',
  'GET    /health',
  'GET    /solicitudes?categoria=&prioridad=&estado=&search=&page=&limit=',
  'POST   /solicitudes',
  'GET    /solicitudes/:id',
  'GET    /solicitudes/:id/respuesta',
  'PUT    /solicitudes/:id',
  'PATCH  /solicitudes/:id/estado',
  'DELETE /solicitudes/:id',
  'GET    /categorias',
  'POST   /categorias',
  'PUT    /categorias/:id',
  'DELETE /categorias/:id',
  'GET    /indicadores',
  'GET    /indicadores/por-categoria',
  'GET    /indicadores/por-prioridad',
  'GET    /indicadores/tendencia?dias=7',
  'GET    /indicadores/cola',
  'GET    /monitor',
  'GET    /monitor/salud',
  'GET    /cache',
  'DELETE /cache',
  'DELETE /cache/solicitudes'
])

export const rutaNoEncontrada = (req, res) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`)
  return res.status(404).json({
    ok: false,
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe en la API de TASKFLOW`,
    endpoints: ENDPOINTS_DISPONIBLES
  })
}
