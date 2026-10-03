import mongoose from 'mongoose';
import { Solicitud } from '../models/Solicitud.js';
import { ESTADOS } from '../config/constants.js';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { longitudCola } from './queue.service.js';

export async function obtenerMonitor() {
  let redisOk = false;
  let enColaRedis = null;
  let heartbeat = null;

  try {
    await redisClient.ping();
    [enColaRedis, heartbeat] = await Promise.all([
      longitudCola(),
      redisClient.get(env.REDIS_HEARTBEAT_KEY),
    ]);
    redisOk = true;
  } catch (error) {
    console.error('[monitor] no fue posible consultar Redis:', error.message);
  }

  let latido = null;
  if (heartbeat) {
    try {
      latido = JSON.parse(heartbeat);
    } catch (error) {
      console.error('[monitor] heartbeat del Worker inválido:', error.message);
    }
  }

  const [
    total,
    pendientes,
    enColaDocumentos,
    procesando,
    respondidas,
    errores,
  ] = await Promise.all([
    Solicitud.countDocuments({}),
    Solicitud.countDocuments({ estado: ESTADOS.PENDIENTE }),
    Solicitud.countDocuments({ estado: ESTADOS.EN_COLA }),
    Solicitud.countDocuments({ estado: ESTADOS.PROCESANDO }),
    Solicitud.countDocuments({ estado: ESTADOS.RESPONDIDA }),
    Solicitud.countDocuments({ estado: ESTADOS.ERROR }),
  ]);

  const mongodbOk = mongoose.connection.readyState === 1;
  const workerOk = Boolean(latido?.fecha && Date.now() - Date.parse(latido.fecha) < env.HEARTBEAT_TTL_SECONDS * 1000);
  const servicios = {
    express: { status: 'Conectado', ok: true },
    mongodb: {
      status: mongodbOk ? 'Conectado' : 'Desconectado',
      ok: mongodbOk,
      baseDatos: mongoose.connection.name || null,
    },
    redis: {
      status: redisOk ? 'Conectado' : 'Desconectado',
      ok: redisOk,
      cola: enColaRedis,
    },
    worker: {
      status: workerOk ? 'Activo' : 'Desconectado',
      ok: workerOk,
      ultimoLatido: latido?.fecha || null,
      detalle: workerOk ? latido.detalle || null : 'Sin latido reciente',
    },
  };
  const metricas = {
    total,
    pendientes,
    enCola: enColaRedis ?? enColaDocumentos,
    enColaDocumentos,
    procesando,
    respondidas,
    errores,
  };

  return {
    ok: mongodbOk && redisOk,
    servicios,
    metricas,
    cola: {
      nombre: env.REDIS_QUEUE_KEY,
      longitud: enColaRedis,
      disponibles: enColaRedis !== null,
      consumidor: workerOk ? 'Activo' : 'Detenido',
    },
    timestamp: new Date().toISOString(),
  };
}

export default { obtenerMonitor };
