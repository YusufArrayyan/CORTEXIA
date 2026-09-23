# Multi-stage build for production

FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS production
WORKDIR /app
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["node", "src/app.js"]
