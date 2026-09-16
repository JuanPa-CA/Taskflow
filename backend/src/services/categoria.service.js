/**
 * services/categoria.service.js
 * ------------------------------------------------------------------
 * Catálogo de categorías: CRUD administrable por el backend y
 * consulta cacheada (cache-aside) para el formulario del frontend.
 */
import { Categoria } from '../models/categoria.model.js'
import { CATEGORIAS, CATEGORIAS_SEED } from '../constants/categorias.constants.js'
import { PATRON_CATEGORIAS, TTL } from '../constants/cache.constants.js'
import { ApiError } from '../utils/apiError.js'
import { invalidarPorPatron, recordar } from './cache.service.js'
import { logger } from '../utils/logger.js'

const CLAVE_LISTADO = `${PATRON_CATEGORIAS.replace('*', '')}:listado`

/** Listado con CACHE-ASIDE: 1ª consulta MISS (Mongo), siguientes HIT (Redis). */
export const listarCategorias = async ({ soloActivas = true } = {}) => {
  const clave = `${CLAVE_LISTADO}:${soloActivas ? 'activas' : 'todas'}`
  const { valor, origen, cache } = await recordar(clave, TTL.CATEGORIAS, async () => {
    const filtro = soloActivas ? { activa: true } : {}
    const documentos = await Categoria.find(filtro).sort({ orden: 1, nombre: 1 })
    return documentos.map((doc) => doc.toJSON())
  })

  return { total: valor.length, origen, cache, categorias: valor }
}

export const obtenerCategoriaPorId = async (id) => {
  const categoria = await Categoria.findById(id)
  if (!categoria) throw ApiError.notFound(`No existe una categoría con id ${id}`)
  return categoria
}

export const crearCategoria = async (datos) => {
  const existente = await Categoria.findOne({ nombre: datos.nombre })
  if (existente) throw ApiError.conflict(`La categoría "${datos.nombre}" ya existe`)

  const categoria = await Categoria.create(datos)
  await invalidarPorPatron(PATRON_CATEGORIAS)
  return categoria
}

export const actualizarCategoria = async (id, cambios = {}) => {
  const categoria = await obtenerCategoriaPorId(id)
  const permitidos = ['descripcion', 'slaHoras', 'requiereAdjunto', 'plantillaRespuesta', 'activa', 'orden']

  permitidos.forEach((campo) => {
    if (cambios[campo] !== undefined) categoria[campo] = cambios[campo]
  })

  await categoria.save()
  await invalidarPorPatron(PATRON_CATEGORIAS)
  return categoria
}

/** Baja lógica: se desactiva para no romper solicitudes históricas. */
export const desactivarCategoria = async (id) => {
  const categoria = await obtenerCategoriaPorId(id)
  categoria.activa = false
  await categoria.save()
  await invalidarPorPatron(PATRON_CATEGORIAS)
  return categoria
}

/**
 * Sincroniza el catálogo con las categorías soportadas (usado por
 * `npm run seed` y al arrancar el servicio).
 */
export const sincronizarCatalogo = async () => {
  const resultados = await Promise.all(
    CATEGORIAS_SEED.map((categoria) =>
      Categoria.findOneAndUpdate(
        { nombre: categoria.nombre },
        { $setOnInsert: categoria },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  )

  await invalidarPorPatron(PATRON_CATEGORIAS)
  logger.info(`Catálogo de categorías sincronizado (${resultados.length} de ${CATEGORIAS.length})`)
  return resultados
}
