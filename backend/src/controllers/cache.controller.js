/**
 * controllers/cache.controller.js
 * ------------------------------------------------------------------
 * Administración del caché Redis: inspección y limpieza de claves.
 * Es el endpoint que soporta la demostración HU-08 (ver un MISS y
 * luego un HIT) desde la vista /monitor o /solicitudes.
 */
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { estadisticasCache, invalidarPorPatron, listarClaves } from '../services/cache.service.js'
import { PATRON_CACHE_COMPLETO, PATRON_SOLICITUDES } from '../constants/cache.constants.js'

/** GET /cache -> claves activas y uso de memoria. */
export const estado = asyncHandler(async (_req, res) => {
  const [estadisticas, claves] = await Promise.all([estadisticasCache(), listarClaves()])

  res.status(200).json({
    ok: true,
    cache: estadisticas,
    claves
  })
})

/** DELETE /cache?patron=taskflow:cache:indicadores* -> invalida por patrón. */
export const limpiar = asyncHandler(async (req, res) => {
  const patron = req.query.patron || PATRON_CACHE_COMPLETO
  const eliminadas = await invalidarPorPatron(patron)

  res.status(200).json({
    ok: true,
    mensaje: `Caché invalidado (${eliminadas} claves eliminadas)`,
    patron,
    eliminadas
  })
})

/** DELETE /cache/solicitudes -> invalida solo lo relacionado con solicitudes. */
export const limpiarSolicitudes = asyncHandler(async (_req, res) => {
  const eliminadas = await invalidarPorPatron(PATRON_SOLICITUDES)

  res.status(200).json({
    ok: true,
    mensaje: `Caché de solicitudes invalidado (${eliminadas} claves)`,
    eliminadas
  })
})
