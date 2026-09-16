/**
 * routes/index.routes.js
 * ------------------------------------------------------------------
 * Router raíz: monta cada módulo en su ruta base y documenta la API.
 * El frontend consume las rutas en la raíz (http://localhost:3000/
 * solicitudes, /monitor, ...), por eso no se antepone ningún prefijo.
 */
import { Router } from 'express'
import solicitudRoutes from './solicitud.routes.js'
import categoriaRoutes from './categoria.routes.js'
import indicadorRoutes from './indicador.routes.js'
import monitorRoutes from './monitor.routes.js'
import cacheRoutes from './cache.routes.js'
import { ENDPOINTS_DISPONIBLES } from '../middlewares/notFound.middleware.js'
import { estadoMongo, mongoDisponible, pingMongo } from '../config/mongo.config.js'
import { estadoRedis, pingRedis } from '../config/redis.config.js'

const router = Router()

/** GET / -> información y mapa de endpoints del servicio. */
router.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    servicio: 'TASKFLOW Backend API',
    descripcion: 'Recepción, validación, persistencia (MongoDB) y encolado (Redis) de solicitudes. El procesamiento lo realiza el Worker.',
    version: '1.0.0',
    arquitectura: {
      persistencia: 'MongoDB + Mongoose',
      cache: 'Redis (cache-aside)',
      cola: 'Redis (lista FIFO: RPUSH / BLPOP)',
      tiempoReal: 'Socket.IO + Redis Pub/Sub'
    },
    endpoints: ENDPOINTS_DISPONIBLES
  })
})

/** GET /health -> liveness/readiness probe sencillo. */
router.get('/health', async (_req, res) => {
  const [mongoOk, redisOk] = await Promise.all([pingMongo(), pingRedis()])

  res.status(mongoOk ? 200 : 503).json({
    ok: mongoOk,
    servicio: 'taskflow-backend',
    mongodb: { ok: mongoOk && mongoDisponible(), estado: estadoMongo() },
    redis: { ok: redisOk, estado: estadoRedis() },
    uptimeSegundos: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

router.use('/solicitudes', solicitudRoutes)
router.use('/categorias', categoriaRoutes)
router.use('/indicadores', indicadorRoutes)
router.use('/monitor', monitorRoutes)
router.use('/cache', cacheRoutes)

export default router
