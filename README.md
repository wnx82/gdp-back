<p align="center"><img src="http://www.peruwelz.be/uploads/page324/86c361ea300e6d3bccbe46573caa688a.jpg" alt="GDP Logo"></p>

<h1 align="center">GDP Portail</h1>


<div align="center">
  <a href="https://github.com/winnux82/habitations-back">
    <img src="https://img.shields.io/github/license/winnux82/nice-front-end-tutorial.svg" alt="LICENSE">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Coding-WnX-red.svg?style=flat" alt="Nice Front-End Tutorial">
  </a>
  <a href="[#](https://www.facebook.com/vandermeulen.christophe)">
   <img src="https://img.shields.io/badge/Messenger-%20ContactMe-brightgreen.svg" alt="Chat On facebook">
  </a>
  <a href="https://ekreativ.be">
    <img src="https://img.shields.io/badge/Website-eKreativ.be-%23a696c8.svg" alt="Blog Homepage">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Author-winnux82-%23a696c8.svg" alt="Author winnux82">
  </a>
</div>

<div align="center">
  <strong>🌍 Constantly updated ! 🆙 </strong>
</div>

## 📃 Description

Backend pour GDP - Portal 🆙


Cette API est une application de gestion pour le service GDP de la Ville de Mouscron. Elle permet la gestion de véhicules, des utilisateurs avec JWT pour la sécurité des données, la validation des identifiants pour les différentes routes, l'envoi de mails pour la validation des surveillances, des daily et des rapports journaliers. 

Elle offre également la validation JSON avec Joi, un accès avec différents niveaux d'autorisation, un contrôleur d'état, un système de mise en cache Redis, une recherche par immatriculation, localité et rue pour les constats ainsi qu'un tri des rues par localité, code postal, nom et quartier. 

Elle permet également la gestion des agents et des utilisateurs, des catégories pour les notes de rapports, des constats sur le terrain, des tâches journalières pour les équipes d'agents avec envoi de mail, des surveillances habitations, des horaires d'agents, des infractions les plus verbalisées, des missions journalières ou occasionnelles, des quartiers avec missions spécifiques, des rapports journaliers, des rues et des validations pour chaque surveillance d'habitation.

Elle me servira également comme TFE & déploiement pour mon stage de fin d'étude d'où sa complexité et le temps consacré!
Le front sera réalisé via Angular et le déploiement sur un serveur du service informatique de la Ville de Mouscron.


