import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Conecta a MongoDB usando el nombre de servicio de Docker Compose
 * (nunca "localhost" -- ver regla de arquitectura #7).
 * Ejemplo de MONGO_URI: mongodb://mongoserver:27017/taskflow
 */
export async function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log('[mongo] conectado:', mongoose.connection.host, '/', mongoose.connection.name);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] error de conexión:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] conexión perdida');
  });

  await mongoose.connect(env.MONGO_URI);

  return mongoose.connection;
}

export default connectDB;
