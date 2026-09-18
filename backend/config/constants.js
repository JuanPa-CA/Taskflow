/**
 * Constantes compartidas por modelos, validadores, services y controllers.
 * Se centralizan aquí para que el Worker (proceso aparte) pueda usar los
 * mismos valores exactos y evitar strings "mágicos" repetidos.
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

// Las 5 categorías mínimas exigidas por el taller (HU-06 / punto 7 del taller).
// El Worker debe usar esta misma lista para escoger la regla de respuesta;
// cualquier categoría que no esté aquí cae en la respuesta genérica.
export const CATEGORIAS = Object.freeze({
  INFORMACION: 'Información',
  SOPORTE: 'Soporte',
  DOCUMENTO: 'Documento',
  CONSULTA: 'Consulta',
  ACTUALIZACION: 'Actualización',
});

export const CATEGORIAS_VALIDAS = Object.values(CATEGORIAS);

// Nombres de eventos Socket.IO (sección 21.3 de la arquitectura).
// Mantenerlos en un solo lugar evita typos entre backend y worker.
export const EVENTOS_SOCKET = Object.freeze({
  SOLICITUD_CREADA: 'solicitud-creada',
  SOLICITUD_ENCOLADA: 'solicitud-encolada',
  SOLICITUD_PROCESANDO: 'solicitud-procesando',
  SOLICITUD_RESPONDIDA: 'solicitud-respondida',
  SOLICITUD_ERROR: 'solicitud-error',
  COLA_ACTUALIZADA: 'cola-actualizada',
  MONITOR_ACTUALIZADO: 'monitor-actualizado',
});
