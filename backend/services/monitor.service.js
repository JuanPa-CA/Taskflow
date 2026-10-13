import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

/**
 * Estado de los 4 servicios de la arquitectura para GET /api/monitor.
 *
 * Nunca lanza: cada chequeo está protegido para que una caída de Redis o
 * Mongo no convierta el endpoint en un 500. El contrato de respuesta usa
 * EXACTAMENTE los nombres que espera el frontend (express, mongodb, redis,
 * worker, cada uno con { status, ok }).
 */
const TIMEOUT_REDIS_MS = 1500;

async function redisResponde(timeoutMs = TIMEOUT_REDIS_MS) {
  try {
    const resultado = await Promise.race([
      redisClient.ping().then(() => 'PONG').catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return resultado === 'PONG';
  } catch {
    return false;
  }
}

export async function obtenerEstadoServicios() {
  // Express responde por definición: si este handler corre, el backend está vivo.
  const express = { status: 'Conectado', ok: true };

  const mongoConectado = mongoose.connection.readyState === 1;
  const mongodb = {
    status: mongoConectado ? 'Conectado' : 'Desconectado',
    ok: mongoConectado,
  };

  const redisConectado = await redisResponde();
  const redis = {
    status: redisConectado ? 'Conectado' : 'Desconectado',
    ok: redisConectado,
  };

  // El Worker escribe/refresca esta clave cada 5 s. Si Redis está caído no
  // podemos consultarla, así que el worker se reporta como desconectado.
  let workerConectado = false;
  if (redisConectado) {
    try {
      const existe = await redisClient.exists(env.REDIS_WORKER_HEARTBEAT_KEY);
      workerConectado = existe === 1;
    } catch {
      workerConectado = false;
    }
  }
  const worker = {
    status: workerConectado ? 'Conectado' : 'Desconectado',
    ok: workerConectado,
  };

  return {
    servicios: { express, mongodb, redis, worker },
    generadoEn: new Date().toISOString(),
  };
}

export default { obtenerEstadoServicios };
