/**
 * services/solicitud.service.js
 * ------------------------------------------------------------------
 * Reglas de negocio del dominio de solicitudes:
 *   1. Validar y normalizar los datos.
 *   2. Persistir en MongoDB (estado inicial PENDIENTE + código de radicado).
 *   3. Encolar en Redis (estado EN COLA) y emitir los eventos Socket.IO.
 *   4. Invalidar el caché del listado/indicadores.
 * El backend NUNCA procesa la solicitud: eso le corresponde al Worker.
 */
import { Solicitud } from '../models/solicitud.model.js'
import { ESTADO, puedeTransicionar } from '../constants/estados.constants.js'
import { PRIORIDAD } from '../constants/prioridades.constants.js'
import { PATRON_INDICADORES, PATRON_SOLICITUDES } from '../constants/cache.constants.js'
import { generarCodigoSolicitud } from '../utils/codigo.util.js'
import { ApiError } from '../utils/apiError.js'
import { invalidarPorPatron } from './cache.service.js'
import { encolarSolicitud } from './cola.service.js'
import { emitirSolicitudCreada, emitirSolicitudEncolada } from './socket.service.js'
import { notificarActualizacionMonitor } from './monitor.service.js'
import { logger } from '../utils/logger.js'

const CAMPOS_EDITABLES = ['titulo', 'descripcion', 'categoria', 'prioridad', 'solicitante']

const ORDENES = {
  recientes: { createdAt: -1 },
  antiguas: { createdAt: 1 }
}

const RANGO_PRIORIDAD = {
  [PRIORIDAD.ALTA]: 3,
  [PRIORIDAD.MEDIA]: 2,
  [PRIORIDAD.BAJA]: 1
}

/** Escapa caracteres especiales para usar el término de búsqueda como regex. */
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Construye el filtro de MongoDB a partir del query string del listado. */
export const construirFiltro = ({ categoria, prioridad, estado, search } = {}) => {
  const filtro = {}
  if (categoria) filtro.categoria = categoria
  if (prioridad) filtro.prioridad = prioridad
  if (estado) filtro.estado = estado

  if (search) {
    const regex = new RegExp(escaparRegex(search.trim()), 'i')
    filtro.$or = [{ titulo: regex }, { descripcion: regex }, { codigo: regex }]
  }

  return filtro
}

const serializar = (documento) => {
  if (!documento) return null
  if (typeof documento.toJSON === 'function') return documento.toJSON()
  const plano = { ...documento, id: documento._id?.toString() }
  delete plano._id
  delete plano.__v
  return plano
}

/**
 * Lista solicitudes con filtros, búsqueda y paginación.
 * El resultado se cachea en el middleware `cachearRespuesta` (HU-08).
 */
