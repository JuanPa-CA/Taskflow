/**
 * validators/solicitud.validator.js
 * ------------------------------------------------------------------
 * Validación de entrada del dominio de solicitudes (capa HTTP).
 * Reglas alineadas con `validateRequest` del frontend para que el
 * usuario reciba mensajes consistentes.
 */
import { body, query } from 'express-validator'
import { CATEGORIAS } from '../constants/categorias.constants.js'
import { PRIORIDADES } from '../constants/prioridades.constants.js'
import { ESTADOS } from '../constants/estados.constants.js'

/** POST /solicitudes */
export const crearSolicitudValidator = [
  body('titulo')
    .exists({ values: 'falsy' })
    .withMessage('El título es obligatorio')
    .bail()
    .isString()
    .withMessage('El título debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('El título debe tener entre 3 y 120 caracteres'),

  body('descripcion')
    .exists({ values: 'falsy' })
    .withMessage('La descripción es obligatoria')
    .bail()
    .isString()
    .withMessage('La descripción debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 5, max: 3000 })
    .withMessage('La descripción debe tener entre 5 y 3000 caracteres'),

  body('categoria')
    .exists({ values: 'falsy' })
    .withMessage('La categoría es obligatoria')
    .bail()
    .isIn(CATEGORIAS)
    .withMessage(`Categoría no válida. Permitidas: ${CATEGORIAS.join(', ')}`),

  body('prioridad')
    .optional({ values: 'falsy' })
    .isIn(PRIORIDADES)
    .withMessage(`Prioridad no válida. Permitidas: ${PRIORIDADES.join(', ')}`),

  // El frontend envía estado y fechaCreacion: se aceptan pero el backend
  // siempre fuerza el estado inicial PENDIENTE.
  body('estado').optional({ values: 'falsy' }).isIn(ESTADOS).withMessage('Estado no válido'),
  body('fechaCreacion').optional({ values: 'falsy' }).isISO8601().withMessage('fechaCreacion debe ser una fecha ISO 8601'),

  body('solicitante').optional().isObject().withMessage('solicitante debe ser un objeto'),
  body('solicitante.nombre').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('solicitante.email').optional({ values: 'falsy' }).isEmail().withMessage('El correo del solicitante no es válido'),
  body('solicitante.dependencia').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),

  body('canal').optional({ values: 'falsy' }).isIn(['web', 'api', 'correo']).withMessage('Canal no válido')
]

/** GET /solicitudes (filtros del listado) */
export const listarSolicitudesValidator = [
  query('categoria').optional({ values: 'falsy' }).isIn(CATEGORIAS).withMessage('Filtro de categoría no válido'),
  query('prioridad').optional({ values: 'falsy' }).isIn(PRIORIDADES).withMessage('Filtro de prioridad no válido'),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS).withMessage('Filtro de estado no válido'),
  query('search').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }).withMessage('El término de búsqueda es demasiado largo')
]

/** PUT /solicitudes/:id (solo campos editables por el usuario) */
export const actualizarSolicitudValidator = [
  body('titulo').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 120 }).withMessage('El título debe tener entre 3 y 120 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ min: 5, max: 3000 }).withMessage('La descripción debe tener entre 5 y 3000 caracteres'),
  body('categoria').optional({ values: 'falsy' }).isIn(CATEGORIAS).withMessage(`Categoría no válida. Permitidas: ${CATEGORIAS.join(', ')}`),
  body('prioridad').optional({ values: 'falsy' }).isIn(PRIORIDADES).withMessage('Prioridad no válida'),
  body('solicitante.nombre').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('solicitante.email').optional({ values: 'falsy' }).isEmail().withMessage('El correo del solicitante no es válido')
]

/** PATCH /solicitudes/:id/estado (uso administrativo y pruebas del Worker) */
export const cambiarEstadoValidator = [
  body('estado').exists({ values: 'falsy' }).withMessage('El estado es obligatorio').bail().isIn(ESTADOS).withMessage(`Estado no válido. Permitidos: ${ESTADOS.join(', ')}`),
  body('respuesta').optional({ nullable: true }).isString().trim().isLength({ max: 5000 }),
  body('mensajeError').optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
  body('workerId').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body('origen').optional({ values: 'falsy' }).isIn(['backend', 'worker', 'usuario']).withMessage('Origen no válido')
]
