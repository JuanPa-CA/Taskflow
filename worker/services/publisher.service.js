import { publisherClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { EVENTOS_VALIDOS } from '../config/constants.js';

/**
 * Envuelve el PUBLISH a Redis Pub/Sub.
 *
 * El Worker no tiene Socket.IO; para avisar cambios de estado en tiempo real
 * publica en REDIS_EVENTS_CHANNEL un mensaje JSON con esta forma exacta:
 *   { "evento": "solicitud-procesando", "data": { ...solicitud } }
 *
 * El backend ya tiene un subscriber en ese canal que retransmite por Socket.IO
 * al frontend (backend/config/pubsub.js); aquí solo nos encargamos de publicar.
 */
export async function publicarEvento(evento, data) {
  if (!EVENTOS_VALIDOS.includes(evento)) {
    throw new Error(`Evento desconocido, no se publica: ${evento}`);
  }

  const mensaje = JSON.stringify({ evento, data });
  await publisherClient.publish(env.REDIS_EVENTS_CHANNEL, mensaje);
}

export default { publicarEvento };
