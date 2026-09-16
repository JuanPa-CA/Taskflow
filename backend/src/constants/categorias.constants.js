/**
 * constants/categorias.constants.js
 * ------------------------------------------------------------------
 * Categorías de solicitud soportadas (deben coincidir con
 * CATEGORIAS_VALIDAS del frontend) y datos de seed para la colección
 * `categorias` (SLA, adjuntos obligatorios, plantilla de respuesta).
 */
export const CATEGORIA = Object.freeze({
  INFORMACION: 'Información',
  SOPORTE: 'Soporte',
  DOCUMENTO: 'Documento',
  CONSULTA: 'Consulta',
  ACTUALIZACION: 'Actualización'
})

export const CATEGORIAS = Object.freeze(Object.values(CATEGORIA))

export const CATEGORIAS_SEED = Object.freeze([
  {
    nombre: CATEGORIA.INFORMACION,
    descripcion: 'Solicitudes de información general sobre servicios, procesos o políticas.',
    slaHoras: 24,
    requiereAdjunto: false,
    orden: 1
  },
  {
    nombre: CATEGORIA.SOPORTE,
    descripcion: 'Incidentes técnicos y fallas que requieren atención del área de soporte.',
    slaHoras: 8,
    requiereAdjunto: false,
    orden: 2
  },
  {
    nombre: CATEGORIA.DOCUMENTO,
    descripcion: 'Trámites documentales: certificados, radicaciones y constancias.',
    slaHoras: 48,
    requiereAdjunto: true,
    orden: 3
  },
  {
    nombre: CATEGORIA.CONSULTA,
    descripcion: 'Consultas puntuales que no generan trámite ni documento formal.',
    slaHoras: 24,
    requiereAdjunto: false,
    orden: 4
  },
  {
    nombre: CATEGORIA.ACTUALIZACION,
    descripcion: 'Actualización de datos de contacto, dependencia o información del solicitante.',
    slaHoras: 12,
    requiereAdjunto: false,
    orden: 5
  }
])
