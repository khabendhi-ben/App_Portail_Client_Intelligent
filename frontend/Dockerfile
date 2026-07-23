# Étape 1 : Compiler l'application React avec Node.js
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Servir l'application compilée avec un serveur web Nginx
FROM nginx:stable-alpine
# Copier la configuration Nginx pour React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copier les fichiers du dossier de build vers le dossier public d'Nginx
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]