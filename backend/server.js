import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { redisClient } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { initPubSub, closePubSub } from './config/pubsub.js';

/**
 * Punto de arranque real del API:
 * 1. Conecta MongoDB.
 * 2. Verifica que Redis responda.
 * 3. Crea el servidor HTTP e inicializa Socket.IO sobre él
 *    (necesario porque Socket.IO necesita el http.Server, no solo `app`).
 * 4. Empieza a escuchar.
 */
async function start() {
  await connectDB();
  await redisClient.ping();

  const httpServer = http.createServer(app);
  initSocket(httpServer);
  initPubSub(); // escucha los eventos que publique el Worker y los retransmite por Socket.IO

  httpServer.listen(env.PORT, () => {
    console.log(`[server] TaskFlow backend escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] Señal ${signal} recibida, cerrando de forma ordenada...`);
    httpServer.close(() => console.log('[server] HTTP cerrado'));
    await closePubSub();
    await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('[server] Error fatal al arrancar:', error);
  process.exit(1);
});
