import { Solicitud } from '../models/Solicitud.js';
import { ESTADOS } from '../config/constants.js';
import { getOrSetCache } from './cache.service.js';
import { longitudCola } from './queue.service.js';
import { env } from '../config/env.js';

/**
 * Indicadores para el Dashboard/Monitor (HU-09), servidos con cache-aside
 * (HU-08): la primera consulta calcula contra Mongo + Redis y cachea;
 * las siguientes, dentro del TTL, se resuelven desde Redis (CACHE HIT).
 */
async function calcularEstadisticas() {
  const [total, pendientes, enCola, procesando, respondidas, errores, enColaRedis] =
    await Promise.all([
      Solicitud.countDocuments({}),
      Solicitud.countDocuments({ estado: ESTADOS.PENDIENTE }),
      Solicitud.countDocuments({ estado: ESTADOS.EN_COLA }),
      Solicitud.countDocuments({ estado: ESTADOS.PROCESANDO }),
      Solicitud.countDocuments({ estado: ESTADOS.RESPONDIDA }),
      Solicitud.countDocuments({ estado: ESTADOS.ERROR }),
      longitudCola(),
    ]);

  return {
    total,
    pendientes,
    enCola,
    procesando,
    respondidas,
    errores,
    colaRedis: enColaRedis, // longitud real de la lista en Redis, para el Monitor
    generadoEn: new Date().toISOString(),
  };
}

export async function obtenerEstadisticas() {
  return getOrSetCache(env.CACHE_KEY_ESTADISTICAS, calcularEstadisticas);
}

export default { obtenerEstadisticas };
