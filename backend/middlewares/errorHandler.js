import { env } from '../config/env.js';

/**
 * Manejador de errores centralizado (debe ser el último middleware).
 * Los services/controllers deben hacer `next(error)` en vez de responder
 * directamente cuando algo falla, para que todo termine acá con un
 * formato de error uniforme y sin exponer detalles técnicos en producción.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  console.error('[error]', err.message);
  if (env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    ok: false,
    mensaje: status === 500 ? 'Error interno del servidor' : err.message,
    ...(env.NODE_ENV !== 'production' && status === 500 ? { detalle: err.message } : {}),
  });
}

export default errorHandler;
