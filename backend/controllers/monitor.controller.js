import * as monitorService from '../services/monitor.service.js';

/**
 * GET /api/monitor
 * Devuelve el estado real de los 4 servicios de la arquitectura
 * (express, mongodb, redis, worker) con la forma { ok, servicios, generadoEn }.
 */
export async function obtener(req, res, next) {
  try {
    const { servicios, generadoEn } = await monitorService.obtenerEstadoServicios();
    res.json({ ok: true, servicios, generadoEn });
  } catch (error) {
    next(error);
  }
}

export default { obtener };
