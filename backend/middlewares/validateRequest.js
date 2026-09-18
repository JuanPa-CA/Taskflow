import { validationResult } from 'express-validator';

/**
 * Middleware genérico para usar después de las cadenas de express-validator
 * en cada ruta. Si hay errores, corta el flujo con 400 y un formato
 * consistente; si no, deja pasar a la siguiente función.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Datos inválidos',
      errores: errors.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }

  return next();
}

export default validateRequest;
