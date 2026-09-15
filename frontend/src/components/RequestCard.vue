<template>
  <div class="card request-card">
    <div class="card-header">
      <StatusBadge :estado="solicitud.estado" />
      <span :class="['badge-priority', `badge-${(solicitud.prioridad || '').toLowerCase()}`]">
        {{ solicitud.prioridad }}
      </span>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ solicitud.titulo }}</h3>
      <p class="card-description">{{ solicitud.descripcion }}</p>
      
      <div class="card-meta">
        <span class="badge-categoria">{{ solicitud.categoria }}</span>
        <span class="meta-date">{{ formatFechaCorto(solicitud.fechaCreacion) }}</span>
      </div>

      <div v-if="solicitud.respuesta" class="respuesta-preview">
        <strong>Respuesta:</strong> {{ solicitud.respuesta }}
      </div>

      <div v-if="solicitud.mensajeError" class="error-preview">
        <strong>Error:</strong> {{ solicitud.mensajeError }}
      </div>
    </div>

    <div class="card-footer">
      <span class="card-id">#{{ solicitud._id || solicitud.id }}</span>
      <router-link :to="`/solicitudes/${solicitud._id || solicitud.id}`" class="btn btn-secondary btn-sm">
        Ver Detalle &rarr;
      </router-link>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import { formatFechaCorto } from '@/utils/formatDate'

defineProps({
  solicitud: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.request-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.card-description {
  color: var(--gray-600);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.75rem;
}

.meta-date {
  font-size: 0.8rem;
  color: var(--gray-400);
}

.card-id {
  font-size: 0.8rem;
  color: var(--gray-400);
  font-family: monospace;
}

.respuesta-preview {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--success-light);
  color: var(--success-text);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.error-preview {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--danger-light);
  color: var(--danger-text);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}
</style>