import { Router } from 'express';
import solicitudesRoutes from './solicitudes.routes.js';
import estadisticasRoutes from './estadisticas.routes.js';
import monitorController from '../controllers/monitor.controller.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, servicio: 'taskflow-backend', estado: 'disponible' });
});

router.use('/solicitudes', solicitudesRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.get('/monitor', monitorController.obtener);

export default router;
