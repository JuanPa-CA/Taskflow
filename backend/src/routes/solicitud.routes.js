/**
 * routes/solicitud.routes.js
 * ------------------------------------------------------------------
 * Endpoints REST del dominio de solicitudes.
 * El listado usa cache-aside (HU-08): la primera consulta es MISS
 * (MongoDB) y las siguientes HIT (Redis), expuesto en el header X-Cache.
 */
import { Router } from 'express'
import * as controlador from '../controllers/solicitud.controller.js'
import { ejecutarValidaciones } from '../middlewares/validate.middleware.js'
import { cachearRespuesta } from '../middlewares/cache.middleware.js'
import { limitadorEscritura } from '../middlewares/rateLimit.middleware.js'
import { validarObjectId, validarPaginacion } from '../validators/common.validator.js'
import {
  actualizarSolicitudValidator,
  cambiarEstadoValidator,
  crearSolicitudValidator,
  listarSolicitudesValidator
} from '../validators/solicitud.validator.js'
import { TTL } from '../constants/cache.constants.js'

const router = Router()

// --- Lecturas ---
router.get(
  '/',
  cachearRespuesta({ prefijo: 'solicitudes:listado', ttl: TTL.LISTADO_SOLICITUDES }),
  listarSolicitudesValidator,
  validarPaginacion(),
  ejecutarValidaciones,
  controlador.listar
)

router.get('/:id/respuesta', validarObjectId(), ejecutarValidaciones, controlador.obtenerRespuesta)
router.get('/:id', validarObjectId(), ejecutarValidaciones, controlador.obtener)

// --- Escrituras ---
router.post('/', limitadorEscritura, crearSolicitudValidator, ejecutarValidaciones, controlador.crear)
router.put('/:id', limitadorEscritura, validarObjectId(), actualizarSolicitudValidator, ejecutarValidaciones, controlador.actualizar)
router.patch('/:id/estado', limitadorEscritura, validarObjectId(), cambiarEstadoValidator, ejecutarValidaciones, controlador.cambiarEstado)
router.delete('/:id', limitadorEscritura, validarObjectId(), ejecutarValidaciones, controlador.eliminar)

export default router
