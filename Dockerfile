

# Utilise une image Node.js comme base
FROM node:18-alpine AS builder
# Définit le répertoire de travail pour les dépendances
WORKDIR /app
# Copie le fichier package.json et le fichier package-lock.json
COPY package*.json ./
# Copie le fichier .env.docker vers .env
COPY .env.docker ./.env
# Crée une image légère pour l'application
FROM node:18-alpine
# Définit le répertoire de travail pour l'application
WORKDIR /app
# Copie les fichiers de l'application depuis le conteneur de construction
COPY --from=builder /app .
# Ajoute le chemin node_modules/.bin au PATH
ENV PATH /app/node_modules/.bin:$PATH
# Installation des dépendances
RUN npm install
# Installation de nodemon
RUN npm install -g nodemon
# Expose le port utilisé par l'application
EXPOSE 3003
# Démarre l'application
CMD ["nodemon", "/app/seed.js"]
CMD ["nodemon", "/app/bin/www"]
# CMD ["node", "bin/www"]
