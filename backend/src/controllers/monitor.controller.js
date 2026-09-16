/**
 * controllers/monitor.controller.js
 * ------------------------------------------------------------------
 * Endpoints de monitoreo consumidos por la vista /monitor.
 */
import { asyncHandler } from '../middlewares/asyncHandler.js'
import * as monitorService from '../services/monitor.service.js'
import { estadisticasCache } from '../services/cache.service.js'

/** GET /monitor -> formato exacto que espera el store de Pinia. */
export const estado = asyncHandler(async (_req, res) => {
  const monitor = await monitorService.obtenerEstadoMonitor()
  res.status(200).json(monitor)
})

/** GET /monitor/salud -> versión reducida para healthchecks. */
export const salud = asyncHandler(async (_req, res) => {
  const monitor = await monitorService.obtenerEstadoMonitor()
  const cache = await estadisticasCache()

  res.status(monitor.ok ? 200 : 503).json({
    ok: monitor.ok,
    servicios: monitor.servicios,
    cache,
    timestamp: monitor.timestamp
  })
})

/** GET /monitor/cola -> inspección de la cola FIFO sin consumirla. */
export const cola = asyncHandler(async (_req, res) => {
  const monitor = await monitorService.obtenerEstadoMonitor()
  res.status(200).json({ ok: true, ...monitor.cola })
})
