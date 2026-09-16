/**
 * config/socket.config.js
 * ------------------------------------------------------------------
 * Opciones de configuración del servidor Socket.IO (CORS, transportes
 * y tiempos de espera). La creación de la instancia y el registro de
 * eventos vive en `src/sockets/index.js`.
 *
 * IMPORTANTE: el objeto NO se congela (Object.freeze) porque Socket.IO
 * agrega propiedades internas a las opciones durante su inicialización.
 */
import { env } from './env.config.js'

export const opcionesSocket = {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6
}

/** Copia limpia de las opciones para entregar a cada instancia de Socket.IO. */
export const crearOpcionesSocket = () => ({
  ...opcionesSocket,
  cors: { ...opcionesSocket.cors },
  transports: [...opcionesSocket.transports]
})

