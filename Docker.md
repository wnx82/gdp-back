# Useful Docker Commands

## Docker Machine

-   `docker-machine start` - Start VM
-   `docker-machine stop` - Stop VM
-   `docker-machine env` - Display Docker client setup commands

## Docker Client

-   `docker <command> --help` - Get help on a specific command
-   `docker pull <Name of Image>` - Pull image from Docker Hub
-   `docker images` - Show all images
-   `docker image prune` - Erase all images not used
-   `docker inspect <Name of container>` - Show all images
-   `docker rmi <ImageID>` - Remove specific images
-   `docker rmi $(docker images | grep "^<none>" | awk "{print $3}")` - Remove untagged images - <none>
-   `docker ps` - Show containers up
-   `docker ps -a` - Show all containers
-   `docker ps --no-trunc --all` - Show all containers
-   `docker logs -f id` - Show logs of container id
-   `docker rm <ContainerID>` -Remove specific container
-   `docker rm $(docker ps -a -q)` Remove all containers
-   `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'` - Formatted list of containers
-   `docker run -d --name <Container Name> -p <External Port>:<Container Port> <Your Image>` - Run a container
-   `docker build -f <Your Dockerfile> -t <Tag Name> .` - Build an image from a Dockerfile
-   `docker login` - Login using your Docker credentials
-   `docker push <Your Image Name>` - Push an image to Docker hub
-   `docker network` - The ‘docker network’ command is used to know the details of the list of networks in the cluster.
-   `docker stop <Name/ID of container>` - Stop container
-   `docker kill <Name/ID of container>` - stop the container immediately by killing its execution
-   `docker restart <Name/ID of container>` - Stop container
-   `docker version` - Docker Version
-   `docker search <Container>` - Search specific image

-   `docker build -t test_sam .` - lancer le container
-   `docker build -t test_mongo` -

## Docker Compose

-   `docker-compose build` - Build images based on docker-compose
-   `docker-compose images` - Images of docker-compose
-   `docker-compose up` - Start image,
-   `docker-compose up -d` - Start in daemon mode in the background
-   `docker-compose logs` - Show logs from containers
-   `docker-compose logs -f ID` - Show logs from container ID
-   `docker-compose up` - Start containers based on docker-compose
-   `docker-compose stop` - Stop containers
-   `docker-compose down` - Stop and remove containers

pour myqsl
docker run --name some-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=eleve -d mysql

pour mongodb
docker run --name some-mongo -p 27017:27017 -d mongo

Créer un container mongo :

mkdir database
cd database
mkdir mongodb_6
code .
créer un fichier docker-compose.yml

version: "3.7"
services:
mongo:
image: mongo:latest
container_name: mongodb_6
environment:
MONGO_INITDB_ROOT_USERNAME: root
MONGO_INITDB_ROOT_PASSWORD: root
ports: - 27017:27017
volumes: - ../mongodb_data_container:/database/mongodb_6

docker-compose logs -f ID

//mettre à jour sur l'image utilisée par le container
docker-compose pull odoo-web

//supprimer

docker-compose down

avoir accès au container par terminal
docker exec -it odoo-web bash

//docker-compose up -d (pour 'détacher')

Lancer à partir du dossier
docker-compose ps
//savoir la liste des containers lancés
docker-compose up -d

cp -r mongodb_6 mongodb_6_maes
aller dedans
modifier le fichier yml en conséquence

Docker

docker run --name some-mongo -p 27017:27017 -d mongo

docker run --name some-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=eleve -d mysql

docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=eleve -d mysql:tag --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci--character-set-server=utf8mb4

docker run --name=some-mysql -p 3306:3306 -d mysql/mysql-server:tag

docker run -it --network some-network --rm mysql mysql -hsome-mysql -uexample-user -p

passport js

use tests
show dbs
show collections

t = new ObjectId("5553a998e4b02cf7151190b8")
t.getTimestamp()

db.listingAirbnb

ctrl l

db.listingAirbnb.find({security_deposit: 200}).count();
db.listingAirbnb.find({bedrooms:{$gt:4}}).count()
db.listingAirbnb.find({reviews:{$size: 17}}).count()

aggregations

ng new ng-pokemon-app --minimal --style=css
