<template>
  <div class="card">
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título de la Solicitud</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha Registro</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitudes" :key="s._id || s.id">
            <td class="col-id">
              <code>#{{ (s._id || s.id || '').toString().slice(-6) }}</code>
            </td>
            <td class="col-title">
              <strong>{{ s.titulo }}</strong>
              <div class="col-desc-preview">{{ s.descripcion }}</div>
            </td>
            <td>
              <span class="badge-categoria">{{ s.categoria }}</span>
            </td>
            <td>
              <span :class="['badge-priority', `badge-${(s.prioridad || '').toLowerCase()}`]">
                {{ s.prioridad }}
              </span>
            </td>
            <td>
              <StatusBadge :estado="s.estado" :show-dot="true" />
            </td>
            <td class="col-date">
              {{ formatFechaCorto(s.fechaCreacion) }}
            </td>
            <td style="text-align: right;">
              <router-link :to="`/solicitudes/${s._id || s.id}`" class="btn btn-secondary btn-sm">
                Ver detalle &rarr;
              </router-link>
            </td>
          </tr>

          <tr v-if="solicitudes.length === 0">
            <td colspan="7" class="empty-row">
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p class="empty-text">No se encontraron solicitudes registradas</p>
                <router-link to="/solicitudes/nueva" class="btn btn-primary btn-sm">
                  + Crear la primera solicitud
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import { formatFechaCorto } from '@/utils/formatDate'

defineProps({
  solicitudes: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.col-id code {
  background: var(--gray-100);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--gray-600);
}

.col-title strong {
  display: block;
  font-size: 0.95rem;
  color: var(--gray-900);
}

.col-desc-preview {
  font-size: 0.8rem;
  color: var(--gray-500);
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-date {
  font-size: 0.825rem;
  color: var(--gray-500);
  white-space: nowrap;
}

.empty-row {
  padding: 3rem 1rem !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 0;
}

.empty-icon {
  color: var(--gray-400);
}

.empty-text {
  color: var(--gray-500);
  font-size: 0.95rem;
}
</style>