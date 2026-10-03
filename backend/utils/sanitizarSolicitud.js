import { ESTADOS, MENSAJE_ERROR_SOLICITUD } from '../config/constants.js'

export const sanitizarErrorSolicitud = (solicitud) => {
  if (!solicitud || solicitud.estado !== ESTADOS.ERROR) return solicitud

  return {
    ...solicitud,
    mensajeError: MENSAJE_ERROR_SOLICITUD,
    historialEstados: Array.isArray(solicitud.historialEstados)
      ? solicitud.historialEstados.map((historial) => (
          historial.estado === ESTADOS.ERROR
            ? { ...historial, detalle: MENSAJE_ERROR_SOLICITUD }
            : historial
        ))
      : solicitud.historialEstados
  }
}