export const listarSolicitudes = async (filtros = {}) => {
  const filtro = construirFiltro(filtros)
  const page = Math.max(Number.parseInt(filtros.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(filtros.limit, 10) || 50, 1), 100)
  const orden = filtros.orden || 'recientes'

  if (orden === 'prioridad') {
    const ramas = Object.entries(RANGO_PRIORIDAD).map(([valor, rango]) => ({
      case: { $eq: ['$prioridad', valor] },
      then: rango
    }))

    const [documentos, total] = await Promise.all([
      Solicitud.aggregate([
        { $match: filtro },
        { $addFields: { _rangoPrioridad: { $switch: { branches: ramas, default: 0 } } } },
        { $sort: { _rangoPrioridad: -1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $unset: '_rangoPrioridad' }
      ]),
      Solicitud.countDocuments(filtro)
    ])

    return { total, page, limit, orden, solicitudes: documentos.map(serializar) }
  }

  const [total, documentos] = await Promise.all([
    Solicitud.countDocuments(filtro),
    Solicitud.find(filtro)
      .sort(ORDENES[orden] || ORDENES.recientes)
      .skip((page - 1) * limit)
      .limit(limit)
  ])

  return { total, page, limit, orden, solicitudes: documentos.map((doc) => doc.toJSON()) }
}

export const obtenerSolicitudPorId = async (id) => {
  const solicitud = await Solicitud.findById(id)
  if (!solicitud) throw ApiError.notFound(`No existe una solicitud con id ${id}`)
  return solicitud
}

/** Respuesta generada por el Worker (o null si aún no está lista). */
export const obtenerRespuestaDeSolicitud = async (id) => {
  const solicitud = await obtenerSolicitudPorId(id)
  return {
    solicitud: solicitud.toJSON(),
    respondida: solicitud.estado === ESTADO.RESPONDIDA,
    respuesta: solicitud.respuesta,
    estado: solicitud.estado,
    mensajeError: solicitud.mensajeError,
    fechaRespuesta: solicitud.fechaRespuesta
  }
}

/**
 * Flujo principal: registrar -> guardar -> encolar -> notificar.
 * Nunca procesa: solo deja la solicitud lista para el Worker.
 */
export const crearSolicitud = async (datos) => {
  const codigo = await generarCodigoSolicitud()

  const solicitud = await Solicitud.create({
    codigo,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria,
    prioridad: datos.prioridad || PRIORIDAD.MEDIA,
    estado: ESTADO.PENDIENTE,
    solicitante: {
      nombre: datos.solicitante?.nombre || 'Anónimo',
      email: datos.solicitante?.email || null,
      dependencia: datos.solicitante?.dependencia || null
    },
    canal: datos.canal || 'web',
    fechaCreacion: datos.fechaCreacion ? new Date(datos.fechaCreacion) : new Date(),
    historialEstados: [{ estado: ESTADO.PENDIENTE, detalle: 'Solicitud radicada en el sistema', origen: 'backend' }]
  })

  // 1) Aviso inmediato: la solicitud ya quedó persistida en MongoDB.
  emitirSolicitudCreada(solicitud)

  // 2) Envío a la cola FIFO de Redis (el Worker la consumirá).
  const infoCola = await encolarSolicitud(solicitud)

  if (infoCola.encolada) {
    solicitud.estado = ESTADO.EN_COLA
    solicitud.fechaEncolado = new Date()
    solicitud.historialEstados.push({ estado: ESTADO.EN_COLA, detalle: 'Encolada en Redis para el Worker', origen: 'backend' })
    await solicitud.save()
    emitirSolicitudEncolada(solicitud, infoCola)
  } else {
    logger.warn(`Solicitud ${solicitud.codigo} guardada sin encolar (${infoCola.motivo})`)
  }

  // 3) Consistencia de caché + refresco del monitor en tiempo real.
  await invalidarPorPatron(PATRON_SOLICITUDES)
  await invalidarPorPatron(PATRON_INDICADORES)
  await notificarActualizacionMonitor()

  return { solicitud, cola: infoCola }
}

/** Actualización de los campos editables por el usuario (PUT). */
export const actualizarSolicitud = async (id, cambios = {}) => {
  const solicitud = await obtenerSolicitudPorId(id)

  CAMPOS_EDITABLES.forEach((campo) => {
    if (cambios[campo] === undefined || cambios[campo] === null) return

    if (campo === 'solicitante') {
      const actual = typeof solicitud.solicitante?.toObject === 'function' ? solicitud.solicitante.toObject() : solicitud.solicitante || {}
      solicitud.solicitante = { ...actual, ...cambios.solicitante }
      return
    }

    solicitud[campo] = typeof cambios[campo] === 'string' ? cambios[campo].trim() : cambios[campo]
  })

  await solicitud.save()
  await invalidarPorPatron(PATRON_SOLICITUDES)
  await invalidarPorPatron(PATRON_INDICADORES)

  return solicitud
}

/**
 * Cambio de estado controlado. El Worker normalmente escribe directo en
 * MongoDB; esta función existe para administración y pruebas, y valida
 * que la transición respete el ciclo de vida.
 */
export const actualizarEstadoSolicitud = async (id, { estado, respuesta, mensajeError, workerId, origen = 'usuario' }) => {
  const solicitud = await obtenerSolicitudPorId(id)

  if (solicitud.estado !== estado && !puedeTransicionar(solicitud.estado, estado)) {
    throw ApiError.conflict(`No se puede pasar de "${solicitud.estado}" a "${estado}"`, {
      estadoActual: solicitud.estado,
      estadoSolicitado: estado
    })
  }

  const ahora = new Date()
  solicitud.estado = estado
  solicitud.historialEstados.push({ estado, detalle: mensajeError || 'Cambio de estado', fecha: ahora, origen })

  if (estado === ESTADO.PROCESANDO) {
    solicitud.fechaProcesamiento = ahora
    if (workerId) solicitud.workerId = workerId
  }
  if (estado === ESTADO.RESPONDIDA) {
    if (respuesta) solicitud.respuesta = respuesta
    solicitud.fechaRespuesta = ahora
  }
  if (estado === ESTADO.ERROR) {
    solicitud.mensajeError = mensajeError || solicitud.mensajeError || 'Error durante el procesamiento'
    solicitud.intentos += 1
  }

  await solicitud.save()
  await invalidarPorPatron(PATRON_SOLICITUDES)
  await invalidarPorPatron(PATRON_INDICADORES)

  return solicitud
}

export const eliminarSolicitud = async (id) => {
  const solicitud = await obtenerSolicitudPorId(id)
  await solicitud.deleteOne()
  await invalidarPorPatron(PATRON_SOLICITUDES)
  await invalidarPorPatron(PATRON_INDICADORES)
  await notificarActualizacionMonitor()
  return solicitud
}

/** Conteo agrupado por estado (lo consumen indicadores y monitor). */
export const contarPorEstado = async () => {
  const resultados = await Solicitud.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }])
  return resultados.reduce((acumulado, item) => ({ ...acumulado, [item._id]: item.total }), {})
}
