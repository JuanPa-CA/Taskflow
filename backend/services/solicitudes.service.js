import { Solicitud } from '../models/Solicitud.js';
import { ESTADOS } from '../config/constants.js';
import { getIO } from '../config/socket.js';
import { EVENTOS_SOCKET } from '../config/constants.js';
import { encolarSolicitud, longitudCola, desencolarSolicitud } from './queue.service.js';
import { getOrSetCache, invalidateCacheByPattern, invalidateCache } from './cache.service.js';
import { env } from '../config/env.js';

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Crea una solicitud, la persiste, la encola en Redis y emite los eventos
 * de Socket.IO correspondientes. Esto cubre HU-01 + HU-04 en un solo flujo,
 * tal como lo describe la arquitectura (sección 12.1).
 *
 * El backend NUNCA cambia el estado a PROCESANDO/RESPONDIDA/ERROR:
 * eso es responsabilidad exclusiva del Worker.
 */
export async function crearSolicitud({ titulo, descripcion, categoria, prioridad, solicitante, canal }) {
  const io = getIO();

  // 1. Guardar en MongoDB con estado inicial PENDIENTE.
  const solicitud = await Solicitud.create({
    titulo,
    descripcion,
    categoria,
    prioridad,
    estado: ESTADOS.PENDIENTE,
    solicitante,
    canal,
    historialEstados: [{
      estado: ESTADOS.PENDIENTE,
      detalle: 'Solicitud radicada en el sistema',
      origen: 'backend',
    }],
  });

  io.emit(EVENTOS_SOCKET.SOLICITUD_CREADA, solicitud.toJSON());

  // Guardar EN COLA antes de publicar el id, para que el Worker no pueda
  // adelantar este guardado y dejar un estado final obsoleto.
  solicitud.estado = ESTADOS.EN_COLA;
  solicitud.fechaEncolado = new Date();
  solicitud.historialEstados.push({
    estado: ESTADOS.EN_COLA,
    detalle: 'Encolada en Redis para el Worker',
    origen: 'backend',
  });
  await solicitud.save();

  let longitud;
  try {
    longitud = await encolarSolicitud(solicitud.id);
  } catch (error) {
    solicitud.estado = ESTADOS.PENDIENTE;
    solicitud.fechaEncolado = null;
    solicitud.historialEstados.pop();
    await solicitud.save();
    throw error;
  }

  io.emit(EVENTOS_SOCKET.SOLICITUD_ENCOLADA, solicitud.toJSON());

  // 3. Invalidar caché de listado/estadísticas: ya no reflejan la realidad.
  await invalidateCache(env.CACHE_KEY_ESTADISTICAS);
  await invalidateCacheByPattern(`${env.CACHE_KEY_SOLICITUDES_LISTADO}*`);

  const enCola = await longitudCola();
  io.emit(EVENTOS_SOCKET.COLA_ACTUALIZADA, { enCola });

  const solicitudActual = await Solicitud.findById(solicitud.id);
  if (!solicitudActual) throw new Error(`No fue posible recuperar la solicitud ${solicitud.id}`);
  return { solicitud: solicitudActual, cola: { encolada: true, longitud } };
}

/**
 * Listado con filtros simples (estado, categoria) + búsqueda por título,
 * y paginación básica. Pensado para /solicitudes (HU-02).
 */
export async function listarSolicitudes({
  estado,
  categoria,
  prioridad,
  buscar,
  page = 1,
  limit = 20,
} = {}) {
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (categoria) filtro.categoria = categoria;
  if (prioridad) filtro.prioridad = prioridad;
  if (buscar) filtro.titulo = { $regex: escaparRegex(buscar.trim()), $options: 'i' };

  const pagina = Math.max(Number(page) || 1, 1);
  const limite = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const clave = `${env.CACHE_KEY_SOLICITUDES_LISTADO}:${encodeURIComponent(JSON.stringify({
    filtro,
    page: pagina,
    limit: limite,
  }))}`;

  return getOrSetCache(clave, async () => {
    const [items, total] = await Promise.all([
      Solicitud.find(filtro).sort({ fechaCreacion: -1 }).skip((pagina - 1) * limite).limit(limite),
      Solicitud.countDocuments(filtro),
    ]);

    return {
      items,
      total,
      page: pagina,
      limit: limite,
      totalPages: Math.ceil(total / limite) || 1,
    };
  });
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

export async function eliminarSolicitud(id) {
  const solicitud = await obtenerSolicitudPorId(id);
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada');
    error.status = 404;
    throw error;
  }
  await desencolarSolicitud(id);
  await Solicitud.deleteOne({ _id: id });
  await invalidateCache(env.CACHE_KEY_ESTADISTICAS);
  await invalidateCacheByPattern(`${env.CACHE_KEY_SOLICITUDES_LISTADO}*`);
  return solicitud;
}

export default {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitudPorId,
  obtenerRespuesta,
  eliminarSolicitud,
};
