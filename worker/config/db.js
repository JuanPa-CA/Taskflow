import mongoose from 'mongoose';
import { env } from './env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Conecta a MongoDB usando el nombre de servicio de Docker Compose
 * (nunca "localhost"). Ejemplo de MONGO_URI: mongodb://mongoserver:27017/taskflow
 *
 * A diferencia del backend, aquí hay reintentos: el Worker es un proceso de
 * larga vida y no debe caerse si Mongo tarda unos segundos en aceptar
 * conexiones (compose ya espera el healthcheck, esto es una segunda red de seguridad).
 */
export async function connectDB(maxIntentos = 10, delayMs = 2000) {
  mongoose.connection.on('connected', () => {
    console.log('[worker:mongo] conectado:', mongoose.connection.host, '/', mongoose.connection.name);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[worker:mongo] error de conexión:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[worker:mongo] conexión perdida');
  });

  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    try {
      await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      return mongoose.connection;
    } catch (err) {
      console.warn(
        `[worker:mongo] no se pudo conectar (intento ${intento}/${maxIntentos}): ${err.message}`
      );
      if (intento === maxIntentos) throw err;
      await sleep(delayMs);
    }
  }
  return mongoose.connection;
}

/** Cierre ordenado: lo usa worker.js al terminar el loop (SIGINT/SIGTERM). */
export async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[worker:mongo] desconectado');
}

export default { connectDB, disconnectDB };
