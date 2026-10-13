# Dockerfile del Worker (consumidor BRPOP de la cola) en TASKFLOW
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

# El worker no expone puertos: solo consume Redis y escribe en Mongo
USER node

# Forma exec (sin npm): SIGTERM llega directo a node y dispara el shutdown ordenado
CMD ["node", "worker.js"]
