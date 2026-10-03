import mongoose from 'mongoose';
import {
  ESTADOS,
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS,
  CATEGORIAS_VALIDAS,
} from '../config/constants.js';
import { sanitizarErrorSolicitud } from '../utils/sanitizarSolicitud.js';

const { Schema, model } = mongoose;

const historialEstadoSchema = new Schema(
  {
    estado: { type: String, enum: ESTADOS_VALIDOS, required: true },
    fecha: { type: Date, default: Date.now },
    detalle: { type: String, default: null },
    origen: { type: String, enum: ['backend', 'worker', 'usuario'], default: 'backend' },
  },
  { _id: false }
);

const solicitanteSchema = new Schema(
  {
    nombre: { type: String, trim: true, default: 'Anónimo' },
    email: { type: String, trim: true, lowercase: true, default: null },
    dependencia: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const transformarSalida = (_doc, ret) => {
  const salida = sanitizarErrorSolicitud(ret);
  salida.id = salida._id?.toString();
  delete salida._id;
  return salida;
};

/**
 * Entidad SOLICITUD (sección 9 del taller).
 * El _id de Mongo cumple el rol de "id" pedido en el modelo de información.
 */
const solicitudSchema = new Schema(
  {
    codigo: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: CATEGORIAS_VALIDAS,
        message: 'Categoría inválida: {VALUE}',
      },
    },
    prioridad: {
      type: String,
      required: [true, 'La prioridad es obligatoria'],
      enum: {
        values: PRIORIDADES_VALIDAS,
        message: 'Prioridad inválida: {VALUE}',
      },
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_VALIDOS,
        message: 'Estado inválido: {VALUE}',
      },
      default: ESTADOS.PENDIENTE,
      index: true,
    },
    solicitante: { type: solicitanteSchema, default: () => ({}) },
    canal: {
      type: String,
      enum: ['web', 'api', 'correo'],
      default: 'web',
    },
    respuesta: {
      type: String,
      default: null,
    },
    mensajeError: {
      type: String,
      default: null,
    },
    intentos: {
      type: Number,
      default: 0,
      min: 0,
    },
    workerId: {
      type: String,
      default: null,
    },
    tiempoProcesamientoMs: {
      type: Number,
      default: null,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaEncolado: {
      type: Date,
      default: null,
    },
    fechaProcesamiento: {
      type: Date,
      default: null,
    },
    fechaRespuesta: {
      type: Date,
      default: null,
    },
    historialEstados: {
      type: [historialEstadoSchema],
      default: [],
    },
  },
  {
    // createdAt/updatedAt are technical metadata; fechaCreacion and
    // fechaProcesamiento are the business timestamps consumed by the UI.
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, transform: transformarSalida },
    toObject: { virtuals: true, transform: transformarSalida },
  }
);

solicitudSchema.index({ estado: 1, createdAt: -1 });
solicitudSchema.index({ categoria: 1, estado: 1 });
solicitudSchema.index({ titulo: 'text', descripcion: 'text', codigo: 'text' });

solicitudSchema.virtual('finalizada').get(function finalizada() {
  return [ESTADOS.RESPONDIDA, ESTADOS.ERROR].includes(this.estado);
});

solicitudSchema.virtual('tiempoTotalMs').get(function tiempoTotal() {
  if (!this.fechaRespuesta) return null;
  return this.fechaRespuesta.getTime() - this.createdAt.getTime();
});

export const Solicitud = model('Solicitud', solicitudSchema, 'solicituds');

export default Solicitud;
