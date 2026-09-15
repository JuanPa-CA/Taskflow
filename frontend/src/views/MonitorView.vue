<template>
  <div class="monitor-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Monitor de Procesamiento y Servicios</h1>
        <p class="page-subtitle">Supervisión en vivo de la infraestructura distribuida de TASKFLOW</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="recargarMonitor" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-icon': loading }">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Sondear Servicios
        </button>
      </div>
    </div>

    <!-- Panel de Estado de Servicios Distribuidos -->
    <div class="services-grid mb-4">
      <div class="card service-card">
        <div class="service-card-header">
          <div class="service-icon-box">⚡</div>
          <div>
            <h3 class="service-title">Backend API</h3>
            <span class="service-tech">Node.js + Express</span>
          </div>
        </div>
        <div class="service-status">
          <span class="dot" :class="store.servicios.express.ok ? 'dot-ok' : 'dot-err'"></span>
          <span class="status-name">{{ store.servicios.express.status }}</span>
        </div>
        <p class="service-desc">API REST y servidor WebSocket Socket.IO para eventos en vivo.</p>
      </div>

      <div class="card service-card">
        <div class="service-card-header">
          <div class="service-icon-box">🍃</div>
          <div>
            <h3 class="service-title">Persistencia</h3>
            <span class="service-tech">MongoDB (Volumen)</span>
          </div>
        </div>
        <div class="service-status">
          <span class="dot" :class="store.servicios.mongodb.ok ? 'dot-ok' : 'dot-err'"></span>
          <span class="status-name">{{ store.servicios.mongodb.status }}</span>
        </div>
        <p class="service-desc">Almacenamiento persistente de solicitudes, estados y respuestas.</p>
      </div>

      <div class="card service-card">
        <div class="service-card-header">
          <div class="service-icon-box">🔴</div>
          <div>
            <h3 class="service-title">Caché & Cola</h3>
            <span class="service-tech">Redis Server</span>
          </div>
        </div>
        <div class="service-status">
          <span class="dot" :class="store.servicios.redis.ok ? 'dot-ok' : 'dot-err'"></span>
          <span class="status-name">{{ store.servicios.redis.status }}</span>
        </div>
        <p class="service-desc">Aceleración de consultas repetidas y cola FIFO para el Worker.</p>
      </div>

      <div class="card service-card">
        <div class="service-card-header">
          <div class="service-icon-box">⚙️</div>
          <div>
            <h3 class="service-title">Worker Asíncrono</h3>
            <span class="service-tech">Node.js Background</span>
          </div>
        </div>
        <div class="service-status">
          <span class="dot" :class="store.servicios.worker.ok ? 'dot-ok' : 'dot-err'"></span>
          <span class="status-name">{{ store.servicios.worker.status }}</span>
        </div>
        <p class="service-desc">Consumidor independiente que aplica reglas y resuelve solicitudes.</p>
      </div>
    </div>

    <!-- Indicadores de Flujo de Procesamiento -->
    <div class="flow-metrics-section mb-4">
      <h2 class="section-title mb-3">Métricas de la Cola y Procesamiento</h2>
      <div class="grid-stats">
        <StatCard
          titulo="En Cola (Redis)"
          :valor="store.metricas.enCola"
          tipo="encola"
        />
        <StatCard
          titulo="En Procesamiento"
          :valor="store.metricas.procesando"
          tipo="procesando"
        />
        <StatCard
          titulo="Respondidas"
          :valor="store.metricas.respondidas"
          tipo="respondida"
        />
        <StatCard
          titulo="Errores Controlados"
          :valor="store.metricas.errores"
          tipo="error"
        />
      </div>
    </div>

    <!-- Módulo de Demostración de Caché Redis (HU-08) -->
    <div class="card cache-demo-card mb-4">
      <div class="card-header">
        <div>
          <h2 class="card-title">Módulo de Aceleración y Caché (Redis HU-08)</h2>
          <p class="card-subtitle">Demostración pedagógica del ciclo CACHE MISS (MongoDB) vs CACHE HIT (Redis en memoria)</p>
        </div>
        <button class="btn btn-primary btn-sm" @click="probarCache" :disabled="loading || store.loading">
          ⚡ Ejecutar Consulta de Prueba
        </button>
      </div>
      <div class="card-body">
        <div class="cache-status-row">
          <div class="cache-box">
            <span class="cache-label">Último Resultado</span>
            <span :class="['cache-pill-lg', store.cacheInfo?.hit ? 'hit' : 'miss']">
              {{ store.cacheInfo?.hit ? '⚡ CACHE HIT' : (store.cacheInfo?.timeMs !== null ? '🍃 CACHE MISS' : 'Sin pruebas aún') }}
            </span>
          </div>
          <div class="cache-box">
            <span class="cache-label">Tiempo de Respuesta</span>
            <span class="cache-val"><strong>{{ store.cacheInfo?.timeMs ?? '--' }}</strong> ms</span>
          </div>
          <div class="cache-box">
            <span class="cache-label">Origen de Datos</span>
            <span class="cache-val">{{ store.cacheInfo?.source ?? 'Pendiente de consulta' }}</span>
          </div>
        </div>

        <div v-if="store.cacheHistory && store.cacheHistory.length > 0" class="history-block mt-3">
          <h4 class="history-title">Historial de Verificación de Caché:</h4>
          <div class="history-list">
            <div
              v-for="(item, idx) in store.cacheHistory"
              :key="idx"
              class="history-item"
            >
              <span class="history-time">{{ item.fecha }}</span>
              <span :class="['history-badge', item.hit ? 'badge-hit' : 'badge-miss']">
                {{ item.hit ? 'CACHE HIT' : 'CACHE MISS' }}
              </span>
              <span class="history-src">{{ item.source }}</span>
              <span class="history-ms">{{ item.timeMs }} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Registro de Actividad en Tiempo Real (Socket.IO Stream) -->
    <div class="card activity-stream-card">
      <div class="card-header">
        <div class="stream-header-title">
          <div class="live-blip"></div>
          <h2 class="card-title">Registro de Eventos en Tiempo Real (Socket.IO)</h2>
        </div>
        <button class="btn btn-secondary btn-sm" @click="store.eventLogs = []" title="Limpiar historial visual">
          Limpiar Log
        </button>
      </div>

      <div class="card-body stream-body">
        <div v-if="store.eventLogs.length === 0" class="stream-empty">
          <p>No se han registrado eventos recientemente. Las actividades de la cola y Worker se mostrarán aquí en vivo.</p>
        </div>

        <div v-else class="stream-list">
          <div
            v-for="log in store.eventLogs"
            :key="log.id"
            :class="['stream-item', `stream-${log.tipo}`]"
          >
            <span class="stream-time">{{ log.hora }}</span>
            <span class="stream-type-tag">{{ log.tipo.toUpperCase() }}</span>
            <span class="stream-message">{{ log.mensaje }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRequestStore } from '@/store/requestStore'
