<template>
  <div class="request-detail-page">
    <!-- Navegación y encabezado -->
    <div class="page-header">
      <div class="header-left">
        <router-link to="/solicitudes" class="btn btn-secondary btn-sm mb-2">
          &larr; Volver a Solicitudes
        </router-link>
        <h1 class="page-title">
          Detalle de Solicitud
          <span class="id-tag">#{{ id }}</span>
        </h1>
      </div>
      <div class="header-actions" v-if="solicitud">
        <StatusBadge :estado="solicitud.estado" :show-dot="true" />
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading && !solicitud" class="card loading-card">
      <div class="spinner-large"></div>
      <p>Cargando información de la solicitud...</p>
    </div>

    <!-- Estado de Error de Consulta -->
    <div v-else-if="error && !solicitud" class="card error-card">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-danger">
        <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
      <h3>No se pudo cargar la solicitud</h3>
      <p>{{ error }}</p>
      <router-link to="/solicitudes" class="btn btn-primary btn-sm mt-3">
        Regresar al listado
      </router-link>
    </div>

    <!-- Contenido Principal de la Solicitud -->
    <div v-else-if="solicitud" class="detail-container">
      <!-- Ciclo de Vida / Stepper Visual del Proceso Asíncrono -->
      <div class="card lifecycle-card mb-4">
        <h3 class="lifecycle-title">Ciclo de Procesamiento en Tiempo Real</h3>
        <div class="stepper">
          <div :class="['step', getStepStatus('PENDIENTE')]">
            <div class="step-circle">1</div>
            <div class="step-label">PENDIENTE</div>
          </div>
          <div :class="['step-line', getLineStatus('EN COLA')]"></div>

          <div :class="['step', getStepStatus('EN COLA')]">
            <div class="step-circle">2</div>
            <div class="step-label">EN COLA (Redis)</div>
          </div>
          <div :class="['step-line', getLineStatus('PROCESANDO')]"></div>

          <div :class="['step', getStepStatus('PROCESANDO')]">
            <div class="step-circle">3</div>
            <div class="step-label">PROCESANDO (Worker)</div>
          </div>
          <div :class="['step-line', getLineStatus(solicitud.estado === 'ERROR' ? 'ERROR' : 'RESPONDIDA')]"></div>

          <div v-if="solicitud.estado === 'ERROR'" class="step step-error">
            <div class="step-circle">✕</div>
            <div class="step-label">ERROR</div>
          </div>
          <div v-else :class="['step', getStepStatus('RESPONDIDA')]">
            <div class="step-circle">✓</div>
            <div class="step-label">RESPONDIDA</div>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Tarjeta de Información General -->
        <div class="card info-card">
          <div class="card-header">
            <h2 class="card-title">Información Registrada</h2>
            <span :class="['badge-priority', `badge-${(solicitud.prioridad || '').toLowerCase()}`]">
              Prioridad: {{ solicitud.prioridad }}
            </span>
          </div>

          <div class="card-body">
            <div class="info-group">
              <label class="info-label">Título del Asunto</label>
              <p class="info-value title-value">{{ solicitud.titulo }}</p>
            </div>

            <div class="info-group">
              <label class="info-label">Categoría</label>
              <div>
                <span class="badge-categoria">{{ solicitud.categoria }}</span>
              </div>
            </div>

            <div class="info-group">
              <label class="info-label">Descripción</label>
              <div class="info-box-desc">
                {{ solicitud.descripcion }}
              </div>
            </div>

            <div class="dates-row">
              <div class="date-item">
                <span class="date-label">Fecha de Registro:</span>
                <span class="date-val">{{ formatDate(solicitud.fechaCreacion) }}</span>
              </div>
              <div v-if="solicitud.fechaProcesamiento" class="date-item">
                <span class="date-label">Fecha de Procesamiento:</span>
                <span class="date-val">{{ formatDate(solicitud.fechaProcesamiento) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta de Respuesta o Estado de Procesamiento -->
        <div class="status-panel">
          <!-- Caso 1: Solicitud Respondida -->
          <div v-if="solicitud.estado === 'RESPONDIDA'" class="card response-card">
            <div class="card-header response-header">
              <div class="header-with-icon">
                <div class="icon-circle success-circle">✓</div>
                <h2 class="card-title">Respuesta Generada</h2>
              </div>
              <span class="badge-status badge-respondida">Completada</span>
            </div>
            <div class="card-body">
              <div class="response-text">
                {{ solicitud.respuesta }}
              </div>
              <div class="response-meta">
                <small>Generada automáticamente por el Worker según reglas de la categoría <strong>{{ solicitud.categoria }}</strong>.</small>
              </div>
            </div>
          </div>

          <!-- Caso 2: Solicitud en Error -->
          <div v-else-if="solicitud.estado === 'ERROR'" class="card error-panel-card">
            <div class="card-header error-header">
              <div class="header-with-icon">
                <div class="icon-circle error-circle">✕</div>
                <h2 class="card-title text-danger">Error de Procesamiento</h2>
              </div>
              <span class="badge-status badge-error">Fallo</span>
            </div>
            <div class="card-body">
              <p class="error-text">
                {{ solicitud.mensajeError || 'Ocurrió un error inesperado al procesar la solicitud.' }}
              </p>
            </div>
          </div>

          <!-- Caso 3: Solicitud en Proceso o Espera -->
          <div v-else class="card waiting-card">
            <div class="card-body waiting-body">
              <div class="waiting-animation">
                <div class="pulse-ring"></div>
                <div class="waiting-icon">⏳</div>
              </div>
              <h3>Solicitud en Progreso</h3>
              <p v-if="solicitud.estado === 'EN COLA'">
                La solicitud está almacenada en MongoDB y esperando en la cola Redis para ser tomada por el Worker.
              </p>
              <p v-else-if="solicitud.estado === 'PROCESANDO'">
                El Worker está procesando la solicitud y generando la respuesta correspondiente.
              </p>
              <p v-else>
                La solicitud ha sido registrada y pronto pasará a la cola.
              </p>
              <div class="live-notice">
                <span class="socket-dot dot-ok"></span>
                <span>Actualización automática en tiempo real activada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestStore } from '@/store/requestStore'
import { requestService } from '@/services/requestService'
import { formatDate } from '@/utils/formatDate'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const store = useRequestStore()

const id = computed(() => route.params.id)
const loading = ref(false)
const error = ref(null)

// Encuentra la solicitud en el store reactivo (así cuando socket.io emita, se actualiza automáticamente)
const solicitud = computed(() => {
  return store.solicitudes.find(s => (s._id || s.id) === id.value) || null
})

const ordenEstados = ['PENDIENTE', 'EN COLA', 'PROCESANDO', 'RESPONDIDA']

const progreso = computed(() => {
  if (!solicitud.value) return -1
  const estado = solicitud.value.estado
  if (estado === 'ERROR') return ordenEstados.length
  return ordenEstados.indexOf(estado)
})

const getStepStatus = (stepName) => {
  const stepIndex = ordenEstados.indexOf(stepName)
  if (progreso.value === stepIndex) return 'step-active'
  if (progreso.value > stepIndex) return 'step-done'
  return 'step-pending'
}

const getLineStatus = (nextStepName) => {
  const nextIndex = nextStepName === 'ERROR' ? ordenEstados.length : ordenEstados.indexOf(nextStepName)
  if (progreso.value >= nextIndex) return 'line-active'
  return ''
}

const cargarDetalle = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await requestService.getSolicitud(id.value)
    const item = data.solicitud || data
    store.upsertSolicitud(item)
  } catch (err) {
    error.value = err.response?.data?.mensaje || err.message || 'No se pudo cargar la solicitud'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarDetalle()
})
</script>

