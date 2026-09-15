<template>
  <div class="app-container">
    <header class="navbar">
      <div class="navbar-container">
        <div class="navbar-left">
          <router-link to="/" class="navbar-brand">
            <img src="@/assets/logo.svg" alt="TASKFLOW" class="navbar-logo-img" />
            <span>TASKFLOW</span>
          </router-link>

          <button
            class="mobile-toggle"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line v-if="!mobileMenuOpen" x1="3" x2="21" y1="6" y2="6"/>
              <line v-if="!mobileMenuOpen" x1="3" x2="21" y1="12" y2="12"/>
              <line v-if="!mobileMenuOpen" x1="3" x2="21" y1="18" y2="18"/>
              <line v-if="mobileMenuOpen" x1="18" x2="6" y1="6" y2="18"/>
              <line v-if="mobileMenuOpen" x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>

        <nav :class="['navbar-links', { 'mobile-open': mobileMenuOpen }]">
          <router-link
            to="/"
            class="nav-link"
            exact-active-class="router-link-active"
            @click="mobileMenuOpen = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            Dashboard
          </router-link>

          <router-link
            to="/solicitudes"
            class="nav-link"
            @click="mobileMenuOpen = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
              <path d="M12 11h4"/>
              <path d="M12 16h4"/>
              <path d="M8 11h.01"/>
              <path d="M8 16h.01"/>
            </svg>
            Solicitudes
          </router-link>

          <router-link
            to="/solicitudes/nueva"
            class="nav-link"
            @click="mobileMenuOpen = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Nueva Solicitud
          </router-link>

          <router-link
            to="/monitor"
            class="nav-link"
            @click="mobileMenuOpen = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <line x1="8" x2="16" y1="21" y2="21"/>
              <line x1="12" x2="12" y1="17" y2="21"/>
              <polyline points="7 10 10 13 17 6"/>
            </svg>
            Monitor
          </router-link>
        </nav>

        <div class="navbar-actions">
          <div
            :class="['socket-status-badge', isConnected ? 'online' : 'offline']"
            :title="isConnected ? 'Servidor WebSocket en tiempo real conectado' : 'Sin conexión en tiempo real con el servidor'"
          >
            <span class="socket-dot"></span>
            <span>{{ isConnected ? 'En Vivo' : 'Desconectado' }}</span>
          </div>

          <router-link to="/solicitudes/nueva" class="btn btn-primary btn-sm">
            + Nueva
          </router-link>
        </div>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <!-- Notificaciones Toast en tiempo real -->
    <div class="toast-container" v-if="store.toasts && store.toasts.length > 0">
      <div
        v-for="toast in store.toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.tipo}`]"
        @click="store.removeToast(toast.id)"
      >
        <span class="toast-icon">
          <template v-if="toast.tipo === 'success'">✓</template>
          <template v-else-if="toast.tipo === 'error'">✕</template>
          <template v-else>ℹ</template>
        </span>
        <span class="toast-message">{{ toast.mensaje }}</span>
        <button class="toast-close" @click.stop="store.removeToast(toast.id)">&times;</button>
      </div>
    </div>

    <footer class="app-footer">
      <p>TASKFLOW &copy; {{ year }} — Arquitectura Distribuida Full Stack (SENA)</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { isSocketConnected } from '@/plugins/socket'
import { useRequestStore } from '@/store/requestStore'

const isConnected = isSocketConnected
const store = useRequestStore()
const mobileMenuOpen = ref(false)
const year = computed(() => new Date().getFullYear())
</script>

<style scoped>
.navbar-logo-img {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: block;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border-color);
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--gray-700);
  cursor: pointer;
}

.toast-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
  padding: 0 0.25rem;
}
.toast-close:hover {
  opacity: 1;
}

.app-footer {
  text-align: center;
  padding: 1.5rem;
  color: var(--gray-500);
  font-size: 0.85rem;
  border-top: 1px solid var(--border-color);
  background: white;
  margin-top: auto;
}

@media (max-width: 768px) {
  .navbar-left {
    width: 100%;
    justify-content: space-between;
  }

  .mobile-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .navbar-links {
    display: none;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .navbar-links.mobile-open {
    display: flex;
  }
}
</style>
