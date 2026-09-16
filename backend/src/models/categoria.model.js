/**
 * models/categoria.model.js
 * ------------------------------------------------------------------
 * Catálogo de categorías de solicitud con su SLA y reglas propias.
 * El backend lo mantiene (catálogo administrable); el Worker puede
 * consultarlo para decidir la respuesta automática.
 */
import mongoose from 'mongoose'
import { CATEGORIAS } from '../constants/categorias.constants.js'

const { Schema } = mongoose

const categoriaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      unique: true,
      trim: true,
      enum: { values: CATEGORIAS, message: `Categoría no soportada. Permitidas: ${CATEGORIAS.join(', ')}` }
    },
    descripcion: { type: String, trim: true, default: null },
    slaHoras: { type: Number, default: 24, min: 1, max: 720 },
    requiereAdjunto: { type: Boolean, default: false },
    plantillaRespuesta: { type: String, trim: true, default: null },
    activa: { type: Boolean, default: true, index: true },
    orden: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString()
        delete ret._id
        delete ret.__v
        return ret
      }
    }
  }
)

export const Categoria = mongoose.model('Categoria', categoriaSchema)
