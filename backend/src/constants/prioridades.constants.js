/**
 * constants/prioridades.constants.js
 * ------------------------------------------------------------------
 * Niveles de prioridad tal como los envía el formulario de Vue
 * ('Alta', 'Media', 'Baja') + peso para ordenamientos y KPIs.
 */
export const PRIORIDAD = Object.freeze({
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
})

export const PRIORIDADES = Object.freeze(Object.values(PRIORIDAD))

/** Peso para calcular indicadores ponderados o priorizar la cola. */
export const PESO_PRIORIDAD = Object.freeze({
  [PRIORIDAD.ALTA]: 3,
  [PRIORIDAD.MEDIA]: 2,
  [PRIORIDAD.BAJA]: 1
})
