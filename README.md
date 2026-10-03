# TASKFLOW — Sistema Distribuido de Gestión y Procesamiento de Solicitudes

> **Programa de Formación:** Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA  
> **Ficha / Código:** 3139319  
> **Competencia:** Implementar la solución de software de acuerdo con los requisitos de operación y modelos de referencia  
> **Actividad de Aprendizaje:** Configurar los servicios requeridos del software mediante Docker Compose  

---

## 1. Descripción del Proyecto

**TASKFLOW** es una solución web Full Stack orientada a la recepción, almacenamiento, encolamiento y procesamiento asíncrono de solicitudes empresariales (información, soporte, trámites documentales, consultas y actualización de datos). 

El sistema resuelve la problemática de cuellos de botella y demoras en la atención directa mediante una **arquitectura distribuida por servicios desacoplados**, evitando que el procesamiento pesado de solicitudes bloquee la recepción de nuevas peticiones o la experiencia interactiva del usuario.

---

## 2. Tecnologías Utilizadas

| Capa / Servicio | Tecnología | Propósito |
|---|---|---|
| **Frontend** | Vue 3 (Composition API), Vite, Pinia, Vue Router, Socket.IO Client, Nginx | Interfaz de usuario reactiva, enrutamiento SPA, visualización en tiempo real y cliente HTTP |
| **Backend API** | Node.js, Express.js, Socket.IO Server | API REST para CRUD de solicitudes, endpoints de monitoreo y servidor de WebSockets |
| **Base de Datos** | MongoDB 6.0 | Almacenamiento persistente de solicitudes, estados, respuestas y logs |
| **Caché y Cola** | Redis 7.0 | Aceleración en memoria de consultas frecuentes (Caché) y administración de cola FIFO de solicitudes |
| **Worker** | Node.js (Background Consumer) | Consumidor asíncrono que extrae solicitudes de la cola Redis, aplica reglas de negocio y guarda respuestas en MongoDB |
| **Contenerización** | Docker & Docker Compose | Empaquetado en contenedores independientes, redes virtuales y volúmenes persistentes |
| **Control de Versiones** | Git y GitHub | Flujo de trabajo colaborativo mediante Issues, ramas, Pull Requests y Code Reviews |

---

## 3. Arquitectura del Sistema

La solución opera bajo una arquitectura distribuida orquestada con **Docker Compose**, compuesta por 5 servicios aislados comunicados internamente por nombres de host de red de Docker:

```text
                               ┌───────────────────────────┐
                               │          USUARIO          │
                               │  Navegador Web (Desktop)  │
                               └─────────────┬─────────────┘
                                             │ HTTP (Puerto 80 / 5173)
                                             ▼
                               ┌───────────────────────────┐
                               │     frontend (Vue 3)      │
                               │  Nginx / Servidor Vite    │
                               └─────────────┬─────────────┘
                                             │ HTTP REST / WebSocket (Puerto 3000)
                                             ▼
                               ┌───────────────────────────┐
                               │  backend (Node + Express) │
                               │   API REST + Socket.IO    │
                               └──────┬─────────────┬──────┘
                                      │             │
                Consulta / Guarda     │             │ Encola solicitud
                solicitud             │             │ Consulta con caché
                                      ▼             ▼
                           ┌────────────────┐ ┌────────────────┐
                           │  mongoserver   │ │  redisserver   │
                           │    MongoDB     │ │     Redis      │
                           │  (mongo-data)  │ │ (Caché & Cola) │
                           └────────▲───────┘ └────────┬───────┘
                                    │                  │
                         Guarda     │                  │ Consume de cola FIFO
                         respuesta  │                  │
                                    └───────┐ ┌────────┘
                                            │ │
                                      ┌─────┴─┴─────┐
                                      │   worker    │
                                      │   Node.js   │
                                      └─────────────┘
```

### Reglas Clave de la Arquitectura
1. **Desacoplamiento Estricto:** El frontend nunca se conecta directamente a MongoDB ni a Redis; toda interacción pasa por la API de Express.
2. **Procesamiento Asíncrono no bloqueante:** El registro de una solicitud responde de inmediato al usuario una vez almacenada en Mongo y encolada en Redis. El procesamiento ocurre en segundo plano por el `worker`.
3. **Comunicación interna:** Los contenedores se comunican internamente mediante sus nombres de servicio (`mongoserver:27017`, `redisserver:6379`, `backend:3000`).

---

## 4. Estructura del Repositorio

