/**
 * routes/categoria.routes.js
 * ------------------------------------------------------------------
 * CRUD del catálogo de categorías de solicitud.
 */
import { Router } from 'express'
import * as controlador from '../controllers/categoria.controller.js'
import { ejecutarValidaciones } from '../middlewares/validate.middleware.js'
import { cachearRespuesta } from '../middlewares/cache.middleware.js'
import { limitadorEscritura } from '../middlewares/rateLimit.middleware.js'
import { validarObjectId } from '../validators/common.validator.js'
import { actualizarCategoriaValidator, crearCategoriaValidator } from '../validators/categoria.validator.js'
import { TTL } from '../constants/cache.constants.js'

const router = Router()

router.get('/', cachearRespuesta({ prefijo: 'categorias:listado', ttl: TTL.CATEGORIAS }), controlador.listar)
router.get('/:id', validarObjectId(), ejecutarValidaciones, controlador.obtener)

router.post('/', limitadorEscritura, crearCategoriaValidator, ejecutarValidaciones, controlador.crear)
router.put('/:id', limitadorEscritura, validarObjectId(), actualizarCategoriaValidator, ejecutarValidaciones, controlador.actualizar)
router.delete('/:id', limitadorEscritura, validarObjectId(), ejecutarValidaciones, controlador.eliminar)

export default router
