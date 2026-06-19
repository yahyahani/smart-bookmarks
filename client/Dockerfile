# --- Fase 1: bouwen ---
# Hier compileren we de React-app naar statische HTML/CSS/JS-bestanden
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Fase 2: serveren ---
# We gebruiken een kleine nginx-image om alleen de gebouwde bestanden
# te serveren. Dit houdt de uiteindelijke container klein en snel.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
