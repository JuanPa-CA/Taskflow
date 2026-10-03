import Redis from 'ioredis';
import { env } from './env.js';
import { getIO } from './socket.js';
import { EVENTOS_SOCKET } from './constants.js';
import { obtenerMonitor } from '../services/monitor.service.js';

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

  subscriber.on('message', async (_channel, rawMessage) => {
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

    const io = getIO();
    io.emit(evento, data);
    if ([
      EVENTOS_SOCKET.SOLICITUD_PROCESANDO,
      EVENTOS_SOCKET.SOLICITUD_RESPONDIDA,
      EVENTOS_SOCKET.SOLICITUD_ERROR,
    ].includes(evento)) {
      try {
        const monitor = await obtenerMonitor();
        io.emit(EVENTOS_SOCKET.MONITOR_ACTUALIZADO, monitor);
        io.emit(EVENTOS_SOCKET.COLA_ACTUALIZADA, {
          servicios: monitor.servicios,
          metricas: monitor.metricas,
          cola: monitor.cola,
        });
      } catch (error) {
        console.error('[pubsub] no se pudo actualizar el monitor:', error.message);
      }
    }
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
