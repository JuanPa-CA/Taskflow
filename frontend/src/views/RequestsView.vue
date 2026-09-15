<template>
  <div class="requests-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Solicitudes</h1>
        <p class="page-subtitle">Explora, filtra y haz seguimiento de todas las solicitudes registradas</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="cargar" :disabled="store.loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-icon': store.loading }">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Actualizar
        </button>
        <router-link to="/solicitudes/nueva" class="btn btn-primary">
          + Nueva Solicitud
        </router-link>
      </div>
    </div>

    <!-- Indicador de Caché Redis vs MongoDB (HU-08) -->
    <div v-if="store.cacheInfo && store.cacheInfo.timeMs !== null" class="card cache-banner mb-3">
      <div class="cache-banner-left">
        <span :class="['cache-badge', store.cacheInfo.hit ? 'cache-hit' : 'cache-miss']">
          {{ store.cacheInfo.hit ? '⚡ CACHE HIT (Redis)' : '🍃 CACHE MISS (MongoDB)' }}
        </span>
        <span class="cache-time">
          Tiempo: <strong>{{ store.cacheInfo.timeMs }} ms</strong>
        </span>
        <span class="cache-desc text-muted">
          {{ store.cacheInfo.hit ? 'Respuesta servida en memoria desde Redis' : 'Consulta dirigida a MongoDB y guardada en Redis' }}
        </span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="store.testCacheQuery" :disabled="store.loading" title="Demostrar funcionamiento de la caché para HU-08">
        ⚡ Demostrar Caché (HU-08)
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filters-bar">
      <div class="filter-item search-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          v-model="store.filtros.search"
          type="text"
          class="form-control"
          placeholder="Buscar por ID, título o descripción..."
        />
      </div>

      <div class="filter-item">
        <span class="filter-label">Categoría:</span>
        <select v-model="store.filtros.categoria" class="filter-select">
          <option value="">Todas</option>
          <option v-for="cat in CATEGORIAS_VALIDAS" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <span class="filter-label">Prioridad:</span>
        <select v-model="store.filtros.prioridad" class="filter-select">
          <option value="">Todas</option>
          <option v-for="prio in PRIORIDADES_VALIDAS" :key="prio" :value="prio">
            {{ prio }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <span class="filter-label">Estado:</span>
        <select v-model="store.filtros.estado" class="filter-select">
          <option value="">Todos</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN COLA">EN COLA</option>
          <option value="PROCESANDO">PROCESANDO</option>
          <option value="RESPONDIDA">RESPONDIDA</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      <button
        v-if="tieneFiltrosActivos"
        @click="store.resetFiltros"
        class="btn btn-secondary btn-sm"
        title="Restablecer todos los filtros"
      >
        Limpiar Filtros
      </button>

      <!-- View mode switch (Table / Cards) -->
      <div class="view-switch">
        <button
          :class="['switch-btn', { active: viewMode === 'table' }]"
          @click="viewMode = 'table'"
          title="Vista de Tabla"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
          </svg>
        </button>
        <button
          :class="['switch-btn', { active: viewMode === 'cards' }]"
          @click="viewMode = 'cards'"
          title="Vista de Tarjetas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
            <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Indicador de total filtrado -->
    <div class="results-counter">
      Mostrando <strong>{{ store.solicitudesFiltradas.length }}</strong> de <strong>{{ store.totalSolicitudes }}</strong> solicitudes
    </div>

    <!-- Visualización en Tabla -->
    <TableSolicitudes
      v-if="viewMode === 'table'"
      :solicitudes="store.solicitudesFiltradas"
    />

    <!-- Visualización en Tarjetas (Cards Grid) -->
    <div v-else class="cards-grid">
      <RequestCard
        v-for="solicitud in store.solicitudesFiltradas"
        :key="solicitud._id || solicitud.id"
        :solicitud="solicitud"
      />
      <div v-if="store.solicitudesFiltradas.length === 0" class="empty-cards-state card">
        <p>No se encontraron solicitudes con los filtros aplicados</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRequestStore } from '@/store/requestStore'
import { CATEGORIAS_VALIDAS, PRIORIDADES_VALIDAS } from '@/utils/validateRequest'
import TableSolicitudes from '@/components/TableSolicitudes.vue'
import RequestCard from '@/components/RequestCard.vue'

const store = useRequestStore()
const viewMode = ref('table')

const tieneFiltrosActivos = computed(() => {
  const f = store.filtros
  return Boolean(f.categoria || f.prioridad || f.estado || f.search)
})

const cargar = () => {
  store.fetchSolicitudes()
}

onMounted(() => {
  if (store.solicitudes.length === 0) {
    store.fetchSolicitudes()
  }
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-input {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-input input {
  padding-left: 2.25rem;
}

.view-switch {
  display: flex;
  background: var(--gray-100);
  padding: 2px;
  border-radius: var(--radius-sm);
  margin-left: auto;
}

.switch-btn {
  background: transparent;
  border: none;
  padding: 0.35rem 0.55rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  color: var(--gray-600);
  display: flex;
  align-items: center;
}

.switch-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.results-counter {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin-bottom: 1rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.empty-cards-state {
  grid-column: 1 / -1;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--gray-500);
}

.cache-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: white;
  border-left: 4px solid var(--primary);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cache-banner-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  font-size: 0.88rem;
}

.cache-badge {
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
}

.cache-hit {
  background: #dcfce7;
  color: #15803d;
}

.cache-miss {
  background: #fef3c7;
  color: #b45309;
}

.cache-time strong {
  color: var(--gray-900);
}

.cache-desc {
  font-size: 0.82rem;
  color: var(--gray-500);
}
</style>
