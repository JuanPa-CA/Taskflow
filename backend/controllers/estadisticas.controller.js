import * as estadisticasService from '../services/estadisticas.service.js';

/**
 * GET /api/estadisticas
 * Responde con los indicadores del Dashboard y expone `origen`
 * ("cache" | "mongo") para poder demostrar CACHE HIT / CACHE MISS (HU-08).
 */
export async function obtener(req, res, next) {
  try {
    const { data, origen } = await estadisticasService.obtenerEstadisticas();

    res.json({ ok: true, origen, data });
  } catch (error) {
    next(error);
  }
}

export default { obtener };
