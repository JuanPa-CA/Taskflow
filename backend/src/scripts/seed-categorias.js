/**
 * scripts/seed-categorias.js
 * ------------------------------------------------------------------
 * Script utilitario (`npm run seed`) que carga/actualiza el catálogo
 * de categorías de solicitud en MongoDB. Es idempotente: se puede
 * ejecutar varias veces sin duplicar documentos.
 */
import { conectarMongo, desconectarMongo } from '../config/mongo.config.js'
import { listarCategorias, sincronizarCatalogo } from '../services/categoria.service.js'
import { logger } from '../utils/logger.js'

const ejecutar = async () => {
  const conexion = await conectarMongo()
  if (!conexion) {
    logger.error('No hay conexión a MongoDB: no se pudo ejecutar el seed')
    process.exit(1)
  }

  await sincronizarCatalogo()
  const { categorias } = await listarCategorias({ soloActivas: false })

  logger.info(`Seed completado. Categorías en la base de datos: ${categorias.length}`)
  categorias.forEach((categoria) => logger.info(` - ${categoria.nombre} (SLA ${categoria.slaHoras}h)`))

  await desconectarMongo()
  process.exit(0)
}

ejecutar().catch(async (error) => {
  logger.error(`Error ejecutando el seed: ${error.message}`)
  await desconectarMongo()
  process.exit(1)
})
