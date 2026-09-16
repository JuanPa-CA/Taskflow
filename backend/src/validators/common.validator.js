/**
 * validators/common.validator.js
 * ------------------------------------------------------------------
 * Reglas de validación reutilizables (ids de MongoDB y paginación).
 */
import { param, query } from 'express-validator'

/** Valida que un parámetro de ruta sea un ObjectId de MongoDB. */
export const validarObjectId = (campo = 'id') =>
  param(campo)
    .isMongoId()
    .withMessage(`El parámetro "${campo}" no es un id válido`)

/** Paginación opcional para listados. */
export const validarPaginacion = () => [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('page debe ser un entero mayor o igual a 1'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
  query('orden').optional({ values: 'falsy' }).isIn(['recientes', 'antiguas', 'prioridad']).withMessage('orden no válido')
]
