/**
 * utils/codigo.util.js
 * ------------------------------------------------------------------
 * Genera el código de radicado consecutivo visible al usuario
 * (ej. TF-2026-00042) usando el modelo Contador con $inc atómico,
 * evitando duplicados bajo concurrencia.
 */
import mongoose from 'mongoose'
import { Contador } from '../models/contador.model.js'

export const generarCodigoSolicitud = async () => {
  const anio = new Date().getFullYear()
  const clave = `solicitud:${anio}`

  // Si no hay conexión a Mongo, generamos un código temporal legible.
  if (mongoose.connection.readyState !== 1) {
    return `TF-${anio}-${Date.now().toString().slice(-5)}`
  }

  const contador = await Contador.findOneAndUpdate(
    { clave },
    { $inc: { secuencia: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return `TF-${anio}-${String(contador.secuencia).padStart(5, '0')}`
}
