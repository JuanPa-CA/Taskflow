import { Router } from 'express';
import * as estadisticasController from '../controllers/estadisticas.controller.js';

const router = Router();

// GET /api/estadisticas -> indicadores para Dashboard/Monitor
router.get('/', estadisticasController.obtener);

export default router;
