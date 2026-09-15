<template>
  <div class="new-request-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Registrar Nueva Solicitud</h1>
        <p class="page-subtitle">Ingresa la información requerida para que el sistema procese tu solicitud</p>
      </div>
      <router-link to="/solicitudes" class="btn btn-secondary btn-sm">
        &larr; Volver al listado
      </router-link>
    </div>

    <!-- Confirmación de Éxito al Registrar -->
    <div v-if="creadaInfo" class="card success-card mb-4">
      <div class="success-header">
        <div class="success-icon">✓</div>
        <div>
          <h3>¡Solicitud registrada con éxito!</h3>
          <p>Tu solicitud ha sido enviada al backend Express, almacenada en MongoDB y enviada a la cola Redis para su procesamiento asíncrono.</p>
        </div>
      </div>

      <div class="success-details">
        <div><strong>ID:</strong> #{{ creadaInfo._id || creadaInfo.id }}</div>
        <div><strong>Título:</strong> {{ creadaInfo.titulo }}</div>
        <div><strong>Categoría:</strong> {{ creadaInfo.categoria }}</div>
        <div><strong>Estado inicial:</strong> <StatusBadge :estado="creadaInfo.estado || 'EN COLA'" /></div>
      </div>

      <div class="success-actions">
        <router-link :to="`/solicitudes/${creadaInfo._id || creadaInfo.id}`" class="btn btn-primary">
          Hacer Seguimiento en Vivo &rarr;
        </router-link>
        <button class="btn btn-secondary" @click="registrarOtra">
          Registrar Otra Solicitud
        </button>
      </div>
    </div>

    <!-- Formulario -->
    <div v-else class="form-wrapper">
      <RequestForm @form-submit="handleSuccess" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RequestForm from '@/components/RequestForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const creadaInfo = ref(null)

const handleSuccess = (solicitud) => {
  creadaInfo.value = solicitud
}

const registrarOtra = () => {
  creadaInfo.value = null
}

const handleCancel = () => {
  router.push('/solicitudes')
}
</script>

<style scoped>
.form-wrapper {
  max-width: 760px;
  margin: 0 auto;
}

.success-card {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-left: 6px solid var(--success);
}

.success-header {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.success-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--success-light);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
}

.success-header h3 {
  font-size: 1.3rem;
  color: var(--gray-900);
  margin-bottom: 0.35rem;
}

.success-header p {
  color: var(--gray-600);
  font-size: 0.95rem;
  line-height: 1.5;
}

.success-details {
  background: var(--gray-50);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  font-size: 0.9rem;
  margin-bottom: 1.75rem;
}

.success-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
