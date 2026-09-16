/**
 * utils/logger.js
 * ------------------------------------------------------------------
 * Logger mínimo con niveles y marca de tiempo, sin dependencias
 * externas. Se centraliza aquí para poder cambiar a winston/pino
 * más adelante sin tocar el resto de la aplicación.
 */
const NIVELES = { error: 0, warn: 1, info: 2, debug: 3 }

const nivelConfigurado = () => {
  const nivel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  return NIVELES[nivel] !== undefined ? nivel : 'info'
}

const escribir = (nivel, mensaje, ...extra) => {
  if (NIVELES[nivel] > NIVELES[nivelConfigurado()]) return
  const marca = new Date().toISOString()
  const linea = `[${marca}] [${nivel.toUpperCase().padEnd(5)}] [TASKFLOW:BACKEND] ${mensaje}`
  const flujo = nivel === 'error' ? console.error : nivel === 'warn' ? console.warn : console.log
  if (extra.length > 0) {
    flujo(linea, ...extra)
  } else {
    flujo(linea)
  }
}

export const logger = {
  error: (mensaje, ...extra) => escribir('error', mensaje, ...extra),
  warn: (mensaje, ...extra) => escribir('warn', mensaje, ...extra),
  info: (mensaje, ...extra) => escribir('info', mensaje, ...extra),
  debug: (mensaje, ...extra) => escribir('debug', mensaje, ...extra)
}
