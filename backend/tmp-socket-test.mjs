/**
 * Prueba temporal de tiempo real (se elimina después):
 * 1. Se conecta como cliente Socket.IO (igual que el frontend Vue).
 * 2. Registra los 7 eventos del contrato.
 * 3. Hace un POST /solicitudes -> espera solicitud-creada / solicitud-encolada.
 * 4. Escribe el heartbeat del Worker y simula la publicación del Worker
 *    en el canal Redis `taskflow:eventos` -> espera solicitud-respondida.
 */
import { io } from 'socket.io-client'
import Redis from 'ioredis'

const recibidos = []
const socket = io('http://localhost:3000', { transports: ['websocket'] })
const eventos = [
  'solicitud-creada',
  'solicitud-encolada',
  'solicitud-procesando',
  'solicitud-respondida',
  'solicitud-error',
  'monitor-actualizado',
  'cola-actualizada'
]

socket.on('connect', async () => {
  console.log('CONECTADO socket.io id =', socket.id)
  eventos.forEach((evento) =>
    socket.on(evento, (data) => {
      recibidos.push(evento)
      console.log(' EVENTO ->', evento, '|', JSON.stringify(data).slice(0, 120))
    })
  )

  const respuesta = await fetch('http://localhost:3000/solicitudes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Solicitud de prueba socket',
      descripcion: 'Verificacion de eventos en tiempo real desde el script',
      categoria: 'Consulta',
      prioridad: 'Baja'
    })
  })
  console.log('POST /solicitudes status =', respuesta.status)
})

setTimeout(async () => {
  const redis = new Redis({ host: '127.0.0.1', port: 6379 })
  // Simula el latido del Worker y un evento suyo vía Pub/Sub.
  await redis.set('taskflow:worker:heartbeat', JSON.stringify({ estado: 'Activo', fecha: new Date().toISOString(), detalle: 'latido simulado' }), 'EX', 30)
  await redis.publish('taskflow:eventos', JSON.stringify({ evento: 'solicitud-respondida', data: { id: 'demo-socket', respuesta: 'Respuesta simulada del Worker', estado: 'RESPONDIDA' } }))
  await redis.quit()
  const monitor = await (await fetch('http://localhost:3000/monitor')).json()
  console.log('WORKER ->', JSON.stringify(monitor.servicios.worker))
  console.log('COLA ->', JSON.stringify(monitor.cola))
}, 3000)

setTimeout(() => {
  console.log('RESUMEN EVENTOS RECIBIDOS:', [...new Set(recibidos)].join(', '))
  socket.close()
  process.exit(0)
}, 6500)
