# Utilise une image Node.js légère comme base
FROM node:alpine AS builder

# Définit le répertoire de travail pour les dépendances
WORKDIR /app

# Copie les fichiers de l'application
COPY package*.json ./

# Installation des dépendances
RUN npm install --production

# Crée une image légère pour l'application
FROM node:alpine

# Définit le répertoire de travail pour l'application
WORKDIR /app

# Copie les fichiers de l'application depuis le conteneur de construction
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Copie le fichier .env.docker vers .env
COPY .env.docker ./.env

# Installation de nodemon
RUN npm install -g nodemon

# Expose le port utilisé par l'application
EXPOSE 3003

# Démarre l'application avec nodemon
CMD nodemon /app/bin/www
