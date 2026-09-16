/**
 * validators/categoria.validator.js
 * ------------------------------------------------------------------
 * Validación de entrada del catálogo de categorías.
 */
import { body } from 'express-validator'
import { CATEGORIAS } from '../constants/categorias.constants.js'

export const crearCategoriaValidator = [
  body('nombre')
    .exists({ values: 'falsy' })
    .withMessage('El nombre de la categoría es obligatorio')
    .bail()
    .isIn(CATEGORIAS)
    .withMessage(`Categoría no soportada. Permitidas: ${CATEGORIAS.join(', ')}`),
  body('descripcion').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('slaHoras').optional({ values: 'falsy' }).isInt({ min: 1, max: 720 }).withMessage('slaHoras debe estar entre 1 y 720'),
  body('requiereAdjunto').optional().isBoolean().withMessage('requiereAdjunto debe ser booleano'),
  body('plantillaRespuesta').optional({ values: 'falsy' }).isString().trim().isLength({ max: 5000 }),
  body('orden').optional({ values: 'falsy' }).isInt({ min: 0 })
]

export const actualizarCategoriaValidator = [
  body('descripcion').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('slaHoras').optional({ values: 'falsy' }).isInt({ min: 1, max: 720 }),
  body('requiereAdjunto').optional().isBoolean(),
  body('plantillaRespuesta').optional({ values: 'falsy' }).isString().trim().isLength({ max: 5000 }),
  body('activa').optional().isBoolean().withMessage('activa debe ser booleano'),
  body('orden').optional({ values: 'falsy' }).isInt({ min: 0 })
]
