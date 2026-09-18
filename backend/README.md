# TASKFLOW — Backend API (Node.js + Express)

Servicio **backend** del sistema TASKFLOW. Recibe, valida, persiste y **encola** solicitudes;
**no las procesa** (de eso se encarga el Worker, que es un servicio aparte).

| Responsabilidad | Implementación |
|---|---|
| API REST | Express (`routes` + `controllers`) |
| Persistencia | MongoDB + Mongoose (`models`) |
| Caché cache-aside | Redis + ioredis (`services/cache.service.js`, `middlewares/cache.middleware.js`) |
| Cola FIFO de pendientes | Redis lista nativa (`services/cola.service.js`: `RPUSH`; el Worker consume con `BLPOP`) |
| Tiempo real | Socket.IO (`sockets/`) + puente Redis Pub/Sub con el Worker |

---

## 1. Estructura de carpetas y archivos

```text
backend/
├── .env.example                     # Plantilla de variables de entorno (copiar a .env)
├── .gitignore                       # node_modules, .env, logs
├── package.json                     # Dependencias y scripts (start, dev, seed)
├── README.md                        # Este documento
└── src/
    ├── app.js                       # Configura Express (middlewares + rutas + errores), SIN escuchar puerto
    ├── server.js                    # Punto de entrada: HTTP server + Mongo + Redis + Socket.IO + apagado ordenado
    │
    ├── config/                      # Conexiones y variables de entorno (sin lógica de negocio)
    │   ├── env.config.js            # dotenv + tipado centralizado de process.env
    │   ├── mongo.config.js          # conexión Mongoose, ping y estado de la conexión
    │   ├── redis.config.js          # clientes ioredis: caché/cola + suscriptor Pub/Sub
    │   └── socket.config.js         # opciones de Socket.IO (CORS, transportes, timeouts)
    │
    ├── constants/                   # Valores de dominio compartidos con el Worker y el frontend
    │   ├── estados.constants.js     # PENDIENTE | EN COLA | PROCESANDO | RESPONDIDA | ERROR + transiciones
    │   ├── prioridades.constants.js # Alta | Media | Baja (+ pesos)
    │   ├── categorias.constants.js  # Información | Soporte | Documento | Consulta | Actualización
    │   ├── eventos.constants.js     # Nombres de eventos Socket.IO (contrato con Vue)
    │   └── cache.constants.js       # Prefijos y TTL de cada clave de caché
    │
    ├── models/                      # Esquemas Mongoose (una colección por archivo)
    │   ├── solicitud.model.js       # Colección `solicitudes` (entidad central del dominio)
    │   ├── categoria.model.js       # Colección `categorias` (SLA, adjuntos, plantilla de respuesta)
    │   └── contador.model.js        # Contador atómico del código de radicado (TF-2026-00042)
    │
    ├── validators/                  # Reglas de entrada con express-validator
    │   ├── solicitud.validator.js   # crear / listar (filtros) / actualizar / cambiar estado
    │   ├── categoria.validator.js   # crear / actualizar categoría
    │   └── common.validator.js      # ObjectId de Mongo y paginación reutilizables
    │
    ├── middlewares/                 # Funciones transversales a todas las rutas
    │   ├── asyncHandler.js          # Envuelve controladores async y delega errores a next()
    │   ├── validate.middleware.js   # Ejecuta express-validator y responde 400 uniforme
    │   ├── cache.middleware.js      # Cache-aside HTTP en GET: header X-Cache: HIT|MISS (HU-08)
    │   ├── errorHandler.middleware.js # Traduce ApiError/Mongoose a JSON { ok:false, mensaje }
    │   ├── notFound.middleware.js   # 404 + catálogo de endpoints disponibles
    │   └── rateLimit.middleware.js  # Límite global y límite de escritura (POST/PUT/DELETE)
    │
    ├── services/                    # Lógica de negocio y acceso a infraestructura
    │   ├── solicitud.service.js     # Registrar, listar, consultar, actualizar, eliminar + encolado
    │   ├── categoria.service.js     # CRUD del catálogo + sincronización (seed) + caché
    │   ├── cache.service.js         # obtener/guardar/invalidar/recordar (cache-aside) + SCAN por patrón
    │   ├── cola.service.js          # RPUSH a la cola FIFO, longitud, inspección, heartbeat del Worker
    │   ├── indicador.service.js     # Agregaciones del dashboard (KPIs, por categoría, tendencia)
    │   ├── monitor.service.js       # Salud de los 4 servicios + métricas de cola y estados
    │   └── socket.service.js        # Fachada única de emisión de eventos Socket.IO
    │
    ├── controllers/                 # Capa HTTP delgada: lee req, delega en services, responde
    │   ├── solicitud.controller.js
    │   ├── categoria.controller.js
    │   ├── indicador.controller.js
    │   ├── monitor.controller.js
    │   └── cache.controller.js      # Inspección y limpieza del caché Redis
    │
    ├── routes/                      # Declaración de endpoints y middlewares por ruta
    │   ├── index.routes.js          # Router raíz + GET / (mapa de API) + GET /health
    │   ├── solicitud.routes.js
    │   ├── categoria.routes.js
    │   ├── indicador.routes.js
    │   ├── monitor.routes.js
    │   └── cache.routes.js
    │
    ├── sockets/                     # Tiempo real
    │   ├── index.js                 # Crea Socket.IO, salas y eventos emitidos por el cliente
    │   └── pubsub.socket.js         # Suscribe `taskflow:eventos` y retransmite los eventos del Worker
    │
    ├── utils/                       # Utilidades sin estado de dominio
    │   ├── apiError.js              # ApiError (badRequest/notFound/conflict/serviceUnavailable)
    │   ├── logger.js                # Logger por niveles (error/warn/info/debug)
    │   └── codigo.util.js           # Genera el código de radicado consecutivo
    │
    └── scripts/
        └── seed-categorias.js       # `npm run seed`: carga idempotente del catálogo de categorías
```

