/**
 * controllers/solicitud.controller.js
 * ------------------------------------------------------------------
 * Controladores HTTP del dominio de solicitudes. No contienen lógica
 * de negocio: extraen datos de `req`, delegan en `solicitud.service`
 * y devuelven la respuesta con el formato que consume el frontend.
 */
import { asyncHandler } from '../middlewares/asyncHandler.js'
import * as solicitudService from '../services/solicitud.service.js'

/** GET /solicitudes -> { ok, total, page, limit, cache, solicitudes } */
export const listar = asyncHandler(async (req, res) => {
  const resultado = await solicitudService.listarSolicitudes(req.query)

  res.status(200).json({
    ok: true,
    ...resultado,
    cache: res.get('X-Cache') || 'MISS',
    origen: res.get('X-Cache') === 'HIT' ? 'REDIS' : 'MONGODB'
  })
})

/** POST /solicitudes -> 201 con la solicitud creada y el estado de la cola */
export const crear = asyncHandler(async (req, res) => {
  const { solicitud, cola } = await solicitudService.crearSolicitud(req.body)

  res.status(201).json({
    ok: true,
    mensaje: cola.encolada
      ? `Solicitud ${solicitud.codigo} registrada y enviada a la cola`
      : `Solicitud ${solicitud.codigo} registrada, pero la cola no está disponible`,
    enCola: cola.encolada,
    posicionCola: cola.longitud,
    solicitud: solicitud.toJSON()
  })
})

/** GET /solicitudes/:id */
export const obtener = asyncHandler(async (req, res) => {
  const solicitud = await solicitudService.obtenerSolicitudPorId(req.params.id)

  res.status(200).json({
    ok: true,
    solicitud: solicitud.toJSON()
  })
})

/** GET /solicitudes/:id/respuesta */
export const obtenerRespuesta = asyncHandler(async (req, res) => {
  const resultado = await solicitudService.obtenerRespuestaDeSolicitud(req.params.id)

  res.status(200).json({
    ok: true,
    ...resultado
  })
})

/** PUT /solicitudes/:id */
export const actualizar = asyncHandler(async (req, res) => {
  const solicitud = await solicitudService.actualizarSolicitud(req.params.id, req.body)

  res.status(200).json({
    ok: true,
    mensaje: 'Solicitud actualizada correctamente',
    solicitud: solicitud.toJSON()
  })
})

/** PATCH /solicitudes/:id/estado (administración y pruebas del Worker) */
export const cambiarEstado = asyncHandler(async (req, res) => {
  const solicitud = await solicitudService.actualizarEstadoSolicitud(req.params.id, req.body)

  res.status(200).json({
    ok: true,
    mensaje: `Estado actualizado a ${solicitud.estado}`,
    solicitud: solicitud.toJSON()
  })
})

/** DELETE /solicitudes/:id */
export const eliminar = asyncHandler(async (req, res) => {
  const solicitud = await solicitudService.eliminarSolicitud(req.params.id)

  res.status(200).json({
    ok: true,
    mensaje: `Solicitud ${solicitud.codigo} eliminada`,
    id: String(solicitud._id)
  })
})
