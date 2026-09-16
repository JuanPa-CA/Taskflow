/**
 * routes/monitor.routes.js
 * ------------------------------------------------------------------
 * Estado de salud del sistema: los 4 componentes (express, mongodb,
 * redis, worker), métricas de la cola y conteos por estado.
 */
import { Router } from 'express'
import * as controlador from '../controllers/monitor.controller.js'

const router = Router()

router.get('/', controlador.estado)
router.get('/salud', controlador.salud)
router.get('/cola', controlador.cola)

export default router
