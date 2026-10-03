import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Redis from 'ioredis'

dotenv.config()

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_DB: Number(process.env.REDIS_DB || 0),
  REDIS_QUEUE_KEY: process.env.REDIS_QUEUE_KEY || process.env.COLA_SOLICITUDES || 'taskflow:queue:solicitudes',
  CANAL_EVENTOS: process.env.CANAL_EVENTOS || 'taskflow:eventos',
  CACHE_PREFIX: process.env.CACHE_PREFIX || 'taskflow',
  REDIS_HEARTBEAT_KEY: process.env.REDIS_HEARTBEAT_KEY || 'taskflow:worker:heartbeat',
  HEARTBEAT_WORKER_TTL: Number(process.env.HEARTBEAT_WORKER_TTL || 30)
}

const COLECCION_SOLICITUDES = 'solicituds'
const MENSAJE_ERROR_USUARIO = 'No fue posible procesar esta solicitud. Inténtalo de nuevo más tarde o contacta al equipo de soporte.'

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy: (attempt) => Math.min(attempt * 1000, 30000)
})

mongoose.set('strictQuery', true)

const log = (mensaje, detalle) => {
  if (detalle) console.log(`[worker] ${mensaje}`, detalle)
  else console.log(`[worker] ${mensaje}`)
}

const obtenerRespuesta = (solicitud) => {
  const categoria = solicitud?.categoria || 'Información'
  const titulo = solicitud?.titulo || 'solicitud'
  const prioridad = solicitud?.prioridad || 'Media'

  const base = `Gracias por tu solicitud "${titulo}". Hemos recibido tu caso y la estamos revisando con prioridad ${prioridad}.`

  switch (categoria) {
    case 'Información':
      return `${base} Te compartimos la información solicitada y confirmamos que esta respuesta corresponde a una consulta de información general.`
    case 'Soporte':
      return `${base} El área de soporte ha registrado tu incidente y dará seguimiento técnico en el menor tiempo posible.`
    case 'Documento':
      return `${base} El documento solicitado está en proceso de validación y será entregado conforme al trámite correspondiente.`
    case 'Consulta':
      return `${base} Hemos revisado tu consulta y la respuesta quedó registrada para continuar con la atención necesaria.`
    case 'Actualización':
      return `${base} La actualización de datos quedó registrada y se continuará con la validación requerida.`
    default:
      return `${base} Hemos confirmado la recepción de tu solicitud y continuaremos con el proceso.`
  }
}

const publicarEvento = async (evento, data) => {
  try {
    await redis.publish(env.CANAL_EVENTOS, JSON.stringify({ evento, data }))
    log(`evento publicado: ${evento}`)
  } catch (error) {
    log(`No fue posible publicar ${evento}`, error.message)
  }
}

const invalidarCachesSolicitudes = async () => {
  for (const patron of [
    `${env.CACHE_PREFIX}:cache:solicitudes:listado*`,
    `${env.CACHE_PREFIX}:cache:estadisticas`
  ]) {
    try {
      let cursor = '0'
      do {
        const [siguiente, claves] = await redis.scan(cursor, 'MATCH', patron, 'COUNT', 100)
        cursor = siguiente
        if (claves.length > 0) await redis.del(...claves)
      } while (cursor !== '0')
    } catch (error) {
      log(`No fue posible invalidar caché (${patron})`, error.message)
    }
  }
}

const registrarLatido = async () => {
  try {
    await redis.set(env.REDIS_HEARTBEAT_KEY, JSON.stringify({
      estado: 'Activo',
      fecha: new Date().toISOString(),
      detalle: 'Worker funcionando correctamente'
    }), 'EX', env.HEARTBEAT_WORKER_TTL)
  } catch (error) {
    log('Error registrando heartbeat', error.message)
  }
}

const actualizarHistorial = (historialActual, estado, detalle, origen = 'worker') => {
  const historial = Array.isArray(historialActual) ? historialActual : []
  historial.push({
    estado,
    detalle,
    fecha: new Date(),
    origen
  })
  return historial
}

