import { Solicitud } from '../models/Solicitud.js';
import { ESTADOS } from '../config/constants.js';
import { getIO } from '../config/socket.js';
import { EVENTOS_SOCKET } from '../config/constants.js';
import { encolarSolicitud, longitudCola } from './queue.service.js';
import { invalidateCacheByPattern, invalidateCache } from './cache.service.js';
import { env } from '../config/env.js';

/**
 * Crea una solicitud, la persiste, la encola en Redis y emite los eventos
 * de Socket.IO correspondientes. Esto cubre HU-01 + HU-04 en un solo flujo,
 * tal como lo describe la arquitectura (sección 12.1).
 *
 * El backend NUNCA cambia el estado a PROCESANDO/RESPONDIDA/ERROR:
 * eso es responsabilidad exclusiva del Worker.
 */
export async function crearSolicitud({ titulo, descripcion, categoria, prioridad }) {
  const io = getIO();

  // 1. Guardar en MongoDB con estado inicial PENDIENTE.
  const solicitud = await Solicitud.create({
    titulo,
    descripcion,
    categoria,
    prioridad,
    estado: ESTADOS.PENDIENTE,
  });

  io.emit(EVENTOS_SOCKET.SOLICITUD_CREADA, solicitud.toJSON());

  // 2. Encolar en Redis y reflejar el cambio de estado en Mongo.
  await encolarSolicitud(solicitud.id);
  solicitud.estado = ESTADOS.EN_COLA;
  await solicitud.save();

  io.emit(EVENTOS_SOCKET.SOLICITUD_ENCOLADA, solicitud.toJSON());

  // 3. Invalidar caché de listado/estadísticas: ya no reflejan la realidad.
  await invalidateCache(env.CACHE_KEY_ESTADISTICAS);
  await invalidateCacheByPattern(`${env.CACHE_KEY_SOLICITUDES_LISTADO}*`);

  const enCola = await longitudCola();
  io.emit(EVENTOS_SOCKET.COLA_ACTUALIZADA, { enCola });

  return solicitud;
}

/**
 * Listado con filtros simples (estado, categoria) + búsqueda por título,
 * y paginación básica. Pensado para /solicitudes (HU-02).
 */
export async function listarSolicitudes({ estado, categoria, buscar, page = 1, limit = 20 } = {}) {
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (categoria) filtro.categoria = categoria;
  if (buscar) filtro.titulo = { $regex: buscar, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Solicitud.find(filtro).sort({ fechaCreacion: -1 }).skip(skip).limit(Number(limit)),
    Solicitud.countDocuments(filtro),
  ]);

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
}

/**
 * Consulta por id (HU-03). Devuelve null si no existe;
 * el controller decide cómo traducir eso a un 404.
 */
export async function obtenerSolicitudPorId(id) {
  return Solicitud.findById(id);
}

/**
 * Devuelve solo el bloque de "respuesta" de una solicitud,
 * para el endpoint GET /solicitudes/:id/respuesta.
 */
export async function obtenerRespuesta(id) {
  const solicitud = await Solicitud.findById(id).select(
    'estado respuesta mensajeError fechaProcesamiento'
  );
  return solicitud;
}

export default {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitudPorId,
  obtenerRespuesta,
};
