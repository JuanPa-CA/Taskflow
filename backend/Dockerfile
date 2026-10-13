# Dockerfile del Backend (Express + Socket.IO) en TASKFLOW
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Dependencias primero para aprovechar la caché de capas
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

# El puerto real lo define la variable PORT (por defecto 4000)
EXPOSE 4000

# Sin privilegios de root
USER node

# Forma exec (sin npm): node es PID 1 y recibe SIGTERM para cerrar ordenadamente
CMD ["node", "server.js"]