### Flujo de una petición (registrar solicitud)

```text
POST /solicitudes
   │
   ├─ routes/solicitud.routes.js          rate limit de escritura
   ├─ validators/solicitud.validator.js   reglas de campos
   ├─ middlewares/validate.middleware.js  400 si hay errores
   ├─ controllers/solicitud.controller.js lee req.body
   ├─ services/solicitud.service.js       reglas de negocio
   │     ├─ models/solicitud.model.js     guarda en MongoDB (PENDIENTE + código de radicado)
   │     ├─ services/cola.service.js      RPUSH en Redis -> estado EN COLA
   │     ├─ services/socket.service.js    emite solicitud-creada / solicitud-encolada
   │     └─ services/cache.service.js     invalida taskflow:solicitudes* e indicadores*
   └─ 201 { ok, mensaje, enCola, posicionCola, solicitud }
```

---

## 2. Endpoints (sin prefijo `/api`: el frontend consume la raíz)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Mapa de endpoints del servicio |
| GET | `/health` | Liveness: estado de MongoDB y Redis |
| GET | `/solicitudes` | Filtros `categoria, prioridad, estado, search, page, limit, orden`. Header `X-Cache: HIT\|MISS` |
| POST | `/solicitudes` | Registra y encola (`titulo, categoria, prioridad, descripcion`) |
| GET | `/solicitudes/:id` | Detalle por id |
| GET | `/solicitudes/:id/respuesta` | Respuesta del Worker (`respondida: true/false`) |
| PUT | `/solicitudes/:id` | Actualiza campos editables |
| PATCH | `/solicitudes/:id/estado` | Cambio de estado validado por el ciclo de vida (pruebas/admin) |
| DELETE | `/solicitudes/:id` | Elimina la solicitud |
| GET | `/categorias` | Catálogo cacheado (TTL 300 s) |
| POST / PUT / DELETE | `/categorias[/:id]` | Administración del catálogo (DELETE = baja lógica) |
| GET | `/indicadores` | KPIs del dashboard (cacheado) |
| GET | `/indicadores/por-categoria`, `/por-prioridad`, `/tendencia?dias=7`, `/cola` | Desgloses |
| GET | `/monitor` | `{ servicios: { express, mongodb, redis, worker }, metricas }` |
| GET | `/monitor/salud`, `/monitor/cola` | Healthcheck e inspección de la cola |
| GET/DELETE | `/cache`, `/cache/solicitudes` | Inspección y limpieza del caché |

## 3. Eventos Socket.IO

| Evento | Emisor | Cuándo |
|---|---|---|
| `solicitud-creada` | Backend | La solicitud quedó guardada en MongoDB |
| `solicitud-encolada` | Backend | La solicitud entró a la cola Redis (`EN COLA`) |
| `solicitud-procesando` | Worker (vía Pub/Sub) | El Worker la tomó |
| `solicitud-respondida` | Worker (vía Pub/Sub) | Respuesta guardada |
| `solicitud-error` | Worker (vía Pub/Sub) | Fallo controlado |
| `monitor-actualizado` | Backend | Cambian servicios o métricas |
| `cola-actualizada` | Backend | Cambia la longitud de la cola |

El Worker **no** usa Socket.IO: publica en el canal Redis `taskflow:eventos` con
`{ "evento": "solicitud-respondida", "data": { ... } }` y el backend lo retransmite.

## 4. Ejecución local

```bash
cd backend
copy .env.example .env    # Linux/macOS: cp .env.example .env
npm install
npm run seed              # catálogo de categorías
npm run dev               # http://localhost:3000
```

Variables clave: `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `CORS_ORIGIN`.
En Docker Compose usar `mongodb://mongoserver:27017/taskflow` y `REDIS_HOST=redisserver`.
