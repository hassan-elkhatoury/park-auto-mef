# ==============================================================================
# Dockerfile Multi-Stage — Frontend Park Auto MEF (React / Tailwind / Vite)
# Conforme aux normes d'optimisation d'images et de sécurité
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1 : Construction et Minification Vite
# ------------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Optimisation du cache de dépendances npm
COPY package*.json ./
RUN npm install

# Copie des sources et compilation de production
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2 : Serveur Web Nginx Haute Performance
# ------------------------------------------------------------------------------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Suppression de la configuration Nginx par défaut
RUN rm -rf /etc/nginx/conf.d/*

# Copie de la configuration Nginx optimisée pour l'application MEF
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des assets minifiés depuis le stage de build
COPY --from=build /app/dist .

# Exposition du port HTTP
EXPOSE 80

# Démarrage de Nginx au premier plan
CMD ["nginx", "-g", "daemon off;"]
