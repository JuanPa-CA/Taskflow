import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as solicitudesController from '../controllers/solicitudes.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { CATEGORIAS_VALIDAS, PRIORIDADES_VALIDAS, ESTADOS_VALIDOS } from '../config/constants.js';

const router = Router();

const idValidator = param('id').isMongoId().withMessage('El id no es un ObjectId válido');

router.post(
  '/',
  [
    body('titulo')
      .trim()
      .notEmpty()
      .withMessage('El título es obligatorio')
      .isLength({ min: 3, max: 150 })
      .withMessage('El título debe tener entre 3 y 150 caracteres'),
    body('descripcion')
      .trim()
      .notEmpty()
      .withMessage('La descripción es obligatoria')
      .isLength({ min: 5, max: 2000 })
      .withMessage('La descripción debe tener entre 5 y 2000 caracteres'),
    body('categoria')
      .notEmpty()
      .withMessage('La categoría es obligatoria')
      .isIn(CATEGORIAS_VALIDAS)
      .withMessage(`Categoría inválida. Válidas: ${CATEGORIAS_VALIDAS.join(', ')}`),
    body('prioridad')
      .notEmpty()
      .withMessage('La prioridad es obligatoria')
      .isIn(PRIORIDADES_VALIDAS)
      .withMessage(`Prioridad inválida. Válidas: ${PRIORIDADES_VALIDAS.join(', ')}`),
  ],
  validateRequest,
  solicitudesController.registrar
);

router.get(
  '/',
  [
    query('estado').optional().isIn(ESTADOS_VALIDOS).withMessage('Estado inválido'),
    query('categoria').optional().isIn(CATEGORIAS_VALIDAS).withMessage('Categoría inválida'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
  ],
  validateRequest,
  solicitudesController.listar
);

router.get('/:id', [idValidator], validateRequest, solicitudesController.obtenerPorId);

router.get(
  '/:id/respuesta',
  [idValidator],
  validateRequest,
  solicitudesController.obtenerRespuesta
);

export default router;
