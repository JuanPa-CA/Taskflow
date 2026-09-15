<template>
  <span :class="badgeClass">
    <span class="badge-icon" v-if="showDot">●</span>
    {{ estado || 'DESCONOCIDO' }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: {
    type: String,
    required: true
  },
  showDot: {
    type: Boolean,
    default: false
  }
})

const badgeClass = computed(() => {
  switch (props.estado) {
    case 'PENDIENTE':
      return 'badge-status badge-pendiente'
    case 'EN COLA':
      return 'badge-status badge-encola'
    case 'PROCESANDO':
      return 'badge-status badge-procesando'
    case 'RESPONDIDA':
      return 'badge-status badge-respondida'
    case 'ERROR':
      return 'badge-status badge-error'
    default:
      return 'badge-status badge-pendiente'
  }
})
</script>

<style scoped>
.badge-icon {
  font-size: 0.6rem;
  margin-right: 0.15rem;
}
</style>
