<template>
  <div class="card request-form-card">
    <div class="card-header">
      <h2 class="card-title">Formulario de Solicitud</h2>
      <span class="required-notice">* Campos obligatorios</span>
    </div>

    <form @submit.prevent="handleSubmit" class="card-body">
      <!-- Mensaje de error general si existe -->
      <div v-if="generalError" class="alert alert-danger">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
        <span>{{ generalError }}</span>
      </div>

      <!-- Título -->
      <div class="form-group">
        <label for="titulo" class="form-label">
          Título del Asunto <span class="required">*</span>
        </label>
        <input
          id="titulo"
          v-model="form.titulo"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.titulo }"
          placeholder="Ej: Solicitud de certificado de estudio"
          :disabled="submitting"
        />
        <span v-if="errors.titulo" class="form-error">{{ errors.titulo }}</span>
      </div>

      <!-- Categoría y Prioridad en 2 columnas -->
      <div class="form-row">
        <div class="form-group col-half">
          <label for="categoria" class="form-label">
            Categoría <span class="required">*</span>
          </label>
          <select
            id="categoria"
            v-model="form.categoria"
            class="form-control"
            :class="{ 'is-invalid': errors.categoria }"
            :disabled="submitting"
          >
            <option value="" disabled>Seleccione una categoría</option>
            <option v-for="cat in CATEGORIAS_VALIDAS" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
          <span v-if="errors.categoria" class="form-error">{{ errors.categoria }}</span>
        </div>

        <div class="form-group col-half">
          <label for="prioridad" class="form-label">
            Nivel de Prioridad <span class="required">*</span>
          </label>
          <select
            id="prioridad"
            v-model="form.prioridad"
            class="form-control"
            :class="{ 'is-invalid': errors.prioridad }"
            :disabled="submitting"
          >
            <option value="" disabled>Seleccione prioridad</option>
            <option v-for="prio in PRIORIDADES_VALIDAS" :key="prio" :value="prio">
              {{ prio }}
            </option>
          </select>
          <span v-if="errors.prioridad" class="form-error">{{ errors.prioridad }}</span>
        </div>
      </div>

      <!-- Descripción -->
      <div class="form-group">
        <label for="descripcion" class="form-label">
          Descripción Detallada <span class="required">*</span>
        </label>
        <textarea
          id="descripcion"
          v-model="form.descripcion"
          class="form-control"
          :class="{ 'is-invalid': errors.descripcion }"
          rows="4"
          placeholder="Detalla tu requerimiento o consulta con la mayor precisión posible..."
          :disabled="submitting"
        ></textarea>
        <span v-if="errors.descripcion" class="form-error">{{ errors.descripcion }}</span>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="submitting"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
        >
          <span v-if="submitting" class="spinner"></span>
          {{ submitting ? 'Enviando Solicitud...' : 'Enviar Solicitud' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORIAS_VALIDAS, PRIORIDADES_VALIDAS, validateRequest } from '@/utils/validateRequest'
import { useRequestStore } from '@/store/requestStore'

const router = useRouter()
const store = useRequestStore()

const emit = defineEmits(['form-submit', 'cancel'])

const form = reactive({
  titulo: '',
  categoria: '',
  prioridad: 'Media',
  descripcion: ''
})

const errors = reactive({
  titulo: '',
  categoria: '',
  prioridad: '',
  descripcion: ''
})

const submitting = ref(false)
const generalError = ref('')

const clearErrors = () => {
  errors.titulo = ''
  errors.categoria = ''
  errors.prioridad = ''
  errors.descripcion = ''
  generalError.value = ''
}

const handleSubmit = async () => {
  clearErrors()

  const validation = validateRequest(form)
  if (!validation.esValido) {
    Object.assign(errors, validation.errores)
    return
  }

  submitting.value = true
  try {
    const creada = await store.crearSolicitud({
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      prioridad: form.prioridad,
      descripcion: form.descripcion.trim(),
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString()
    })

    emit('form-submit', creada)
  } catch (err) {
    generalError.value = err.response?.data?.mensaje || err.message || 'Error al registrar la solicitud'
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  router.push('/solicitudes')
}
</script>

<style scoped>
.required-notice {
  font-size: 0.8rem;
  color: var(--gray-500);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-half {
  flex: 1;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.alert-danger {
  background-color: var(--danger-light);
  color: var(--danger-text);
  border: 1px solid #fecaca;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.4rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>