```text
Taskflow/
├── frontend/                     # Aplicación cliente Vue 3
│   ├── src/
│   │   ├── assets/               # Logotipos e isotipos (logo.svg)
│   │   ├── components/           # Componentes UI reutilizables (Forms, Cards, Tables, Badges)
│   │   ├── composables/          # Lógica reactiva reutilizable (useRequests, useSocket)
│   │   ├── layouts/              # Plantilla principal responsive (MainLayout)
│   │   ├── plugins/              # Axios y Socket.IO
│   │   ├── router/               # Rutas SPA de Vue Router
│   │   ├── services/             # Servicios de comunicación con backend Express
│   │   ├── store/                # Estado global con Pinia y manejo de Toasts
│   │   ├── styles/               # Estilos globales y variables de diseño
│   │   ├── utils/                # Validaciones y formateadores de fecha
│   │   └── views/                # Pantallas principales de la aplicación
│   ├── Dockerfile                # Compilación multi-etapa con Node y Nginx
│   ├── nginx.conf                # Configuración de Nginx para Vue Router (try_files)
│   ├── .dockerignore
│   └── package.json
│
├── backend/                      # API REST con Express.js y Socket.IO
│   ├── config/                   # MongoDB, Redis, Socket.IO y Pub/Sub
│   ├── controllers/               # Controladores HTTP
│   ├── models/                    # Esquemas MongoDB
│   ├── routes/                    # Endpoints bajo /api
│   ├── services/                  # Solicitudes, cola, caché y monitor
│   ├── Dockerfile
│   └── package.json
│
├── worker/                       # Consumidor asíncrono Node.js de la cola Redis
│   ├── src/worker.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml            # Orquestación de los 5 servicios
├── ARQUITECTURA_TASKFLOW.md      # Especificación completa de arquitectura y HU
├── Taller TaskFlow.docx          # Documento oficial guía del SENA
└── README.md                     # Documentación general del proyecto
```

---

## 5. Funcionalidades y Pantallas de TASKFLOW

| Pantalla | Ruta | Descripción |
|---|---|---|
| **Dashboard** | `/` | Resumen general con tarjetas métricas de solicitudes (Total, Pendientes, En Cola Redis, Procesando, Respondidas, Errores), estado de salud de servicios y solicitudes recientes. Sus métricas usan la misma fuente que el monitor. |
| **Nueva Solicitud** | `/solicitudes/nueva` | Formulario reactivo con validación de campos obligatorios, categorías sugeridas, niveles de prioridad y confirmación inmediata con ID de radicado. |
| **Gestión de Solicitudes** | `/solicitudes` | Listado tabular y en tarjetas, buscador en tiempo real, filtros por categoría, prioridad y estado, además del indicador de **Caché Redis (HU-08)**. |
| **Detalle de Solicitud** | `/solicitudes/:id` | Visualización individual con un **Stepper interactivo del ciclo de vida**, detalles de radicación y la respuesta generada por el Worker. |
| **Monitor del Sistema** | `/monitor` | Supervisión de los 4 componentes (Backend, Mongo, Redis, Worker), longitud real de la cola Redis y estados almacenados en MongoDB, módulo de prueba de caché y **Stream de eventos en tiempo real con Socket.IO**. |

### Estados Oficiales de la Solicitud
* 🟡 `PENDIENTE`: Solicitud recibida en el sistema.
* 🔵 `EN COLA`: Solicitud registrada en la cola FIFO de Redis.
* 🟣 `PROCESANDO`: Solicitud tomada por el Worker para análisis.
* 🟢 `RESPONDIDA`: Procesamiento culminado con éxito y respuesta guardada en MongoDB.
* 🔴 `ERROR`: Fallo controlado registrado ante datos anómalos o inconsistencias.

---

## 6. Instalación y Despliegue

### Requisitos Previos
* **Docker Desktop** (versión 24.0 o superior) y **Docker Compose** instalados.
* **Node.js 20+** y **npm** (para ejecución en modo desarrollo local).
* **Git** configurado en el equipo anfitrión.

---

