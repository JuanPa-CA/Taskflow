/**
 * services/indicador.service.js
 * ------------------------------------------------------------------
 * Indicadores y estadísticas del dashboard. Todas las consultas se
 * resuelven con agregaciones de MongoDB y se cachean con cache-aside
 * (TTL corto) porque son las lecturas más repetidas de la aplicación.
 */
import { Solicitud } from '../models/solicitud.model.js'
import { ESTADO } from '../constants/estados.constants.js'
import { PRIORIDADES } from '../constants/prioridades.constants.js'
import { CATEGORIAS } from '../constants/categorias.constants.js'
import { CLAVE, TTL } from '../constants/cache.constants.js'
import { recordar } from './cache.service.js'
import { longitudCola } from './cola.service.js'

const agrupar = (campo) =>
  Solicitud.aggregate([
    { $group: { _id: `$${campo}`, total: { $sum: 1 }, respondidas: { $sum: { $cond: [{ $eq: ['$estado', ESTADO.RESPONDIDA] }, 1, 0] } }, errores: { $sum: { $cond: [{ $eq: ['$estado', ESTADO.ERROR] }, 1, 0] } } } },
    { $sort: { total: -1 } }
  ])

const normalizarAgrupacion = (resultados, universo) => {
  const mapa = new Map(resultados.map((item) => [item._id, item]))
  return universo.map((valor) => ({
    valor,
    total: mapa.get(valor)?.total || 0,
    respondidas: mapa.get(valor)?.respondidas || 0,
    errores: mapa.get(valor)?.errores || 0
  }))
}

const calcularResumen = async () => {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [conteosPorEstado, total, ultimas24h, tiempoPromedio, colaRedis, porCategoria, porPrioridad] = await Promise.all([
    Solicitud.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
    Solicitud.countDocuments(),
    Solicitud.countDocuments({ createdAt: { $gte: hace24h } }),
    Solicitud.aggregate([
      { $match: { estado: ESTADO.RESPONDIDA, fechaRespuesta: { $ne: null } } },
      { $project: { tiempo: { $subtract: ['$fechaRespuesta', '$createdAt'] } } },
      { $group: { _id: null, promedio: { $avg: '$tiempo' } } }
    ]),
    longitudCola(),
    agrupar('categoria'),
    agrupar('prioridad')
  ])

  const conteos = conteosPorEstado.reduce((acumulado, item) => ({ ...acumulado, [item._id]: item.total }), {})
  const respondidas = conteos[ESTADO.RESPONDIDA] || 0
  const errores = conteos[ESTADO.ERROR] || 0
  const finalizadas = respondidas + errores

  return {
    total,
    pendientes: conteos[ESTADO.PENDIENTE] || 0,
    enCola: conteos[ESTADO.EN_COLA] || 0,
    enColaRedis: colaRedis,
    procesando: conteos[ESTADO.PROCESANDO] || 0,
    respondidas,
    errores,
    ultimas24h,
    tasaResolucion: finalizadas > 0 ? Number(((respondidas / finalizadas) * 100).toFixed(2)) : 0,
    tiempoPromedioRespuestaMs: tiempoPromedio[0]?.promedio ? Math.round(tiempoPromedio[0].promedio) : null,
    porCategoria: normalizarAgrupacion(porCategoria, CATEGORIAS),
    porPrioridad: normalizarAgrupacion(porPrioridad, PRIORIDADES)
  }
}

/** Resumen completo del dashboard (cacheado). */
export const obtenerResumen = async () => {
  const clave = `${CLAVE.INDICADORES}:resumen`
  const { valor, cache, origen } = await recordar(clave, TTL.INDICADORES, calcularResumen)
  return { ...valor, cache, origen, generadoEn: new Date().toISOString() }
}

export const obtenerPorCategoria = async () => {
  const clave = `${CLAVE.INDICADORES}:por-categoria`
  const { valor, cache, origen } = await recordar(clave, TTL.INDICADORES, async () => normalizarAgrupacion(await agrupar('categoria'), CATEGORIAS))
  return { cache, origen, total: valor.length, categorias: valor }
}

export const obtenerPorPrioridad = async () => {
  const clave = `${CLAVE.INDICADORES}:por-prioridad`
  const { valor, cache, origen } = await recordar(clave, TTL.INDICADORES, async () => normalizarAgrupacion(await agrupar('prioridad'), PRIORIDADES))
  return { cache, origen, total: valor.length, prioridades: valor }
}

/** Serie diaria de solicitudes radicadas y respondidas (últimos N días). */
export const obtenerTendencia = async ({ dias = 7 } = {}) => {
  const cantidad = Math.min(Math.max(Number.parseInt(dias, 10) || 7, 1), 30)
  const clave = `${CLAVE.INDICADORES}:tendencia:${cantidad}`

  const construirSerie = async () => {
    const desde = new Date(Date.now() - cantidad * 24 * 60 * 60 * 1000)
    desde.setHours(0, 0, 0, 0)

    const resultados = await Solicitud.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          radicadas: { $sum: 1 },
          respondidas: { $sum: { $cond: [{ $eq: ['$estado', ESTADO.RESPONDIDA] }, 1, 0] } },
          errores: { $sum: { $cond: [{ $eq: ['$estado', ESTADO.ERROR] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const mapa = new Map(resultados.map((item) => [item._id, item]))
    const serie = []

    for (let indice = cantidad - 1; indice >= 0; indice -= 1) {
      const fecha = new Date(Date.now() - indice * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      serie.push({
        fecha,
        radicadas: mapa.get(fecha)?.radicadas || 0,
        respondidas: mapa.get(fecha)?.respondidas || 0,
        errores: mapa.get(fecha)?.errores || 0
      })
    }

    return serie
  }

  const { valor, cache, origen } = await recordar(clave, TTL.INDICADORES, construirSerie)
  return { cache, origen, dias: cantidad, serie: valor }
}

/** Estado de la cola (Redis) para el monitor. */
export const obtenerIndicadoresCola = async () => {
  const [longitud, pendientes] = await Promise.all([longitudCola(), Solicitud.countDocuments({ estado: ESTADO.PENDIENTE })])

  return {
    enColaRedis: longitud,
    pendientesSinEncolar: pendientes,
    disponible: longitud !== null,
    fecha: new Date().toISOString()
  }
}
