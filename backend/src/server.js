/**
 * server.js
 * ------------------------------------------------------------------
 * Punto de entrada real: crea el servidor HTTP, conecta MongoDB y
 * Redis, levanta Socket.IO y expone la API. Gestiona además el apagado
 * ordenado (SIGINT/SIGTERM) para no dejar conexiones abiertas.
 */
import http from 'node:http'
import process from 'node:process'

import app from './app.js'
import { env } from './config/env.config.js'
import { conectarMongo, desconectarMongo, estadoMongo } from './config/mongo.config.js'
import { conectarRedis, desconectarRedis, estadoRedis } from './config/redis.config.js'
import { inicializarSockets, cerrarSockets } from './sockets/index.js'
import { sincronizarCatalogo } from './services/categoria.service.js'
import { logger } from './utils/logger.js'

let servidorHttp = null
let io = null

const iniciar = async () => {
  logger.info(`Iniciando TASKFLOW Backend en modo ${env.NODE_ENV}`)

  // 1) Dependencias de infraestructura (modo degradado si Redis falla).
  await conectarMongo()
  const redisOk = await conectarRedis()
  if (!redisOk) {
    logger.warn('El backend iniciará sin caché ni cola: revise la conexión con Redis')
  }

  // 2) Catálogo base de categorías (idempotente).
  try {
    await sincronizarCatalogo()
  } catch (error) {
    logger.warn(`No fue posible sincronizar el catálogo de categorías: ${error.message}`)
  }

  // 3) Servidor HTTP + Socket.IO.
  servidorHttp = http.createServer(app)
  io = inicializarSockets(servidorHttp)

  servidorHttp.listen(env.PORT, env.HOST, () => {
    logger.info(`API disponible en http://localhost:${env.PORT}`)
    logger.info(`WebSocket disponible en ws://localhost:${env.PORT} (Socket.IO)`)
    logger.info(`Estado -> MongoDB: ${estadoMongo()} | Redis: ${estadoRedis()}`)
  })

  // 4) Cierre ordenado.
  const apagar = async (senal) => {
    logger.info(`Señal ${senal} recibida: cerrando el servicio...`)
    try {
      await cerrarSockets(io)
      await new Promise((resolve) => servidorHttp.close(resolve))
      await desconectarRedis()
      await desconectarMongo()
      logger.info('Servicio detenido correctamente')
      process.exit(0)
    } catch (error) {
      logger.error(`Error durante el apagado: ${error.message}`)
      process.exit(1)
    }
  }

  ;['SIGINT', 'SIGTERM'].forEach((senal) => process.on(senal, () => apagar(senal)))
}

process.on('unhandledRejection', (motivo) => {
  logger.error(`Promesa rechazada no controlada: ${motivo instanceof Error ? motivo.message : motivo}`)
})

process.on('uncaughtException', (error) => {
  logger.error(`Excepción no controlada: ${error.message}`, error.stack)
})

iniciar().catch((error) => {
  logger.error(`No fue posible iniciar el backend: ${error.message}`, error.stack)
  process.exit(1)
})
