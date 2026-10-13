import mongoose from 'mongoose';
import {
  ESTADOS,
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS,
  CATEGORIAS_VALIDAS,
} from '../config/constants.js';

const { Schema, model } = mongoose;

/**
 * Entidad SOLICITUD — mismo schema exacto que usa el backend
 * (backend/models/Solicitud.js). Se replica para que el Worker lea/escriba
 * sobre la MISMA colección "solicitudes" sin romper la validación de enums.
 * El _id de Mongo cumple el rol de "id" del modelo de información.
 */
const solicitudSchema = new Schema(
  {
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
    respuesta: {
      type: String,
      default: null,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaProcesamiento: {
      type: Date,
      default: null,
    },
    mensajeError: {
      type: String,
      default: null,
    },
  },
  {
    // createdAt/updatedAt de Mongoose quedan como metadatos técnicos;
    // fechaCreacion/fechaProcesamiento son los campos "de negocio".
    timestamps: true,
    versionKey: false,
  }
);

// Serialización: exponer "id" en vez de "_id" (igual que el backend)
// para que el documento publicado en el evento coincida con lo que el
// frontend ya espera (data.id).
solicitudSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Solicitud = model('Solicitud', solicitudSchema);

export default Solicitud;
