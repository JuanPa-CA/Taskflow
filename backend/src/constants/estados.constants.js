/**
 * constants/estados.constants.js
 * ------------------------------------------------------------------
 * Ciclo de vida oficial de una solicitud. Debe coincidir con el
 * StatusBadge y el Stepper del frontend.
 */
export const ESTADO = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR'
})

export const ESTADOS = Object.freeze(Object.values(ESTADO))

/** Orden del ciclo de vida (útil para el stepper y para el dashboard). */
export const ORDEN_CICLO_VIDA = Object.freeze([
  ESTADO.PENDIENTE,
  ESTADO.EN_COLA,
  ESTADO.PROCESANDO,
  ESTADO.RESPONDIDA
])

/** Estados que cierran el ciclo: el Worker ya no los vuelve a tomar. */
export const ESTADOS_TERMINALES = Object.freeze([ESTADO.RESPONDIDA, ESTADO.ERROR])

/**
 * Transiciones permitidas. El backend valida que un cambio de estado
 * solicitado por API sea coherente con el ciclo de vida.
 */
export const TRANSICIONES_VALIDAS = Object.freeze({
  [ESTADO.PENDIENTE]: [ESTADO.EN_COLA, ESTADO.ERROR],
  [ESTADO.EN_COLA]: [ESTADO.PROCESANDO, ESTADO.PENDIENTE, ESTADO.ERROR],
  [ESTADO.PROCESANDO]: [ESTADO.RESPONDIDA, ESTADO.ERROR, ESTADO.EN_COLA],
  [ESTADO.RESPONDIDA]: [],
  [ESTADO.ERROR]: [ESTADO.PENDIENTE, ESTADO.EN_COLA]
})

export const puedeTransicionar = (estadoActual, estadoNuevo) =>
  Boolean(TRANSICIONES_VALIDAS[estadoActual]?.includes(estadoNuevo))
