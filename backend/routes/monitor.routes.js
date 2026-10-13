import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js';

const router = Router();

// GET /api/monitor
router.get('/', monitorController.obtener);

export default router;
