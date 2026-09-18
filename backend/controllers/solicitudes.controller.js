import * as solicitudesService from '../services/solicitudes.service.js';

/**
 * POST /api/solicitudes
 */
export async function registrar(req, res, next) {
  try {
    const { titulo, descripcion, categoria, prioridad } = req.body;
    const solicitud = await solicitudesService.crearSolicitud({
      titulo,
      descripcion,
      categoria,
      prioridad,
    });

    res.status(201).json({ ok: true, data: solicitud });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/solicitudes?estado=&categoria=&buscar=&page=&limit=
 */
export async function listar(req, res, next) {
  try {
    const { estado, categoria, buscar, page, limit } = req.query;
    const resultado = await solicitudesService.listarSolicitudes({
      estado,
      categoria,
      buscar,
      page,
      limit,
    });

    res.json({ ok: true, ...resultado });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/solicitudes/:id
 */
export async function obtenerPorId(req, res, next) {
  try {
    const solicitud = await solicitudesService.obtenerSolicitudPorId(req.params.id);

    if (!solicitud) {
      return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });
    }

    res.json({ ok: true, data: solicitud });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/solicitudes/:id/respuesta
 */
export async function obtenerRespuesta(req, res, next) {
  try {
    const solicitud = await solicitudesService.obtenerRespuesta(req.params.id);

    if (!solicitud) {
      return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });
    }

    res.json({ ok: true, data: solicitud });
  } catch (error) {
    next(error);
  }
}

export default { registrar, listar, obtenerPorId, obtenerRespuesta };