import StatCard from '@/components/StatCard.vue'

const store = useRequestStore()
const loading = ref(false)

const recargarMonitor = async () => {
  loading.value = true
  try {
    await store.fetchServicios()
    await store.fetchSolicitudes()
  } finally {
    loading.value = false
  }
}

const probarCache = async () => {
  await store.testCacheQuery()
}

onMounted(() => {
  recargarMonitor()
})
</script>

<style scoped>
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 2rem; }

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gray-800);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.service-card {
  padding: 1.5rem;
}

.service-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.service-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.service-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gray-900);
}

.service-tech {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.service-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  margin-bottom: 0.75rem;
}

.status-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-800);
}

.service-desc {
  font-size: 0.8rem;
  color: var(--gray-500);
  line-height: 1.4;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot-ok {
  background-color: var(--success);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.dot-err {
  background-color: var(--danger);
}

/* Activity Stream */
.stream-header-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.live-blip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--danger);
  animation: pulse-blip 1.5s infinite;
}

@keyframes pulse-blip {
  0% { transform: scale(0.95); opacity: 0.9; }
  50% { transform: scale(1.3); opacity: 0.4; }
  100% { transform: scale(0.95); opacity: 0.9; }
}

.stream-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.stream-empty {
  text-align: center;
  padding: 2rem;
  color: var(--gray-400);
  font-size: 0.9rem;
}

.stream-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.stream-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--gray-50);
  border-left: 3px solid var(--gray-300);
  font-size: 0.85rem;
}

.stream-time {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--gray-400);
}

.stream-type-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: var(--gray-200);
  color: var(--gray-700);
}

.stream-message {
  color: var(--gray-800);
  font-weight: 500;
}

.stream-creada { border-left-color: var(--primary); }
.stream-cola { border-left-color: var(--primary-dark); }
.stream-procesando { border-left-color: var(--purple); }
.stream-respondida { border-left-color: var(--success); }
.stream-error { border-left-color: var(--danger); }

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Estilos Módulo de Demostración de Caché */
.cache-demo-card {
  padding: 1.5rem;
  border-top: 4px solid var(--primary);
}

.cache-status-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  padding: 1rem 0;
}

.cache-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cache-label {
  font-size: 0.8rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.cache-val {
  font-size: 1.1rem;
  color: var(--gray-900);
}

.cache-pill-lg {
  display: inline-block;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  width: fit-content;
}

.cache-pill-lg.hit {
  background: #dcfce7;
  color: #15803d;
}

.cache-pill-lg.miss {
  background: #fef3c7;
  color: #b45309;
}

.history-block {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.history-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.65rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: var(--gray-50);
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
}

.history-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.badge-hit {
  background: #dcfce7;
  color: #15803d;
}

.badge-miss {
  background: #fef3c7;
  color: #b45309;
}

.history-src {
  flex: 1;
  color: var(--gray-700);
}

.history-ms {
  color: var(--gray-900);
}
</style>
