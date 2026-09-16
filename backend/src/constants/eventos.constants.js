/**
 * constants/eventos.constants.js
 * ------------------------------------------------------------------
 * Nombres de los eventos Socket.IO (contrato con el frontend) y
 * eventos que el cliente puede emitir hacia el servidor.
 * El Worker publica los mismos nombres en el canal Redis
 * `taskflow:eventos` y el backend los reenvía por WebSocket.
 */
export const EVENTO = Object.freeze({
  SOLICITUD_CREADA: 'solicitud-creada',
  SOLICITUD_ENCOLADA: 'solicitud-encolada',
  SOLICITUD_PROCESANDO: 'solicitud-procesando',
  SOLICITUD_RESPONDIDA: 'solicitud-respondida',
  SOLICITUD_ERROR: 'solicitud-error',
  MONITOR_ACTUALIZADO: 'monitor-actualizado',
  COLA_ACTUALIZADA: 'cola-actualizada'
})

/** Eventos emitidos por el cliente (Vue) hacia el backend. */
export const EVENTO_CLIENTE = Object.freeze({
  UNIRSE_SALA: 'unirse-sala',
  SALIR_SALA: 'salir-sala',
  SOLICITAR_MONITOR: 'solicitar-monitor'
})

/** Salas opcionales para segmentar la difusión de eventos. */
export const SALA = Object.freeze({
  SOLICITUDES: 'solicitudes',
  MONITOR: 'monitor',
  TODAS: 'todas'
})
