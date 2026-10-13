import { CATEGORIAS } from '../config/constants.js';

/**
 * Reglas de respuesta por categoría (HU-06 / punto 7 del taller).
 *
 * Se implementan como un MAPA categoría → función generadora (y NO como un
 * if/else gigante) para que sea trivial extenderlo: basta agregar una entrada
 * nueva al objeto REGLAS.
 *
 * Contrato:
 *  - Las 5 categorías válidas tienen respuesta específica.
 *  - Cualquier categoría que NO coincida → respuesta genérica (recibida y
 *    será atendida por un agente).
 *  - Una categoría vacía/nula (documento corrupto) lanza excepción para que
 *    el flujo principal la marque como ERROR.
 */

const respuestaInformacion = ({ titulo = 'su solicitud' } = {}) =>
  `Hemos recibido su solicitud "${titulo}". Le informamos que nuestro horario de atención es de lunes a viernes de 8:00 a.m. a 5:00 p.m. Puede consultar información general del servicio en nuestro portal o acercarse a cualquiera de nuestros puntos de atención.`;

const respuestaSoporte = ({ titulo = 'su solicitud' } = {}) =>
  `Hemos recibido su solicitud de soporte "${titulo}". Como primer paso, verifique su conexión, reinicie el dispositivo y confirme que sus datos estén actualizados. Si el inconveniente persiste, contacte a nuestro equipo por el canal telefónico o escriba a soporte@taskflow.local indicando el número de esta solicitud.`;

const respuestaDocumento = ({ titulo = 'su solicitud' } = {}) =>
  `Para gestionar el documento solicitado en "${titulo}", debe radicar los siguientes requisitos: documento de identidad vigente, formulario de solicitud diligenciado y, de ser necesario, el soporte que acredite la petición. El trámite se procesará en un plazo de 3 a 5 días hábiles una vez validada la documentación completa.`;

const respuestaConsulta = ({ titulo = 'su solicitud' } = {}) =>
  `Con respecto a su consulta "${titulo}", le informamos que su trámite se encuentra registrado y disponible para seguimiento. Puede verificar el avance en cualquier momento desde la plataforma o solicitar una actualización del estado a través de este mismo medio.`;

const respuestaActualizacion = ({ titulo = 'su solicitud' } = {}) =>
  `Para actualizar sus datos según lo indicado en "${titulo}", ingrese a su perfil, seleccione la opción "Actualizar información" y adjunte los documentos que soporten el cambio. Los datos quedarán actualizados una vez el área encargada valide la información, en un plazo de 1 a 2 días hábiles.`;

const respuestaGenerica = ({ titulo = 'su solicitud' } = {}) =>
  `Su solicitud "${titulo}" fue recibida correctamente y será atendida por un agente de nuestro equipo a la mayor brevedad posible. Gracias por su paciencia.`;

// Mapa categoría → función generadora de respuesta.
const REGLAS = {
  [CATEGORIAS.INFORMACION]: respuestaInformacion,
  [CATEGORIAS.SOPORTE]: respuestaSoporte,
  [CATEGORIAS.DOCUMENTO]: respuestaDocumento,
  [CATEGORIAS.CONSULTA]: respuestaConsulta,
  [CATEGORIAS.ACTUALIZACION]: respuestaActualizacion,
};

/**
 * Genera la respuesta para una solicitud según su categoría.
 * @throws {Error} si la categoría está vacía/nula (documento corrupto).
 */
export function generarRespuesta(solicitud) {
  const categoria = solicitud?.categoria;

  if (!categoria || typeof categoria !== 'string' || !categoria.trim()) {
    throw new Error('La solicitud tiene una categoría vacía o corrupta');
  }

  const generador = REGLAS[categoria.trim()] || respuestaGenerica;
  return generador(solicitud);
}

export default { generarRespuesta, REGLAS };
