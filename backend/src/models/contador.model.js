/**
 * models/contador.model.js
 * ------------------------------------------------------------------
 * Contador atómico (colección `contadores`) para generar el código de
 * radicado consecutivo de cada solicitud sin condiciones de carrera.
 */
import mongoose from 'mongoose'

const { Schema } = mongoose

const contadorSchema = new Schema(
  {
    clave: { type: String, required: true, unique: true, trim: true },
    secuencia: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true, versionKey: false }
)

export const Contador = mongoose.model('Contador', contadorSchema)
