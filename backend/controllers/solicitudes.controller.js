import * as solicitudesService from '../services/solicitudes.service.js';

/**
 * POST /api/solicitudes
 */
export async function registrar(req, res, next) {
  try {
    const { solicitud, cola } = await solicitudesService.crearSolicitud(req.body);

    res.status(201).json({
      ok: true,
      enCola: cola.encolada,
      posicionCola: cola.longitud,
      solicitud,
      data: solicitud,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/solicitudes?estado=&categoria=&buscar=&page=&limit=
 */
export async function listar(req, res, next) {
  try {
    const { estado, categoria, prioridad, page, limit } = req.query;
    const buscar = req.query.buscar || req.query.search;
    const resultado = await solicitudesService.listarSolicitudes({
      estado,
      categoria,
      prioridad,
      buscar,
      page,
      limit,
    });

    const cache = resultado.origen === 'cache' ? 'HIT' : 'MISS';
    res.set('X-Cache', cache);
    res.json({
      ok: true,
      ...resultado.data,
      solicitudes: resultado.data.items,
      cache,
      origen: cache === 'HIT' ? 'REDIS' : 'MONGODB',
    });
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

    res.json({ ok: true, solicitud, data: solicitud });
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

    res.json({ ok: true, solicitud, data: solicitud });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req, res, next) {
  try {
    const solicitud = await solicitudesService.eliminarSolicitud(req.params.id);
    res.json({ ok: true, id: solicitud.id, mensaje: 'Solicitud eliminada correctamente' });
  } catch (error) {
    next(error);
  }
}

export default { registrar, listar, obtenerPorId, obtenerRespuesta, eliminar };
