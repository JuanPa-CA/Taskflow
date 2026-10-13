# Multi-stage Dockerfile para Frontend Vue 3 en TASKFLOW
# Etapa 1: Construcción de la aplicación con Node.js y Vite
FROM node:20-alpine AS build-stage
WORKDIR /app

# Variables de Vite: se incrustan en el bundle durante "npm run build".
# Llegan como build args desde docker-compose.yml.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Instalar dependencias aprovechando la caché de capas de Docker
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar para producción
COPY . .
RUN npm run build

# Etapa 2: Servidor de producción ligero con Nginx
FROM nginx:alpine AS production-stage

# Copiar artefactos compilados desde la etapa previa
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx con soporte para Vue Router (HTML5 History Mode)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto HTTP del contenedor
EXPOSE 80

# Iniciar servidor web Nginx
CMD ["nginx", "-g", "daemon off;"]
