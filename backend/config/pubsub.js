import Redis from 'ioredis';
import { env } from './env.js';
import { getIO } from './socket.js';
import { EVENTOS_SOCKET } from './constants.js';

/**
 * El Worker corre en un proceso/contenedor aparte y NO tiene Socket.IO
 * (regla de arquitectura: "el Worker no necesita una conexión directa con
 * el navegador"). Para que el frontend se entere en tiempo real de que una
 * solicitud pasó a PROCESANDO/RESPONDIDA/ERROR, el Worker publica un mensaje
 * en este canal de Redis y el backend lo retransmite por Socket.IO.
 *
 * Contrato del mensaje (JSON, publicado por el Worker):
 *   { "evento": "solicitud-procesando", "data": { ...solicitud } }
 *
 * "evento" debe ser uno de los valores de EVENTOS_SOCKET (config/constants.js)
 * para que el frontend reciba exactamente los nombres de evento documentados
 * en la arquitectura (sección 21.3).
 *
 * Nota técnica de ioredis: un cliente en modo `subscribe` no puede ejecutar
 * otros comandos, por eso se usa una conexión DEDICADA (duplicate()) solo
 * para esto, separada del cliente que usan cache.service/queue.service.
 */
let subscriber = null;

export function initPubSub() {
  subscriber = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  });

  subscriber.subscribe(env.REDIS_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error('[pubsub] no se pudo suscribir al canal:', err.message);
      return;
    }
    console.log('[pubsub] suscrito a', env.REDIS_EVENTS_CHANNEL, '(eventos del Worker)');
  });

  subscriber.on('message', (_channel, rawMessage) => {
    let mensaje;
    try {
      mensaje = JSON.parse(rawMessage);
    } catch {
      console.error('[pubsub] mensaje no es JSON válido, se ignora:', rawMessage);
      return;
    }

    const { evento, data } = mensaje;
    const eventosValidos = Object.values(EVENTOS_SOCKET);

    if (!evento || !eventosValidos.includes(evento)) {
      console.error('[pubsub] evento desconocido, se ignora:', evento);
      return;
    }

    getIO().emit(evento, data);
  });

  subscriber.on('error', (err) => {
    console.error('[pubsub] error de conexión:', err.message);
  });

  return subscriber;
}

export async function closePubSub() {
  if (subscriber) {
    await subscriber.quit();
  }
}

export default { initPubSub, closePubSub };
