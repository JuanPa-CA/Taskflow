import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axiosPlugin from './plugins/axios'
import socketPlugin from './plugins/socket'
import './styles/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(axiosPlugin)
app.use(socketPlugin)

app.mount('#app')