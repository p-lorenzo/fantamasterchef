# Stage 1: Build del Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup del Backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/

# Copia la build di React dentro la cartella dist del backend
COPY --from=frontend-build /app/frontend/dist ./backend/dist

EXPOSE 3001
CMD ["node", "backend/server.js"]
