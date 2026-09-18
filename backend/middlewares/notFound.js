/**
 * Se ejecuta cuando ninguna ruta coincidió. Debe montarse
 * después de todas las rutas y antes del errorHandler.
 */
export function notFound(req, res, _next) {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export default notFound;
