/**
 * Constantes compartidas del Worker (proceso aparte, sin HTTP/Socket.IO).
 * Se mantienen EXACTAMENTE iguales a las del backend (backend/config/constants.js)
 * para no romper la validación de enums de Mongoose ni el contrato de eventos.
 */

export const ESTADOS = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR',
});

export const ESTADOS_VALIDOS = Object.values(ESTADOS);

export const PRIORIDADES = Object.freeze({
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
});

export const PRIORIDADES_VALIDAS = Object.values(PRIORIDADES);

// Las 5 categorías mínimas exigidas (con tilde, exactamente como el backend).
// Cualquier categoría que no esté aquí cae en la respuesta genérica del Worker.
export const CATEGORIAS = Object.freeze({
  INFORMACION: 'Información',
  SOPORTE: 'Soporte',
  DOCUMENTO: 'Documento',
  CONSULTA: 'Consulta',
  ACTUALIZACION: 'Actualización',
});

export const CATEGORIAS_VALIDAS = Object.values(CATEGORIAS);

// Nombres de evento válidos que el Worker publica en REDIS_EVENTS_CHANNEL.
// Son EXACTAMENTE los que el backend ya valida/retransmite por Socket.IO.
// (El backend publica por su cuenta "solicitud-creada" y "solicitud-encolada";
//  el Worker es responsable de los 4 que se usan en su flujo, más
//  "monitor-actualizado" que queda definido para mantener el contrato completo.)
export const EVENTOS = Object.freeze({
  SOLICITUD_PROCESANDO: 'solicitud-procesando',
  SOLICITUD_RESPONDIDA: 'solicitud-respondida',
  SOLICITUD_ERROR: 'solicitud-error',
  COLA_ACTUALIZADA: 'cola-actualizada',
  MONITOR_ACTUALIZADO: 'monitor-actualizado',
});

export const EVENTOS_VALIDOS = Object.values(EVENTOS);

// Texto disparador para simular un error de procesamiento (HU-11).
// Si el título o la descripción de una solicitud contiene este texto,
// el worker lanza un error controlado que termina en estado ERROR.
export const TEXTO_SIMULAR_ERROR = '[simular-error]';

export default {
  ESTADOS,
  ESTADOS_VALIDOS,
  PRIORIDADES,
  PRIORIDADES_VALIDAS,
  CATEGORIAS,
  CATEGORIAS_VALIDAS,
  EVENTOS,
  EVENTOS_VALIDOS,
  TEXTO_SIMULAR_ERROR,
};