<style scoped>
.id-tag {
  font-size: 1.1rem;
  color: var(--gray-400);
  font-family: monospace;
  font-weight: 500;
  margin-left: 0.5rem;
}

.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-3 { margin-top: 1rem; }

.loading-card, .error-card {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Lifecycle Stepper */
.lifecycle-card {
  padding: 1.5rem;
  background: white;
}

.lifecycle-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--gray-700);
  margin-bottom: 1.5rem;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 2;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  background: var(--gray-200);
  color: var(--gray-600);
  transition: var(--transition);
}

.step-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gray-500);
  white-space: nowrap;
}

.step-active .step-circle {
  background: var(--primary);
  color: white;
  box-shadow: 0 0 0 4px var(--primary-light);
  animation: pulse-ring 2s infinite;
}

.step-active .step-label {
  color: var(--primary);
}

.step-done .step-circle {
  background: var(--success);
  color: white;
}

.step-done .step-label {
  color: var(--success-text);
}

.step-error .step-circle {
  background: var(--danger);
  color: white;
}

.step-error .step-label {
  color: var(--danger-text);
}

.step-line {
  flex: 1;
  height: 3px;
  background: var(--gray-200);
  margin: 0 0.5rem;
  position: relative;
  top: -12px;
  z-index: 1;
  transition: var(--transition);
}

.step-line.line-active {
  background: var(--success);
}

@keyframes pulse-ring {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
}

.info-group {
  margin-bottom: 1.25rem;
}

.info-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.title-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.info-box-desc {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  color: var(--gray-800);
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.dates-row {
  display: flex;
  gap: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.date-label {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.date-val {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-800);
}

/* Response card */
.response-card {
  border-left: 5px solid var(--success);
}

.response-header {
  background: var(--success-light);
}

.header-with-icon {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.icon-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
}

.success-circle {
  background: var(--success);
  color: white;
}

.error-circle {
  background: var(--danger);
  color: white;
}

.response-text {
  font-size: 1.05rem;
  color: var(--gray-900);
  background: var(--gray-50);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  line-height: 1.6;
}

.response-meta {
  margin-top: 1rem;
  color: var(--gray-500);
}

/* Waiting card */
.waiting-card {
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.waiting-animation {
  margin-bottom: 1.25rem;
  font-size: 2.5rem;
}

.waiting-card h3 {
  font-size: 1.2rem;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.waiting-card p {
  font-size: 0.9rem;
  color: var(--gray-600);
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto 1.5rem;
}

.live-notice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--gray-700);
}

@media (max-width: 860px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .stepper {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
}
</style>
