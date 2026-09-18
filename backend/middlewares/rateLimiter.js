import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Límite general para toda la API. Protege el backend de ráfagas
 * (y de paso, evita saturar la cola de Redis con solicitudes repetidas).
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: 'Demasiadas solicitudes, intenta nuevamente en unos minutos.',
  },
});

export default apiRateLimiter;
