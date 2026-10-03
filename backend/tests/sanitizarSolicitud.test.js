import test from 'node:test'
import assert from 'node:assert/strict'
import { ESTADOS, MENSAJE_ERROR_SOLICITUD } from '../config/constants.js'
import { sanitizarErrorSolicitud } from '../utils/sanitizarSolicitud.js'
import { Solicitud } from '../models/Solicitud.js'

test('does not change a null request', () => {
  assert.equal(sanitizarErrorSolicitud(null), null)
})

test('does not change requests outside the ERROR state', () => {
  const solicitud = {
    estado: ESTADOS.RESPONDIDA,
    mensajeError: 'A legacy value on a non-error request',
    historialEstados: []
  }

  assert.equal(sanitizarErrorSolicitud(solicitud), solicitud)
})

test('replaces internal error details and error history details', () => {
  const detalleInterno = 'MongoServerError: private diagnostic'
  const solicitud = {
    estado: ESTADOS.ERROR,
    mensajeError: detalleInterno,
    historialEstados: [
      { estado: ESTADOS.PROCESANDO, detalle: 'Processing started' },
      { estado: ESTADOS.ERROR, detalle: detalleInterno }
    ]
  }

  const resultado = sanitizarErrorSolicitud(solicitud)

  assert.equal(resultado.mensajeError, MENSAJE_ERROR_SOLICITUD)
  assert.equal(resultado.historialEstados[0].detalle, 'Processing started')
  assert.equal(resultado.historialEstados[1].detalle, MENSAJE_ERROR_SOLICITUD)
  assert.equal(JSON.stringify(resultado).includes(detalleInterno), false)
  assert.equal(solicitud.mensajeError, detalleInterno)
})

test('preserves absent state history', () => {
  const solicitud = { estado: ESTADOS.ERROR, mensajeError: 'Internal detail' }

  assert.deepEqual(sanitizarErrorSolicitud(solicitud), {
    estado: ESTADOS.ERROR,
    mensajeError: MENSAJE_ERROR_SOLICITUD,
    historialEstados: undefined
  })
})

test('model JSON output never exposes legacy processing details', () => {
  const detalleInterno = 'MongoServerError: private diagnostic'
  const solicitud = new Solicitud({
    estado: ESTADOS.ERROR,
    mensajeError: detalleInterno,
    historialEstados: [{ estado: ESTADOS.ERROR, detalle: detalleInterno }]
  })

  const salida = solicitud.toJSON()

  assert.equal(salida.mensajeError, MENSAJE_ERROR_SOLICITUD)
  assert.equal(salida.historialEstados[0].detalle, MENSAJE_ERROR_SOLICITUD)
  assert.equal(JSON.stringify(salida).includes(detalleInterno), false)
})
