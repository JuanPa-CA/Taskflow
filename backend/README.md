# TASKFLOW Backend

API REST con Express, MongoDB y Redis. El backend valida y persiste solicitudes,
las encola y retransmite por Socket.IO los cambios publicados por el Worker.
El procesamiento de solicitudes ocurre exclusivamente en `worker/`.

## Estructura

El backend sigue la estructura plana descrita por la arquitectura del taller:

- `config/`: variables de entorno, MongoDB, Redis, Socket.IO y Pub/Sub.
- `controllers/` y `routes/`: endpoints montados bajo `/api`.
- `models/`: esquema MongoDB de solicitudes.
- `services/`: solicitudes, cola, caché, estadísticas y monitor.
- `middlewares/`: validación, rate limit y errores.
- `scripts/` y `tests/`: pruebas de integración Socket.IO y pruebas unitarias.

## Ejecución

Desde la raíz del repositorio, iniciar todos los servicios:

```powershell
docker compose up --build -d
```

La interfaz queda disponible en `http://localhost`, la API en
`http://localhost:3000/api` y el estado en `http://localhost:3000/api/monitor`.
Compose comparte `REDIS_QUEUE_KEY=taskflow:queue:solicitudes` y
`REDIS_EVENTS_CHANNEL=taskflow:eventos` entre el backend y el Worker.

Para ejecutar el backend fuera de Docker, copiar `backend/.env.example` a
`backend/.env`, usar `localhost` para MongoDB y Redis e iniciar:

```powershell
cd backend
npm install
npm run dev
```

El Worker local usa `worker/.env.example` y se ejecuta en otra terminal:

```powershell
cd worker
npm install
npm run dev
```

## Pruebas

```powershell
cd backend
npm test
npm run test:socket
```

La prueba Socket.IO requiere API, MongoDB, Redis y Worker activos. Registra una
solicitud temporal, verifica los cuatro eventos de su ciclo y elimina el
registro al finalizar. `TASKFLOW_API_URL` permite especificar el origen de la
API (sin `/api`) y `SOCKET_TEST_TIMEOUT_MS` ajusta el timeout.

## Seguridad de errores

Los detalles técnicos de fallos de procesamiento se guardan únicamente en los
logs del Worker. La API, los eventos y las vistas devuelven un mensaje genérico
para solicitudes en estado `ERROR`; los historiales antiguos también se
sanitizan al serializar el modelo.
