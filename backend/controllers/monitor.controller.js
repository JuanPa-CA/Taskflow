import { obtenerMonitor } from '../services/monitor.service.js';

export async function obtener(req, res, next) {
  try {
    res.json(await obtenerMonitor());
  } catch (error) {
    next(error);
  }
}

export default { obtener };
