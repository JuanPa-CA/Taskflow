/**
 * routes/indicador.routes.js
 * ------------------------------------------------------------------
 * Indicadores/estadísticas del dashboard. Las respuestas indican su
 * origen (`REDIS` o `MONGODB`) para evidenciar el beneficio del caché.
 */
import { Router } from 'express'
import * as controlador from '../controllers/indicador.controller.js'

const router = Router()

router.get('/', controlador.resumen)
router.get('/por-categoria', controlador.porCategoria)
router.get('/por-prioridad', controlador.porPrioridad)
router.get('/tendencia', controlador.tendencia)
router.get('/cola', controlador.cola)

export default router