const procesarSolicitud = async (payload) => {
  if (!payload || !payload.solicitudId) {
    log('Payload vacío o sin solicitudId, descartado')
    return
  }

  const solicitudId = payload.solicitudId
  log(`Procesando solicitud ${solicitudId}`)
  try {
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('MongoDB no está disponible para el worker')
    }

    const solicitud = await db.collection(COLECCION_SOLICITUDES).findOne({ _id: new mongoose.Types.ObjectId(solicitudId) })
    if (!solicitud) {
      log(`Solicitud ${solicitudId} no encontrada en MongoDB; se descarta del procesamiento.`)
      return
    }

    const ahora = new Date()
    const historial = actualizarHistorial(solicitud.historialEstados, 'PROCESANDO', 'Solicitud tomada por el Worker', 'worker')

    await db.collection(COLECCION_SOLICITUDES).updateOne(
      { _id: solicitud._id },
      {
        $set: {
          estado: 'PROCESANDO',
          fechaProcesamiento: ahora,
          workerId: 'taskflow-worker',
          historialEstados: historial
        }
      }
    )
    await invalidarCachesSolicitudes()

    await publicarEvento('solicitud-procesando', {
      id: String(solicitud._id),
      solicitudId: String(solicitud._id),
      estado: 'PROCESANDO',
      fecha: ahora.toISOString()
    })

    const respuesta = obtenerRespuesta(solicitud)
    const respuestaActualizada = await db.collection(COLECCION_SOLICITUDES).findOneAndUpdate(
      { _id: solicitud._id },
      {
        $set: {
          estado: 'RESPONDIDA',
          respuesta,
          mensajeError: null,
          fechaRespuesta: ahora,
          tiempoProcesamientoMs: ahora.getTime() - new Date(solicitud.fechaCreacion).getTime(),
          historialEstados: actualizarHistorial(historial, 'RESPONDIDA', 'Solicitud respondida por el Worker', 'worker')
        }
      },
      { returnDocument: 'after' }
    )
    if (!respuestaActualizada) {
      throw new Error(`No fue posible guardar la respuesta de la solicitud ${solicitudId}`)
    }

    await invalidarCachesSolicitudes()
    await publicarEvento('solicitud-respondida', {
      id: String(solicitud._id),
      solicitudId: String(solicitud._id),
      respuesta,
      estado: 'RESPONDIDA',
      fecha: ahora.toISOString(),
      solicitud: { ...respuestaActualizada, id: String(respuestaActualizada?._id || solicitud._id) }
    })

    log(`Solicitud ${solicitudId} respondida correctamente`)
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error)
    log(`Solicitud ${solicitudId} falló en procesamiento`, detalle)

    try {
      const db = mongoose.connection.db
      if (!db) {
        throw new Error('MongoDB no está disponible para registrar el error')
      }

      const resultado = await db.collection(COLECCION_SOLICITUDES).updateOne(
        { _id: new mongoose.Types.ObjectId(solicitudId) },
        {
          $set: {
            estado: 'ERROR',
            mensajeError: MENSAJE_ERROR_USUARIO
          },
          $inc: { intentos: 1 },
          $push: {
            historialEstados: {
              estado: 'ERROR',
              detalle: MENSAJE_ERROR_USUARIO,
              fecha: new Date(),
              origen: 'worker'
            }
          }
        }
      )

      if (resultado.matchedCount === 0) {
        log(`No se pudo registrar el error de la solicitud ${solicitudId}: no existe en MongoDB`)
        return
      }

      await invalidarCachesSolicitudes()
      await publicarEvento('solicitud-error', {
        id: solicitudId,
        solicitudId,
        estado: 'ERROR',
        mensajeError: MENSAJE_ERROR_USUARIO,
        fecha: new Date().toISOString()
      })
    } catch (errorAlRegistrar) {
      const detalleRegistro = errorAlRegistrar instanceof Error ? errorAlRegistrar.message : String(errorAlRegistrar)
      log(`No fue posible guardar el estado ERROR de la solicitud ${solicitudId}`, detalleRegistro)
    }
  }
}

const consumirCola = async () => {
  while (true) {
    try {
      const resultado = await redis.blpop(env.REDIS_QUEUE_KEY, 30)
      if (!resultado) continue

      const [, payload] = resultado
      let item
      try {
        item = JSON.parse(payload)
      } catch {
        item = { solicitudId: payload }
      }
      if (typeof item === 'string') item = { solicitudId: item }
      await procesarSolicitud(item)
    } catch (error) {
      log('Error al consumir la cola', error.message)
    }
  }
}

const arrancar = async () => {
  log(`Iniciando worker para la cola ${env.REDIS_QUEUE_KEY}`)

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    })
    log(`MongoDB conectado: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`)
  } catch (error) {
    log('No fue posible conectar a MongoDB', error.message)
    process.exit(1)
  }

  try {
    await redis.connect()
    log(`Redis conectado: ${env.REDIS_HOST}:${env.REDIS_PORT}`)
  } catch (error) {
    log('No fue posible conectar a Redis', error.message)
    process.exit(1)
  }

  setInterval(() => {
    registrarLatido().catch((error) => log('Heartbeat fallido', error.message))
  }, 10000)

  await registrarLatido()
  await consumirCola()
}

arrancar().catch((error) => {
  log('Fallo crítico del worker', error.message)
  process.exit(1)
})
