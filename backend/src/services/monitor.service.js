/**
 * services/monitor.service.js
 * ------------------------------------------------------------------
 * Monitoreo del sistema (pantalla /monitor del frontend):
 *  - Salud de los 4 componentes: express, mongodb, redis, worker.
 *  - Métricas de la cola y conteos por estado.
 * Responde SIEMPRE en el formato que espera el store de Pinia:
 *   { servicios: { express, mongodb, redis, worker }, metricas: {...} }
 *
 * Nota: este servicio NO importa otros servicios de dominio para evitar
 * dependencias circulares; consulta el modelo Solicitud directamente.
 */
import process from 'node:process'
import mongoose from 'mongoose'
import { Solicitud } from '../models/solicitud.model.js'
import { env } from '../config/env.config.js'
import { pingMongo, estadoMongo, mongoDisponible } from '../config/mongo.config.js'
import { pingRedis, estadoRedis, redisDisponible } from '../config/redis.config.js'
import { ESTADO } from '../constants/estados.constants.js'
import { PREFIJO_CACHE } from '../constants/cache.constants.js'
import { obtenerDeCache } from './cache.service.js'
import { obtenerLatidoWorker, longitudCola, obtenerPendientes } from './cola.service.js'
import { emitirColaActualizada, emitirMonitorActualizado } from './socket.service.js'

const ETIQUETA_MONGO = {
  Conectado: 'Conectado',
  Desconectado: 'Desconectado',
  Conectando: 'Conectando',
  Desconectando: 'Desconectando'
}

const comprobarMongo = async () => {
  const ok = await pingMongo()
  return {
    status: ok ? ETIQUETA_MONGO.Conectado : estadoMongo(),
    ok,
    baseDatos: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    readyState: mongoDisponible() ? 1 : mongoose.connection.readyState
  }
}

const comprobarRedis = async (longitud) => {
  const ok = await pingRedis()
  return {
    status: ok ? 'Conectado' : estadoRedis(),
    ok,
    cola: longitud,
    host: redisDisponible() ? 'disponible' : 'no disponible'
  }
}

const comprobarWorker = async () => {
  const latido = await obtenerLatidoWorker()
  if (!latido) {
    return {
      status: 'Desconectado',
      ok: false,
      ultimoLatido: null,
      detalle: 'Sin latido reciente en Redis (clave taskflow:worker:heartbeat)'
    }
  }
  return {
    status: latido.estado || 'Activo',
    ok: true,
    ultimoLatido: latido.fecha || null,
    detalle: latido.detalle || null
  }
}

/** Conteos por estado en MongoDB. */
const contarPorEstado = async () => {
  const resultados = await Solicitud.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }])
  return resultados.reduce((acumulado, item) => ({ ...acumulado, [item._id]: item.total }), {})
}

/** Estado consolidado del sistema. */
export const obtenerEstadoMonitor = async () => {
  const longitud = await longitudCola()

  const [mongodb, redis, worker, conteos, pendientes] = await Promise.all([
    comprobarMongo(),
    comprobarRedis(longitud),
    comprobarWorker(),
    contarPorEstado(),
    obtenerPendientes(0, 4)
  ])

  const total = Object.values(conteos).reduce((suma, valor) => suma + valor, 0)

  return {
    ok: mongodb.ok && redis.ok,
    servicios: {
      express: {
        status: 'Conectado',
        ok: true,
        version: process.version,
        entorno: process.env.NODE_ENV || 'development',
        uptimeSegundos: Math.round(process.uptime())
      },
      mongodb,
      redis,
      worker
    },
    metricas: {
      total,
      pendientes: conteos[ESTADO.PENDIENTE] || 0,
      // Cuando Redis está disponible se reporta la longitud real de la cola;
      // si no, se usa el conteo de documentos en estado "EN COLA".
      enCola: longitud === null ? conteos[ESTADO.EN_COLA] || 0 : longitud,
      enColaDocumentos: conteos[ESTADO.EN_COLA] || 0,
      procesando: conteos[ESTADO.PROCESANDO] || 0,
      respondidas: conteos[ESTADO.RESPONDIDA] || 0,
      errores: conteos[ESTADO.ERROR] || 0
    },
    cola: {
      nombre: env.COLA_SOLICITUDES,
      longitud,
      disponibles: longitud !== null,
      primerasSolicitudes: pendientes,
      consumidor: worker.ok ? 'Activo' : 'Detenido'
    },
    timestamp: new Date().toISOString()
  }
}

/** Emite el estado del monitor + cola por Socket.IO (lo llaman los servicios). */
export const notificarActualizacionMonitor = async () => {
  try {
    const estado = await obtenerEstadoMonitor()
    emitirMonitorActualizado(estado)
    emitirColaActualizada({ servicios: estado.servicios, metricas: estado.metricas, cola: estado.cola })
    return estado
  } catch {
    return null
  }
}

/** Latido del propio backend (útil para diagnosticar el caché). */
export const comprobarCache = async () => obtenerDeCache(`${PREFIJO_CACHE}:healthcheck`)
