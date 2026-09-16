/**
 * controllers/categoria.controller.js
 * ------------------------------------------------------------------
 * Controladores del catálogo de categorías de solicitud.
 */
import { asyncHandler } from '../middlewares/asyncHandler.js'
import * as categoriaService from '../services/categoria.service.js'

/** GET /categorias?todas=true */
export const listar = asyncHandler(async (req, res) => {
  const soloActivas = req.query.todas !== 'true'
  const resultado = await categoriaService.listarCategorias({ soloActivas })

  res.status(200).json({
    ok: true,
    total: resultado.total,
    cache: resultado.cache,
    origen: resultado.origen,
    categorias: resultado.categorias
  })
})

/** GET /categorias/:id */
export const obtener = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.obtenerCategoriaPorId(req.params.id)

  res.status(200).json({ ok: true, categoria: categoria.toJSON() })
})

/** POST /categorias */
export const crear = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.crearCategoria(req.body)

  res.status(201).json({
    ok: true,
    mensaje: `Categoría ${categoria.nombre} creada`,
    categoria: categoria.toJSON()
  })
})

/** PUT /categorias/:id */
export const actualizar = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.actualizarCategoria(req.params.id, req.body)

  res.status(200).json({
    ok: true,
    mensaje: 'Categoría actualizada',
    categoria: categoria.toJSON()
  })
})

/** DELETE /categorias/:id (baja lógica) */
export const eliminar = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.desactivarCategoria(req.params.id)

  res.status(200).json({
    ok: true,
    mensaje: `Categoría ${categoria.nombre} desactivada`,
    categoria: categoria.toJSON()
  })
})
