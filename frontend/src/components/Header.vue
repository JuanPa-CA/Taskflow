<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">{{ titulo }}</h1>
      <p v-if="subtitulo" class="page-subtitle">{{ subtitulo }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  titulo: {
    type: String,
    required: true
  },
  subtitulo: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>