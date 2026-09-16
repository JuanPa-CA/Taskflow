/**
 * controllers/indicador.controller.js
 * ------------------------------------------------------------------
 * Endpoints de indicadores/estadísticas para el dashboard (HU-08:
 * respuestas aceleradas con caché Redis).
 */
import { asyncHandler } from '../middlewares/asyncHandler.js'
import * as indicadorService from '../services/indicador.service.js'

/** GET /indicadores */
export const resumen = asyncHandler(async (_req, res) => {
  const indicadores = await indicadorService.obtenerResumen()

  res.status(200).json({
    ok: true,
    cache: indicadores.cache,
    origen: indicadores.origen,
    indicadores
  })
})

/** GET /indicadores/por-categoria */
export const porCategoria = asyncHandler(async (_req, res) => {
  const resultado = await indicadorService.obtenerPorCategoria()

  res.status(200).json({ ok: true, ...resultado })
})

/** GET /indicadores/por-prioridad */
export const porPrioridad = asyncHandler(async (_req, res) => {
  const resultado = await indicadorService.obtenerPorPrioridad()

  res.status(200).json({ ok: true, ...resultado })
})

/** GET /indicadores/tendencia?dias=7 */
export const tendencia = asyncHandler(async (req, res) => {
  const resultado = await indicadorService.obtenerTendencia({ dias: req.query.dias })

  res.status(200).json({ ok: true, ...resultado })
})

/** GET /indicadores/cola */
export const cola = asyncHandler(async (_req, res) => {
  const indicadores = await indicadorService.obtenerIndicadoresCola()

  res.status(200).json({ ok: true, ...indicadores })
})