| [GDP Back](https://github.com/winnux82/gdp-back) | [GDP Front](https://github.com/winnux82/gdp-front) | GDP Android Application |


## 📥 Installation
<pre>
-   🐳 docker-compose up -d
-   📨 Importer dans Postman la collection GDP back via le fichier GDP Back.postman_collection dans le dossier racine.
-   env.example disponible

</pre>
## ✨ Features
-   CRUD Vehicules : Liste des véhicules du service
-   JWT on /users
-   ValidateId sur les routes pour vérifier la validité des id
-   sendMail pour la validations des surveillances, daily et rapports journaliers
-   Json Validator & Joi verification
-   Agent Level Access
-   Status controller
-   FlushAll Redis
-   Recherche par immatriculation, localité, rue pour les constats
-   Tri des rues par localité, cp, nom, quartier
-   CRUD Agents/Users
-   CRUD catégories pour notes des rapports
-   CRUD Constats qui permet aux agents de créer des constats sur le terrain
Constats possible sur 1 véhicule ou 1 personne avec adresse, l'infraction, PV bool, notes, annexes
-   CRUD Dailies : Créations de futures "tâches journalières" par équipe d'agents avec définition d'un quartier et les missions d'un quartier, ajout de missions supplémentaires.
🔖Possibilité d'envoyer par mail un "daily" aux agents concerné  
-   CRUD Habitations : Créations de futures surveillances habitations. Lors de leurs départ en vacances, des citoyens demandent un passage pour que les agents vérifient leur habitation. Les habitations déjà passées ou que la date de début est supérieur à la date du jour ne sont pas visibles. "HabitationsValides"
-   CRUD Horaires : Listes des différents horaires des agents
-   CRUD Infractions : Listes des infractions les plus verbalisées, triées par catégories et comprenant un tableau avec une liste des articles et le nom des infractions.
-   CRUD Missions : Liste non exhaustive des missions journalières ou occasionnelles.  Un quartier comprend une liste des missions.
-   CRUD Quartiers : Liste des différents quartiers de Mouscron. Chaque quartier comprend ses missions spécifiques.
-   CRUD Rapports : Dès qu'un agent reçoit sa "Daily" par mail (tâches journalières), il doit, à sa fin de service remplir un rapport.  Le rapport reprend la totalité de la daily mais avec un tableau des missions de quartiers effectuées et un tableau des missions globales effectuées. Dès qu'il soumet son rapport, un mail est envoyé à la responsable.
-   CRUD Rues : Liste de la totalité des Rues de l'entité Mouscronnoise. Au début, j'ai voulu interrogé une API du SPW mais ma responsable a demandé de pouvoir introduire elle même les futures Rues.
-   CRUD Validations : Une validation est réalisée à chaque surveillances habitations réalisée.  Un mail est alors envoyé à la responsable et au référent de la Police de Mouscron.
-   Création d'un access.log



## 🐉 Utilz!

-   [**Git Emojis**](https://gitmoji.dev/)
-   [**emojidb**](https://emojidb.org/facebook-emojis?user_typed_query=1&utm_source=user_search)
-   [**Listing Emojis**](emoji.md)
-   [**csv2json**](https://csvjson.com/csv2json)
-   [**Learn JWT**](https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314)

## 🐉 Notes!

-   à enlever dans le fichier ./helpers/sendMail.js si pas docker car dès que je passe par docker j'ai une erreur 
<code>
tls: {
    rejectUnauthorized: false,
},
</code>

-   protéger tous les dossiers autres que users grace à JWT une fois la phase déploiement lancée





-   [Tuto Get Data From server ✨](https://angular.io/tutorial/tour-of-heroes/toh-pt6)


## 🎨 Front-End Tutorial

-   [Angular](#)



## 👽 Back-End Tutorial

-   [Nodejs](https://github.com/geo6/geocoder-php-spw-provider)
-   [JWT](https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314)



## 🎣 Front-Back-End Tools

-   [csv2json](https://csvjson.com/csv2json)


## 🔨 Other Wizards List

-   [Docker 👏](/Docker.md) 
-   [Shields.io 👏](https://shields.io/) 
-   [Markdown Badges 👏](https://github.com/Ileriayo/markdown-badges) 
-   [Badge for github 👏](https://dev.to/envoy_/150-badges-for-github-pnk) 
-   [Codes de réponses HTTP 👏](https://developer.mozilla.org/fr/docs/Web/HTTP/Status) 



## Liens connexes


[![eKreativ](https://img.shields.io/badge/web-eKreativ.be-916FF?style=for-the-badge&logo=Node.js&logoColor=white&labelColor=101010)](https://eKreativ.be)

[![eafcm](https://img.shields.io/badge/web-eafcm.be-916FF?style=for-the-badge&logo=Node.js&logoColor=white&labelColor=101010)](https://eafcm.be)

[![MongoDb](https://img.shields.io/badge/MongoDb-6.0.4-4EA94B?style=for-the-badge&logo=MongoDb&logoColor=white&labelColor=101010)]()

[![NodeJs](https://img.shields.io/badge/NodeJS-18.13.0-9146FF?style=for-the-badge&logo=Node.js&logoColor=white&labelColor=101010)]()

[![Discord](https://img.shields.io/badge/Discord-Join_Us-5865F2?style=for-the-badge&logo=discord&logoColor=white&labelColor=101010)](https://discord.gg/xfz3WMrt)

[![Facebook](https://img.shields.io/badge/Facebook-Vandermeulen.christophe-1877F2?style=for-the-badge&logo=Facebook&logoColor=white&labelColor=101010)](https://www.facebook.com/vandermeulen.christophe)

[![Linkdin](https://img.shields.io/badge/LinkedIn-vandermeulen_christophe-0077B5?style=for-the-badge&logo=LinkedIn&logoColor=white&labelColor=101010)](https://www.linkedin.com/in/vandermeulen-christophe/)


## 👏 Congratulations

-   🈺  [Constantin Maes](https://www.linkedin.com/in/constantinmaes/)
-   🈺  [Samuel Lassoie](https://www.linkedin.com/in/samuel-lassoie-88769b91/)






| :-: | :-: | :-: | :-: |

| 😉 Vandermeulen Christophe alias WnX |

## License

[MIT](http://opensource.org/licenses/MIT)



Copyright (c) 2023-present, 

[winnux82](https://github.com/winnux82)


[![Web](https://img.shields.io/badge/GitHub-winnux82-14a1f0?style=for-the-badge&logo=github&logoColor=white&labelColor=101010)](https://github.com/winnux82)