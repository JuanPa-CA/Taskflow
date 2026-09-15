<template>
  <button
    :type="type"
    :class="['btn', 'btn-secondary', `btn-${size}`, { disabled: disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot>{{ texto }}</slot>
  </button>
</template>

<script setup>
defineProps({
  texto: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'button'
  },
  size: {
    type: String,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>