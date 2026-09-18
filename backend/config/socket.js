import { Server } from 'socket.io';
import { env } from './env.js';

let io = null;

/**
 * Inicializa Socket.IO sobre el servidor HTTP de Express.
 * Se llama una sola vez desde server.js.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[socket.io] cliente conectado:', socket.id);

    socket.on('disconnect', (reason) => {
      console.log('[socket.io] cliente desconectado:', socket.id, '-', reason);
    });
  });

  return io;
}

/**
 * Devuelve la instancia de Socket.IO ya inicializada.
 * Se usa desde services/controllers para emitir eventos
 * (solicitud-creada, solicitud-encolada, etc.) sin pasar `io` como parámetro
 * por todas las capas.
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado. Llama a initSocket(server) primero.');
  }
  return io;
}

export default { initSocket, getIO };
