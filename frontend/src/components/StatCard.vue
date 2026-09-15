<template>
  <div :class="['stat-card', `stat-${tipo}`]">
    <div class="stat-header">
      <span class="stat-label">{{ titulo }}</span>
      <div class="stat-icon-wrapper">
        <slot name="icon">
          <!-- Default fallback SVG icon based on tipo -->
          <svg v-if="tipo === 'total'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <svg v-else-if="tipo === 'pendiente'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <svg v-else-if="tipo === 'encola'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <svg v-else-if="tipo === 'procesando'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <svg v-else-if="tipo === 'respondida'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <svg v-else-if="tipo === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
        </slot>
      </div>
    </div>
    <div class="stat-value">{{ valor }}</div>
  </div>
</template>

<script setup>
defineProps({
  titulo: {
    type: String,
    required: true
  },
  valor: {
    type: [Number, String],
    default: 0
  },
  tipo: {
    type: String,
    default: 'total' // total, pendiente, encola, procesando, respondida, error
  }
})
</script>