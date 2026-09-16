/**
 * routes/cache.routes.js
 * ------------------------------------------------------------------
 * Administración del caché Redis (inspección y limpieza). Endpoint
 * de apoyo para la demostración CACHE MISS -> CACHE HIT (HU-08).
 */
import { Router } from 'express'
import * as controlador from '../controllers/cache.controller.js'
import { limitadorEscritura } from '../middlewares/rateLimit.middleware.js'

const router = Router()

router.get('/', controlador.estado)
router.delete('/', limitadorEscritura, controlador.limpiar)
router.delete('/solicitudes', limitadorEscritura, controlador.limpiarSolicitudes)

export default router
