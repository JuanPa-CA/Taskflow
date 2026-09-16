/**
 * middlewares/errorHandler.middleware.js
 * ------------------------------------------------------------------
 * Único punto de salida para errores. Traduce ApiError, errores de
 * validación de Mongoose, CastError y claves duplicadas a un JSON
 * uniforme. En producción no expone el stack.
 */
import { esApiError } from '../utils/apiError.js'
import { esProduccion } from '../config/env.config.js'
import { logger } from '../utils/logger.js'

const traducirError = (error) => {
  if (esApiError(error)) {
    return { status: error.statusCode, mensaje: error.message, detalles: error.detalles }
  }

  // Validaciones declaradas en el modelo (schema de Mongoose)
  if (error.name === 'ValidationError') {
    const detalles = Object.values(error.errors).map((item) => ({
      campo: item.path,
      mensaje: item.message
    }))
    return { status: 400, mensaje: 'Los datos no cumplen las reglas de validación', detalles }
  }

  // ObjectId malformado u operador inválido
  if (error.name === 'CastError') {
    return { status: 400, mensaje: `El valor "${error.value}" no es válido para el campo "${error.path}"`, detalles: null }
  }

  // Índice único (ej. código de radicado duplicado)
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || { campo: 'desconocido' }).join(', ')
    return { status: 409, mensaje: `Ya existe un registro con el mismo valor en: ${campo}`, detalles: null }
  }

  // Cuerpo JSON malformado o demasiado grande (body-parser / express.json)
  if (error.type === 'entity.parse.failed') {
    return { status: 400, mensaje: 'El cuerpo de la petición no es un JSON válido', detalles: null }
  }

  if (error.type === 'entity.too.large') {
    return { status: 413, mensaje: 'El cuerpo de la petición excede el tamaño permitido', detalles: null }
  }

  if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
    return { status: 503, mensaje: 'La base de datos no está disponible en este momento', detalles: null }
  }

  return { status: 500, mensaje: 'Error interno del servidor', detalles: null }
}

export const manejadorErrores = (error, req, res, _next) => {
  const { status, mensaje, detalles } = traducirError(error)

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${status}: ${error.message}`, error.stack)
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${mensaje}`)
  }

  const cuerpo = {
    ok: false,
    mensaje,
    ruta: req.originalUrl,
    metodo: req.method,
    fecha: new Date().toISOString()
  }

  if (detalles) cuerpo.detalles = detalles
  if (!esProduccion) cuerpo.stack = error.stack

  return res.status(status).json(cuerpo)
}
