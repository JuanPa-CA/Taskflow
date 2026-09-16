/**
 * services/socket.service.js
 * ------------------------------------------------------------------
 * Fachada única para emitir eventos Socket.IO. Ningún controlador ni
 * servicio debe tocar la instancia `io` directamente: todos usan estas
 * funciones, lo que mantiene el contrato de eventos en un solo lugar.
 */
import { EVENTO } from '../constants/eventos.constants.js'
import { logger } from '../utils/logger.js'

let ioRef = null

/** Registra la instancia de Socket.IO creada en src/sockets/index.js. */
export const registrarServidorSocket = (io) => {
  ioRef = io
  return ioRef
}

export const obtenerServidorSocket = () => ioRef

const serializar = (solicitud) => {
  if (!solicitud) return null
  if (typeof solicitud.toJSON === 'function') return solicitud.toJSON()
  return solicitud
}

const emitir = (evento, payload) => {
  if (!ioRef) {
    logger.debug(`Socket.IO sin inicializar: evento "${evento}" descartado`)
    return false
  }
  ioRef.emit(evento, payload)
  logger.debug(`Socket emit -> ${evento}`)
  return true
}

export const emitirSolicitudCreada = (solicitud) =>
  emitir(EVENTO.SOLICITUD_CREADA, {
    solicitud: serializar(solicitud),
    fecha: new Date().toISOString()
  })

export const emitirSolicitudEncolada = (solicitud, infoCola = {}) => {
  const plana = serializar(solicitud)
  return emitir(EVENTO.SOLICITUD_ENCOLADA, {
    id: plana?.id || plana?._id,
    solicitudId: plana?.id || plana?._id,
    solicitud: plana,
    posicion: infoCola.longitud ?? null,
    longitudCola: infoCola.longitud ?? null,
    fecha: new Date().toISOString()
  })
}

export const emitirSolicitudProcesando = (payload = {}) =>
  emitir(EVENTO.SOLICITUD_PROCESANDO, { ...payload, fecha: payload.fecha || new Date().toISOString() })

export const emitirSolicitudRespondida = (payload = {}) =>
  emitir(EVENTO.SOLICITUD_RESPONDIDA, { ...payload, fecha: payload.fecha || new Date().toISOString() })

export const emitirSolicitudError = (payload = {}) =>
  emitir(EVENTO.SOLICITUD_ERROR, { ...payload, fecha: payload.fecha || new Date().toISOString() })

export const emitirMonitorActualizado = (datos) => emitir(EVENTO.MONITOR_ACTUALIZADO, datos)

export const emitirColaActualizada = (datos) => emitir(EVENTO.COLA_ACTUALIZADA, datos)

/** Reenvía a todos los clientes un evento proveniente del Worker (Pub/Sub). */
export const reenviarEventoWorker = (evento, datos) => {
  const permitidos = Object.values(EVENTO)
  if (!permitidos.includes(evento)) {
    logger.warn(`Evento del Worker no reconocido y descartado: ${evento}`)
    return false
  }
  return emitir(evento, datos)
}