### Opción A: Ejecución Completa con Docker Compose (Recomendada)

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/Taskflow.git
   cd Taskflow
   ```

2. **Iniciar todos los servicios:**
   ```bash
   docker compose up --build
   ```

3. **Verificar contenedores en ejecución:**
   ```bash
   docker compose ps
   ```

4. **Acceder a los servicios:**
   * **Frontend Web:** [http://localhost](http://localhost) (Puerto 80)
   * **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
   * **MongoDB:** `localhost:27017`
   * **Redis:** `localhost:6379`

5. **Detener el entorno:**
   ```bash
   docker compose down
   ```

---

### Opción B: Ejecución del Frontend en Desarrollo Local

1. **Ingresar a la carpeta del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo con Vite:**
   ```bash
   npm run dev
   ```
   Abrir navegador en [http://localhost:5173](http://localhost:5173).

4. **Compilar para producción manualmente:**
   ```bash
   npm run build
   ```

### Opción C: Ejecución del Worker en Desarrollo Local

El backend, MongoDB y Redis deben estar disponibles localmente. El archivo
`worker/.env.example` usa `localhost`; dentro de Docker Compose, las variables
de conexión se configuran automáticamente con los nombres de servicio
`mongoserver` y `redisserver`.

```powershell
cd worker
npm install
Copy-Item .env.example .env
npm run dev
```

### Pruebas del backend y del ciclo Socket.IO

Con MongoDB, Redis, backend y Worker activos:

```powershell
cd backend
npm test
npm run test:socket
```

---

## 7. Guía de Pruebas Obligatorias (Sección 17 del Taller)

Durante la sustentación ante el instructor SENA, el equipo debe evidenciar las siguientes 8 pruebas en vivo:

| # | Prueba | Criterio de Aceptación | Cómo Demostrarlo en TASKFLOW |
|---|---|---|---|
| **1** | **Registro** | Registrar solicitud desde Vue y comprobar guardado en MongoDB. | Ir a `/solicitudes/nueva`, llenar el formulario y verificar en Compass o API que se generó en MongoDB con estado inicial. |
| **2** | **Respuesta** | Procesar solicitud y comprobar que genera respuesta. | Observar que el Worker toma la solicitud y en `/solicitudes/:id` aparece la respuesta automática según su categoría. |
| **3** | **Cola** | Detener Worker, registrar 5 solicitudes y comprobar que quedan en cola. | Ejecutar `docker stop taskflow-worker`, radicar 5 solicitudes y observar en `/monitor` que aumentan en "En Cola (Redis)". |
| **4** | **Recuperación** | Iniciar Worker y comprobar procesamiento de pendientes. | Ejecutar `docker start taskflow-worker`; el Worker consume las 5 pendientes y las pasa a `RESPONDIDA`. |
| **5** | **Caché** | Demostrar una consulta `CACHE MISS` y luego una `CACHE HIT`. | En `/solicitudes` o `/monitor`, pulsar "Demostrar Caché (HU-08)". La primera consulta marca **CACHE MISS** (MongoDB) y la segunda **CACHE HIT** (Redis en memoria). El tiempo se muestra para comparar y puede variar según el equipo y la carga. |
| **6** | **Persistencia** | Reiniciar servicios y verificar que la información persiste. | Ejecutar `docker compose down` y luego `docker compose up -d`. Abrir el frontend y comprobar que todas las solicitudes continúan intactas gracias al volumen `mongo-data`. |
| **7** | **Error** | Provocar un error controlado y verificar el estado `ERROR` sin detener el Worker. | Simular un fallo de procesamiento: el detalle muestra un mensaje seguro para el usuario; el motivo técnico queda únicamente en los logs del Worker y las demás solicitudes siguen procesándose. |
| **8** | **Responsive** | Comprobar adaptación a diferentes pantallas. | Probar la aplicación en móvil (F12 > Toggle device toolbar) validando el menú hamburguesa, tarjetas y tabla responsive sin desbordamiento horizontal. |

---

## 8. Flujo de Trabajo en Git y GitHub (Sección 16)

Para evidenciar el trabajo colaborativo evaluado por el SENA, el equipo aplica el siguiente flujo de trabajo:

```text
Issue en GitHub
      ↓
Asignación de Tarea (GitHub Projects)
      ↓
Creación de Rama (feature/nombre-funcionalidad)
      ↓
Desarrollo y Commits Descriptivos
      ↓
Push a GitHub
      ↓
Creación de Pull Request (PR)
      ↓
Revisión de Código (Code Review por el compañero)
      ↓
Aprobación y Merge a rama principal
      ↓
Cierre automático del Issue
```

### Convención de Ramas
* `main`: Código estable y probado para entrega final.
* `feature/frontend-...`: Ramas de desarrollo de interfaz y componentes.
* `feature/backend-...`: Ramas de desarrollo de API y base de datos.
* `feature/worker-...`: Ramas de lógica del procesador asíncrono.
* `feature/docker-...`: Ramas de orquestación y Docker Compose.

---

## 9. Miembros del Equipo de Desarrollo (Aprendices)

* **Aprendiz 1 (Frontend & UI/UX):** Juan Pablo — *Desarrollo de vistas Vue 3, Pinia Store, Socket.IO Client, Dockerfile Frontend y Maquetación Responsive.*
* **Aprendiz 2 (Backend & Worker):** [Nombre del Compañero] — *Desarrollo de API Express.js, Modelos MongoDB, Integración Redis Caché/Cola y Lógica del Worker Asíncrono.*

---

## 10. Licencia y Créditos

Proyecto desarrollado con fines académicos en el marco del programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO)** — **Servicio Nacional de Aprendizaje (SENA)**, 2026.
