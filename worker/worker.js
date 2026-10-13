import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { redisClient, publisherClient, esperarRedis } from './config/redis.js';
import { Solicitud } from './models/Solicitud.js';
import { generarRespuesta } from './services/reglas.service.js';
import { publicarEvento } from './services/publisher.service.js';
import { ESTADOS, EVENTOS } from './config/constants.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let running = true;

/**
 * Simula que el procesamiento toma un momento (1-3 segundos) para que en la
 * demo se note el paso de EN COLA → PROCESANDO → RESPONDIDA en el frontend.
 * Es pedagógico, no pretende ser un trabajo real.
 */
async function simularTrabajo() {
  const segundos = 1 + Math.floor(Math.random() * 3);
  console.log(`[worker] simulando trabajo de ${segundos}s...`);
  await sleep(segundos * 1000);
}

/**
 * Procesa una única solicitud (un id sacado de la cola).
 * Nunca lanza: cualquier error se convierte en estado ERROR y se publica,
 * de modo que una solicitud fallida jamás detiene el loop ni a las demás.
 */
async function procesarSolicitud(id) {
  // 1. Buscar en MongoDB. Si no existe (o Mongo falla), loguear y continuar.
  let solicitud;
  try {
    solicitud = await Solicitud.findById(id);
  } catch (err) {
    console.error(`[worker] no se pudo leer la solicitud ${id} de Mongo: ${err.message}`);
    return;
  }

  if (!solicitud) {
    console.warn(`[worker] la solicitud ${id} no existe en Mongo; se ignora`);
    return;
  }

  // Publicar sin que un fallo de Redis afecte el estado de la solicitud.
  const publicar = async (evento, documento) => {
    try {
      await publicarEvento(evento, documento);
    } catch (err) {
      console.warn(`[worker] no se pudo publicar "${evento}" de ${id}: ${err.message}`);
    }
  };

  try {
    // 2. Marcar PROCESANDO, guardar y publicar.
    solicitud.estado = ESTADOS.PROCESANDO;
    await solicitud.save();
    console.log(`[worker] procesando ${id} (${solicitud.categoria})`);
    await publicar(EVENTOS.SOLICITUD_PROCESANDO, solicitud.toJSON());

    // 3. Regla de negocio por categoría (con demora simulada).
    await simularTrabajo();
    const respuesta = generarRespuesta(solicitud);

    // 4. Éxito → guardar respuesta + estado RESPONDIDA y publicar.
    solicitud.respuesta = respuesta;
    solicitud.fechaProcesamiento = new Date();
    solicitud.estado = ESTADOS.RESPONDIDA;
    solicitud.mensajeError = null;
    await solicitud.save();
    console.log(`[worker] respondida ${id}`);
    await publicar(EVENTOS.SOLICITUD_RESPONDIDA, solicitud.toJSON());
  } catch (err) {
    // 5. Error → estado ERROR con mensaje claro (sin detalles técnicos sensibles).
    console.error(`[worker] error en ${id}: ${err.message}`);
    try {
      solicitud.estado = ESTADOS.ERROR;
      solicitud.mensajeError =
        'No fue posible procesar la solicitud. Inténtalo nuevamente o contacta a soporte.';
      solicitud.fechaProcesamiento = new Date();
      await solicitud.save();
      await publicar(EVENTOS.SOLICITUD_ERROR, solicitud.toJSON());
    } catch (errGuardado) {
      console.error(`[worker] no se pudo guardar/publicar el estado ERROR de ${id}: ${errGuardado.message}`);
    }
  }
}

/**
 * 6. Tras consumir cada solicitud, publica "cola-actualizada" con la longitud
 * actual de la lista de Redis (LLEN) para refrescar el Dashboard/Monitor.
 */
async function publicarColaActualizada() {
  try {
    const enCola = await redisClient.llen(env.REDIS_QUEUE_KEY);
    await publicarEvento(EVENTOS.COLA_ACTUALIZADA, { enCola });
  } catch (err) {
    console.warn(`[worker] no se pudo publicar la longitud de la cola: ${err.message}`);
  }
}

/**
 * Loop principal: BRPOP bloqueante (sin polling) sobre REDIS_QUEUE_KEY.
 */
async function iniciarLoop() {
  console.log(`[worker] escuchando la cola "${env.REDIS_QUEUE_KEY}" (BRPOP bloqueante)`);

  while (running) {
    let id;
    try {
      const resultado = await redisClient.brpop(env.REDIS_QUEUE_KEY, 0);
      if (!resultado) continue;
      [, id] = resultado; // BRPOP devuelve [key, valor]
    } catch (err) {
      if (!running) break; // cierre ordenado: el disconnect() interrumpe el BRPOP
      console.error(`[worker] error en BRPOP (reintentando en 2s): ${err.message}`);
      await sleep(2000);
      continue;
    }

    console.log(`[worker] recibí ${id} de la cola`);
    await procesarSolicitud(id);
    await publicarColaActualizada();
  }

  console.log('[worker] loop de consumo finalizado');
}

function shutdown(signal) {
  if (!running) return;
  console.log(`[worker] señal ${signal} recibida, cerrando de forma ordenada...`);
  running = false;
  // disconnect() interrumpe el BRPOP pendiente para que el loop termine ya.
  redisClient.disconnect();
  publisherClient.disconnect();
}

async function main() {
  await connectDB();
  await esperarRedis(redisClient, 'cola');
  await esperarRedis(publisherClient, 'publicador');

  console.log('[worker] TaskFlow Worker iniciado correctamente');
  await iniciarLoop();

  await disconnectDB();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[worker] error fatal:', err);
    process.exit(1);
  });
