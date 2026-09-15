<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Panel de Control</h1>
        <p class="page-subtitle">Visión general y métricas en tiempo real de TASKFLOW</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="recargarDatos" :disabled="store.loading">
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

    <!-- Grid de métricas -->
    <div class="grid-stats">
      <StatCard
        titulo="Total Solicitudes"
        :valor="store.totalSolicitudes"
        tipo="total"
      />
      <StatCard
        titulo="Pendientes"
        :valor="store.pendientesCount"
        tipo="pendiente"
      />
      <StatCard
        titulo="En Cola"
        :valor="store.enColaCount"
        tipo="encola"
      />
      <StatCard
        titulo="Procesando"
        :valor="store.procesandoCount"
        tipo="procesando"
      />
      <StatCard
        titulo="Respondidas"
        :valor="store.respondidasCount"
        tipo="respondida"
      />
      <StatCard
        titulo="Errores"
        :valor="store.erroresCount"
        tipo="error"
      />
    </div>

    <!-- Barra de Estado de Servicios Rápido -->
    <div class="services-banner card mb-4">
      <div class="services-banner-inner">
        <span class="banner-title">Servicios de la Arquitectura:</span>
        <div class="services-badges">
          <div class="service-chip">
            <span class="dot" :class="store.servicios.express.ok ? 'dot-ok' : 'dot-err'"></span>
            <strong>Express API:</strong> {{ store.servicios.express.status }}
          </div>
          <div class="service-chip">
            <span class="dot" :class="store.servicios.mongodb.ok ? 'dot-ok' : 'dot-err'"></span>
            <strong>MongoDB:</strong> {{ store.servicios.mongodb.status }}
          </div>
          <div class="service-chip">
            <span class="dot" :class="store.servicios.redis.ok ? 'dot-ok' : 'dot-err'"></span>
            <strong>Redis:</strong> {{ store.servicios.redis.status }}
          </div>
          <div class="service-chip">
            <span class="dot" :class="store.servicios.worker.ok ? 'dot-ok' : 'dot-err'"></span>
            <strong>Worker Node:</strong> {{ store.servicios.worker.status }}
          </div>
        </div>
        <router-link to="/monitor" class="link-monitor">Ver monitor &rarr;</router-link>
      </div>
    </div>

    <!-- Sección de Solicitudes Recientes -->
    <div class="section-recent">
      <div class="section-header">
        <h2 class="section-title">Solicitudes Recientes</h2>
        <router-link to="/solicitudes" class="btn btn-secondary btn-sm">
          Ver todas ({{ store.totalSolicitudes }}) &rarr;
        </router-link>
      </div>

      <TableSolicitudes :solicitudes="ultimasSolicitudes" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRequestStore } from '@/store/requestStore'
import StatCard from '@/components/StatCard.vue'
import TableSolicitudes from '@/components/TableSolicitudes.vue'

const store = useRequestStore()

const ultimasSolicitudes = computed(() => {
  return store.solicitudes.slice(0, 5)
})

const recargarDatos = async () => {
  await Promise.all([store.fetchSolicitudes(), store.fetchServicios()])
}

onMounted(() => {
  store.fetchSolicitudes()
  store.fetchServicios()
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

.mb-4 {
  margin-bottom: 2rem;
}

.services-banner {
  padding: 0.85rem 1.25rem;
  background: white;
}

.services-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.banner-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gray-700);
}

.services-badges {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.service-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  color: var(--gray-700);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-ok {
  background-color: var(--success);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.dot-err {
  background-color: var(--danger);
}

.link-monitor {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

.link-monitor:hover {
  text-decoration: underline;
}

.section-recent {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
}
</style>
