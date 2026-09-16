/**
 * middlewares/asyncHandler.js
 * ------------------------------------------------------------------
 * Envuelve controladores async para que cualquier rechazo de promesa
 * llegue a `next(error)` y sea procesado por el manejador de errores.
 *
 * Uso: router.get('/', asyncHandler(controlador.listar))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler
