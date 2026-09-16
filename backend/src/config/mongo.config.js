/**
 * config/mongo.config.js
 * ------------------------------------------------------------------
 * Conexión a MongoDB mediante Mongoose. Expone utilidades de estado
 * usadas por el monitor del sistema y el apagado ordenado.
 */
import mongoose from 'mongoose'
import { env } from './env.config.js'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)

const ESTADOS_MONGOOSE = {
  0: 'Desconectado',
  1: 'Conectado',
  2: 'Conectando',
  3: 'Desconectando'
}

export const conectarMongo = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    })
    logger.info(`MongoDB conectado en ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`)
    return mongoose.connection
  } catch (error) {
    logger.error(`No fue posible conectar a MongoDB: ${error.message}`)
    return null
  }
}

/** Nombre legible del estado de la conexión (readyState). */
export const estadoMongo = () => ESTADOS_MONGOOSE[mongoose.connection.readyState] || 'Desconocido'

/** `true` solo si hay conexión activa y operativa. */
export const mongoDisponible = () => mongoose.connection.readyState === 1

/** Ping real contra el servidor de MongoDB (usado por /monitor). */
export const pingMongo = async () => {
  if (!mongoDisponible() || !mongoose.connection.db) return false
  try {
    await mongoose.connection.db.admin().ping()
    return true
  } catch {
    return false
  }
}

export const desconectarMongo = async () => {
  if (mongoose.connection.readyState === 0) return
  await mongoose.connection.close()
  logger.info('Conexión a MongoDB cerrada')
}
