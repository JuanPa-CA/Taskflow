/**
 * models/solicitud.model.js
 * ------------------------------------------------------------------
 * Colección `solicitudes`: entidad central del dominio. El backend
 * crea el documento y lo encola; el Worker solo actualiza estado,
 * respuesta y fechas. Se conserva `historialEstados` como traza
 * auditable del ciclo de vida.
 */
import mongoose from 'mongoose'
import { ESTADO, ESTADOS } from '../constants/estados.constants.js'
import { PRIORIDAD, PRIORIDADES } from '../constants/prioridades.constants.js'
import { CATEGORIAS } from '../constants/categorias.constants.js'

const { Schema } = mongoose

/** Normaliza la salida JSON: `_id` -> `id` (lo que consume el frontend). */
const transformarSalida = (_doc, ret) => {
  ret.id = ret._id?.toString()
  delete ret._id
  delete ret.__v
  return ret
}

const historialEstadoSchema = new Schema(
  {
    estado: { type: String, enum: ESTADOS, required: true },
    fecha: { type: Date, default: Date.now },
    detalle: { type: String, default: null },
    origen: { type: String, enum: ['backend', 'worker', 'usuario'], default: 'backend' }
  },
  { _id: false }
)

const solicitanteSchema = new Schema(
  {
    nombre: { type: String, trim: true, default: 'Anónimo' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    dependencia: { type: String, trim: true, default: null }
  },
  { _id: false }
)

const solicitudSchema = new Schema(
  {
    codigo: {
      type: String,
      unique: true,
      index: true,
      trim: true
    },
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [120, 'El título no puede superar 120 caracteres']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: [5, 'La descripción debe tener al menos 5 caracteres'],
      maxlength: [3000, 'La descripción no puede superar 3000 caracteres']
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: { values: CATEGORIAS, message: `Categoría no válida. Permitidas: ${CATEGORIAS.join(', ')}` },
      index: true
    },
    prioridad: {
      type: String,
      enum: { values: PRIORIDADES, message: `Prioridad no válida. Permitidas: ${PRIORIDADES.join(', ')}` },
      default: PRIORIDAD.MEDIA,
      index: true
    },
    estado: {
      type: String,
      enum: ESTADOS,
      default: ESTADO.PENDIENTE,
      index: true
    },
    solicitante: { type: solicitanteSchema, default: () => ({}) },
    canal: {
      type: String,
      enum: ['web', 'api', 'correo'],
      default: 'web'
    },

    // Resultado del procesamiento asíncrono (lo escribe el Worker)
    respuesta: { type: String, default: null },
    mensajeError: { type: String, default: null },
    intentos: { type: Number, default: 0, min: 0 },
    workerId: { type: String, default: null },
    tiempoProcesamientoMs: { type: Number, default: null },

    // Marcas de tiempo del ciclo de vida
    fechaCreacion: { type: Date, default: Date.now },
    fechaEncolado: { type: Date, default: null },
    fechaProcesamiento: { type: Date, default: null },
    fechaRespuesta: { type: Date, default: null },

    historialEstados: { type: [historialEstadoSchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, transform: transformarSalida },
    toObject: { virtuals: true, transform: transformarSalida }
  }
)

// Índices para los filtros y el orden del listado (HU de gestión de solicitudes).
solicitudSchema.index({ createdAt: -1 })
solicitudSchema.index({ estado: 1, createdAt: -1 })
solicitudSchema.index({ categoria: 1, estado: 1 })
solicitudSchema.index({ titulo: 'text', descripcion: 'text', codigo: 'text' })

/** ¿La solicitud ya terminó su ciclo (respondida o con error)? */
solicitudSchema.virtual('finalizada').get(function finalizada() {
  return [ESTADO.RESPONDIDA, ESTADO.ERROR].includes(this.estado)
})

/** Tiempo total desde la radicación hasta la respuesta (ms). */
solicitudSchema.virtual('tiempoTotalMs').get(function tiempoTotal() {
  if (!this.fechaRespuesta) return null
  return this.fechaRespuesta.getTime() - this.createdAt.getTime()
})

export const Solicitud = mongoose.model('Solicitud', solicitudSchema)
