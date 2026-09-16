/**
 * utils/apiError.js
 * ------------------------------------------------------------------
 * Error de aplicación con código HTTP. Los controladores y servicios
 * lanzan ApiError; el middleware `errorHandler` lo traduce a JSON.
 *
 * Formato de error que espera el frontend:
 *   { ok: false, mensaje: '...', detalles: [{ campo, mensaje }] }
 */
export class ApiError extends Error {
  constructor(statusCode, mensaje, detalles = null) {
    super(mensaje)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.detalles = detalles
    this.esOperacional = true
    Error.captureStackTrace?.(this, this.constructor)
  }

  static badRequest(mensaje = 'Solicitud inválida', detalles = null) {
    return new ApiError(400, mensaje, detalles)
  }

  static notFound(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, mensaje)
  }

  static conflict(mensaje = 'Conflicto con el estado actual del recurso', detalles = null) {
    return new ApiError(409, mensaje, detalles)
  }

  static serviceUnavailable(mensaje = 'Servicio no disponible temporalmente') {
    return new ApiError(503, mensaje)
  }
}

export const esApiError = (error) => error instanceof ApiError
