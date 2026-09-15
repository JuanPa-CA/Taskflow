<template>
  <MainLayout>
    <router-view />
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { useSocket } from '@/composables/useSocket'
import { useRequestStore } from '@/store/requestStore'

const { initGlobalListeners } = useSocket()
const store = useRequestStore()

onMounted(() => {
  initGlobalListeners()
  store.fetchSolicitudes()
})
</script>