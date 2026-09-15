import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/solicitudes',
    name: 'Requests',
    component: () => import('@/views/RequestsView.vue')
  },
  {
    path: '/solicitudes/nueva',
    name: 'NewRequest',
    component: () => import('@/views/NewRequestView.vue')
  },
  {
    path: '/solicitudes/:id',
    name: 'RequestDetail',
    component: () => import('@/views/RequestDetailView.vue')
  },
  {
    path: '/monitor',
    name: 'Monitor',
    component: () => import('@/views/MonitorView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router