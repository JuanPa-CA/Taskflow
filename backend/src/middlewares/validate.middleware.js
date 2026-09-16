/**
 * middlewares/validate.middleware.js
 * ------------------------------------------------------------------
 * Ejecuta las reglas de express-validator declaradas en `validators/`
 * y responde 400 con el formato de error que espera el frontend:
 *   { ok: false, mensaje, detalles: [{ campo, ubicacion, mensaje }] }
 */
import { validationResult } from 'express-validator'

export const ejecutarValidaciones = (req, res, next) => {
  const resultado = validationResult(req)

  if (resultado.isEmpty()) return next()

  const detalles = resultado.array().map((error) => ({
    campo: error.path,
    ubicacion: error.location,
    valor: error.value ?? null,
    mensaje: error.msg
  }))

  return res.status(400).json({
    ok: false,
    mensaje: 'Datos de entrada inválidos',
    detalles
  })
}
