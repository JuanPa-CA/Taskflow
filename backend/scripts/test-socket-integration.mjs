import { io } from 'socket.io-client'

const apiOrigin = (process.env.TASKFLOW_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const apiUrl = `${apiOrigin}/api`
const timeoutMs = Number(process.env.SOCKET_TEST_TIMEOUT_MS || 15_000)
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error('SOCKET_TEST_TIMEOUT_MS debe ser un número positivo')
}

const title = `Prueba Socket.IO ${Date.now()}`
const events = [
  'solicitud-creada',
  'solicitud-encolada',
  'solicitud-procesando',
  'solicitud-respondida'
]
const received = []
const socket = io(apiOrigin, { autoConnect: false, reconnection: false, timeout: 5000 })

let solicitudId

const requestJson = async (path, options) => {
  const response = await fetch(`${apiUrl}${path}`, options)
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`${options?.method || 'GET'} ${path} respondió HTTP ${response.status}: ${body.mensaje || 'error'}`)
  }
  return body
}

const idDelEvento = (data) =>
  data?.id || data?.solicitudId || data?.solicitud?.id || data?.solicitud?._id

const esperar = async (condicion, descripcion, detalle = () => '') => {
  const limite = Date.now() + timeoutMs
  while (!condicion()) {
    if (Date.now() >= limite) {
      const diagnostico = detalle()
      throw new Error(`Timeout esperando ${descripcion}${diagnostico ? ` (recibidos: ${diagnostico})` : ''}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

const ejecutar = async () => {
  const monitor = await requestJson('/monitor')
  if (!monitor.servicios?.worker?.ok) {
    throw new Error('El Worker no está activo; inicia el Worker antes de ejecutar esta prueba')
  }

  for (const evento of events) {
    socket.on(evento, (data) => received.push({ evento, data }))
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout conectando con Socket.IO')), 5000)
    socket.once('connect', () => {
      clearTimeout(timer)
      resolve()
    })
    socket.once('connect_error', (error) => {
      clearTimeout(timer)
      reject(new Error(`No fue posible conectar con Socket.IO: ${error.message}`))
    })
    socket.connect()
  })

  const creada = await requestJson('/solicitudes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: title,
      descripcion: 'Prueba de integración Socket.IO con el Worker real.',
      categoria: 'Consulta',
      prioridad: 'Baja',
      canal: 'api'
    })
  })

  solicitudId = creada.solicitud?.id || creada.data?.id
  if (!solicitudId || !creada.enCola) {
    throw new Error('La API no confirmó que la solicitud temporal ingresó a la cola')
  }

  const eventosSolicitud = () =>
    received.filter(({ data }) => String(idDelEvento(data)) === String(solicitudId))
  const cicloCompleto = () => {
    const recibidos = new Set(eventosSolicitud().map(({ evento }) => evento))
    return events.every((evento) => recibidos.has(evento))
  }
  await esperar(
    cicloCompleto,
    `eventos ${events.join(', ')} para ${solicitudId}`,
    () => eventosSolicitud().map(({ evento }) => evento).join(' → ') || 'ninguno'
  )

  const detalle = await requestJson(`/solicitudes/${solicitudId}`)
  const solicitudFinal = detalle.solicitud || detalle.data
  if (solicitudFinal?.estado !== 'RESPONDIDA' || !solicitudFinal.respuesta) {
    throw new Error(`La solicitud no terminó respondida: ${solicitudFinal?.estado || 'sin estado'}`)
  }

  console.log(JSON.stringify({
    ok: true,
    solicitudId,
    estadoFinal: solicitudFinal.estado,
    eventos: eventosSolicitud().map(({ evento }) => evento)
  }, null, 2))
}

try {
  await ejecutar()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  if (solicitudId) {
    try {
      await requestJson(`/solicitudes/${solicitudId}`, { method: 'DELETE' })
    } catch (error) {
      console.error(`No fue posible eliminar la solicitud temporal ${solicitudId}: ${error.message}`)
      process.exitCode = 1
    }
  }
  socket.disconnect()
}
